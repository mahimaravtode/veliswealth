import { Response } from 'express';
import { NseIndia } from 'stock-nse-india';
import MarketMover from '../models/MarketMover';
import StockList from '../models/StockList';

const nseIndia = new NseIndia();

const INDEX_WATCHLIST = [
  { symbol: 'NIFTY 50', name: 'Nifty 50', type: 'Index' as const },
  { symbol: 'NIFTY BANK', name: 'Bank Nifty', type: 'Index' as const },
  { symbol: 'NIFTY IT', name: 'Nifty IT', type: 'Index' as const },
  { symbol: 'NIFTY MIDCAP 50', name: 'Nifty Midcap 50', type: 'Index' as const },
];

const sseClients = new Set<Response>();
let lastBroadcastHash = '';
let consecutiveErrors = 0;
let currentInterval = 5000;

export function addSSEClient(res: Response): void {
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
}

function broadcast(data: unknown): void {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

function hasDataChanged(newData: unknown): boolean {
  const newHash = JSON.stringify(newData);
  if (newHash !== lastBroadcastHash) {
    lastBroadcastHash = newHash;
    return true;
  }
  return false;
}

interface MarketUpdateData {
  symbol: string;
  name: string;
  type: 'Stock' | 'Index';
  exchange?: string;
  lastPrice: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  prevClose?: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  circuitHit?: string;
  timestamp: Date;
}

async function fetchAllIndices(): Promise<MarketUpdateData[]> {
  const results: MarketUpdateData[] = [];

  for (const idx of INDEX_WATCHLIST) {
    try {
      const data = await nseIndia.getEquityStockIndices(idx.symbol);
      const m = data.metadata;
      results.push({
        symbol: idx.symbol,
        name: idx.name,
        type: 'Index',
        lastPrice: m.last,
        openPrice: m.open,
        highPrice: m.high,
        lowPrice: m.low,
        prevClose: m.previousClose,
        change: m.last - m.previousClose,
        changePercent: parseFloat(((m.last - m.previousClose) / m.previousClose * 100).toFixed(2)),
        timestamp: new Date()
      });
    } catch (err) {
      // skip failed index
    }
  }
  return results;
}

async function fetchAllNiftyStocks(): Promise<MarketUpdateData[]> {
  const results: MarketUpdateData[] = [];
  const seen = new Set<string>();

  const indexNames = ['NIFTY 50', 'NIFTY BANK', 'NIFTY MIDCAP 50', 'NIFTY NEXT 50'];

  for (const indexName of indexNames) {
    try {
      const data = await nseIndia.getEquityStockIndices(indexName);
      for (const quote of data.data) {
        if (seen.has(quote.symbol)) continue;
        seen.add(quote.symbol);

        let circuitHit = 'None';
        if (quote.pChange >= 5) circuitHit = 'Upper';
        else if (quote.pChange <= -5) circuitHit = 'Lower';

        results.push({
          symbol: quote.symbol,
          name: quote.symbol,
          type: 'Stock',
          exchange: 'NSE',
          lastPrice: quote.lastPrice,
          openPrice: quote.open,
          highPrice: quote.dayHigh,
          lowPrice: quote.dayLow,
          prevClose: quote.previousClose,
          change: quote.change,
          changePercent: quote.pChange,
          volume: quote.totalTradedVolume,
          circuitHit,
          timestamp: new Date()
        });
      }
    } catch (err) {
      // skip failed index
    }
  }
  return results;
}

export async function fetchLivePriceForSymbol(symbol: string): Promise<MarketUpdateData | null> {
  try {
    const quote = await nseIndia.getEquityDetails(symbol);
    const p = quote.priceInfo;

    let circuitHit = 'None';
    if (p.pChange >= 5) circuitHit = 'Upper';
    else if (p.pChange <= -5) circuitHit = 'Lower';

    return {
      symbol,
      name: quote.info?.companyName || symbol,
      type: 'Stock',
      exchange: 'NSE',
      lastPrice: p.lastPrice,
      openPrice: p.open,
      highPrice: p.intraDayHighLow?.max || 0,
      lowPrice: p.intraDayHighLow?.min || 0,
      prevClose: p.previousClose,
      change: p.change,
      changePercent: p.pChange,
      volume: (quote as any).securityWiseDP?.quantityTraded || 0,
      marketCap: (quote.info as any)?.totalMarketCap || (quote.info as any)?.issuedSize || 0,
      circuitHit,
      timestamp: new Date()
    };
  } catch {
    return null;
  }
}

async function updateStockListPrices(stockData: MarketUpdateData[]): Promise<void> {
  const bulkOps = stockData.map(item => ({
    updateOne: {
      filter: { symbol: item.symbol, exchange: 'NSE' },
      update: {
        $set: {
          lastPrice: item.lastPrice,
          change: item.change,
          changePercent: item.changePercent,
          volume: item.volume || 0,
          marketCap: item.marketCap || 0,
          name: item.name,
          lastUpdated: new Date()
        }
      },
      upsert: true
    }
  }));

  if (bulkOps.length > 0) {
    await StockList.bulkWrite(bulkOps as any, { ordered: false }).catch(() => {});
  }
}

export async function updateDailyMarketData(): Promise<void> {
  try {
    const [indices, niftyStocks] = await Promise.all([
      fetchAllIndices(),
      fetchAllNiftyStocks()
    ]);

    const allStocks = [...niftyStocks];
    const allProcessed = [...indices, ...niftyStocks];

    const liveData = {
      indices,
      gainers: [...allStocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 10),
      losers: [...allStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10),
      allStocks: allStocks
    };

    if (hasDataChanged(liveData)) {
      broadcast(liveData);

      for (const item of allProcessed) {
        updateMarketMover(item).catch(() => {});
      }

      updateStockListPrices(allStocks).catch(() => {});
    }

    consecutiveErrors = 0;
    if (currentInterval !== 5000) {
      currentInterval = 5000;
      console.log('Rate limit recovered, resuming 5-second polling');
    }
  } catch (error: any) {
    consecutiveErrors++;
    console.error(`NSE API Error (attempt ${consecutiveErrors}):`, error.message);

    if (consecutiveErrors >= 3) {
      currentInterval = Math.min(currentInterval * 2, 60000);
      console.log(`Rate limited - backing off to ${currentInterval / 1000}s intervals`);
    }
  }
}

export async function fetchAllStocksLive(): Promise<{
  count: number;
  stocks: MarketUpdateData[];
}> {
  const symbols = await nseIndia.getAllStockSymbols();
  const allStocks: MarketUpdateData[] = [];
  const BATCH_SIZE = 5;
  const DELAY_MS = 1000;

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(sym => fetchLivePriceForSymbol(sym))
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        allStocks.push(r.value);
      }
    }

    if (i + BATCH_SIZE < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  await updateStockListPrices(allStocks);

  return { count: allStocks.length, stocks: allStocks };
}

async function updateMarketMover(updateData: MarketUpdateData): Promise<void> {
  try {
    const existing = await MarketMover.findOne({ symbol: updateData.symbol });
    let history = existing?.history || [];
    history.push({ price: updateData.lastPrice, timestamp: new Date() });
    if (history.length > 100) history.shift();
    (updateData as any).history = history;

    await MarketMover.findOneAndUpdate(
      { symbol: updateData.symbol },
      updateData,
      { upsert: true }
    );
  } catch (err) {
    // Silent fail for DB updates
  }
}

export function getCurrentInterval(): number {
  return currentInterval;
}
