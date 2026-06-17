const { NseIndia } = require('stock-nse-india');
const nseIndia = new NseIndia();
const MarketMover = require('../models/MarketMover');

const WATCHLIST = [
  // Indices
  { symbol: 'NIFTY 50', name: 'Nifty 50', type: 'Index' },
  { symbol: 'NIFTY BANK', name: 'Bank Nifty', type: 'Index' },
  { symbol: 'NIFTY IT', name: 'Nifty IT', type: 'Index' },
  { symbol: 'NIFTY MIDCAP 50', name: 'Nifty Midcap 50', type: 'Index' },
  
  // NSE Stocks
  { symbol: 'RELIANCE', name: 'Reliance Industries', type: 'Stock' },
  { symbol: 'TCS', name: 'TCS', type: 'Stock' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', type: 'Stock' },
  { symbol: 'INFY', name: 'Infosys', type: 'Stock' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', type: 'Stock' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', type: 'Stock' },
  { symbol: 'SBIN', name: 'State Bank of India', type: 'Stock' },
  { symbol: 'ZOMATO', name: 'Zomato', type: 'Stock' },
  { symbol: 'ITC', name: 'ITC', type: 'Stock' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', type: 'Stock' },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', type: 'Stock' },
  { symbol: 'WIPRO', name: 'Wipro', type: 'Stock' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', type: 'Stock' },
  { symbol: 'TATASTEEL', name: 'Tata Steel', type: 'Stock' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', type: 'Stock' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', type: 'Stock' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints', type: 'Stock' },
  { symbol: 'TITAN', name: 'Titan Company', type: 'Stock' },
  { symbol: 'JSWSTEEL', name: 'JSW Steel', type: 'Stock' },
  { symbol: 'ONGC', name: 'ONGC', type: 'Stock' }
];

// SSE clients
const sseClients = new Set();

const priceCache = new Map();
let lastBroadcastHash = '';
let consecutiveErrors = 0;
let currentInterval = 1000;

function addSSEClient(res) {
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
}

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

function hasDataChanged(newData) {
  const newHash = JSON.stringify(newData);
  if (newHash !== lastBroadcastHash) {
    lastBroadcastHash = newHash;
    return true;
  }
  return false;
}

async function updateDailyMarketData() {
  try {
    // Fetch indices in PARALLEL for speed
    const [indexData, bankNiftyData, midcapData, next50Data] = await Promise.all([
      nseIndia.getEquityStockIndices('NIFTY 50'),
      nseIndia.getEquityStockIndices('NIFTY BANK'),
      nseIndia.getEquityStockIndices('NIFTY MIDCAP 50'),
      nseIndia.getEquityStockIndices('NIFTY NEXT 50')
    ]);

    // Combine all stocks from these indices
    const allStockQuotes = [
      ...indexData.data,
      ...bankNiftyData.data,
      ...midcapData.data,
      ...next50Data.data
    ];

    const processed = [];

    // Process Indices
    const indicesToUpdate = [indexData, bankNiftyData, midcapData];
    for (const idx of indicesToUpdate) {
        const config = WATCHLIST.find(w => w.symbol === idx.name && w.type === 'Index');
        if (!config) continue;

        const updateData = {
            symbol: config.symbol,
            name: config.name,
            type: 'Index',
            lastPrice: idx.metadata.last,
            openPrice: idx.metadata.open,
            highPrice: idx.metadata.high,
            lowPrice: idx.metadata.low,
            prevClose: idx.metadata.previousClose,
            change: idx.metadata.last - idx.metadata.previousClose,
            changePercent: parseFloat(((idx.metadata.last - idx.metadata.previousClose) / idx.metadata.previousClose * 100).toFixed(2)),
            timestamp: new Date()
        };
        processed.push(updateData);
    }

    // Process Stocks from Watchlist
    const watchlistStocks = WATCHLIST.filter(w => w.type === 'Stock');
    for (const config of watchlistStocks) {
        const quote = allStockQuotes.find(q => q.symbol === config.symbol);
        
        if (quote) {
            const updateData = {
                symbol: quote.symbol,
                name: config.name,
                type: 'Stock',
                lastPrice: quote.lastPrice,
                openPrice: quote.open,
                highPrice: quote.dayHigh,
                lowPrice: quote.dayLow,
                prevClose: quote.previousClose,
                change: quote.change,
                changePercent: quote.pChange,
                volume: quote.totalTradedVolume,
                timestamp: new Date()
            };

            let circuitHit = 'None';
            if (quote.pChange >= 5) circuitHit = 'Upper';
            else if (quote.pChange <= -5) circuitHit = 'Lower';
            updateData.circuitHit = circuitHit;

            processed.push(updateData);
        } else {
            try {
                const individualQuote = await nseIndia.getEquityDetails(config.symbol);
                const priceInfo = individualQuote.priceInfo;

                const updateData = {
                    symbol: config.symbol,
                    name: config.name,
                    type: 'Stock',
                    lastPrice: priceInfo.lastPrice,
                    openPrice: priceInfo.open,
                    highPrice: priceInfo.intraDayHighLow.max,
                    lowPrice: priceInfo.intraDayHighLow.min,
                    prevClose: priceInfo.previousClose,
                    change: priceInfo.change,
                    changePercent: priceInfo.pChange,
                    timestamp: new Date()
                };
                processed.push(updateData);
            } catch (err) {
                // Silent fail for individual stocks
            }
        }
    }

    const stocks = processed.filter(p => p.type === 'Stock');
    const indices = processed.filter(p => p.type === 'Index');

    const liveData = {
      indices,
      gainers: [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 10),
      losers: [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10)
    };
    
    // Only broadcast if data actually changed
    if (hasDataChanged(liveData)) {
      broadcast(liveData);
      
      // Update DB in background (non-blocking)
      for (const item of processed) {
        updateMarketMover(item).catch(() => {});
      }
    }
    
    // Reset error counter on success
    consecutiveErrors = 0;
    if (currentInterval !== 1000) {
      currentInterval = 1000;
      console.log('Rate limit recovered, resuming 1-second polling');
    }
  } catch (error) {
    consecutiveErrors++;
    console.error(`NSE API Error (attempt ${consecutiveErrors}):`, error.message);
    
    // Back off if rate limited
    if (consecutiveErrors >= 3) {
      currentInterval = Math.min(currentInterval * 2, 30000);
      console.log(`Rate limited - backing off to ${currentInterval/1000}s intervals`);
    }
  }
}

async function updateMarketMover(updateData) {
    try {
        const existing = await MarketMover.findOne({ symbol: updateData.symbol });
        let history = existing?.history || [];
        history.push({ price: updateData.lastPrice, timestamp: new Date() });
        if (history.length > 100) history.shift();
        updateData.history = history;

        await MarketMover.findOneAndUpdate(
            { symbol: updateData.symbol },
            updateData,
            { upsert: true }
        );
    } catch (err) {
        // Silent fail for DB updates
    }
}

function getCurrentInterval() {
  return currentInterval;
}

module.exports = { updateDailyMarketData, addSSEClient, broadcast, getCurrentInterval };
