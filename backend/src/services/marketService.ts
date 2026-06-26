import MarketMover, { IMarketMoverDocument } from '../models/MarketMover';
import MarketStats from '../models/MarketStats';
import { fetchTwelveDataQuote } from './twelveDataService';
import { toTwelveDataSymbol } from './twelveDataSymbolMapper';
import { fetchYahooQuote, fetchYahooChart, fetchYahooSearch } from './yahooService';
import { getMarketStatus, hadTradingSessionToday } from '../utils/marketHours';
import { Response } from 'express';

let isUpdatingDaily = false;
let lastDataUpdateTime: Date | null = null;

export const WATCHLIST = [
  { symbol: '^NSEI', name: 'Nifty 50', type: 'Index' as const },
  { symbol: '^BSESN', name: 'SENSEX', type: 'Index' as const },
  { symbol: '^NSEBANK', name: 'Bank Nifty', type: 'Index' as const },
  { symbol: '^CNXIT', name: 'Nifty IT', type: 'Index' as const },
  { symbol: '^NSEMDCP50', name: 'Nifty Midcap 50', type: 'Index' as const },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', type: 'Stock' as const },
  { symbol: 'TCS.NS', name: 'TCS', type: 'Stock' as const },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', type: 'Stock' as const },
  { symbol: 'INFY.NS', name: 'Infosys', type: 'Stock' as const },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', type: 'Stock' as const },
  { symbol: 'TMPV.NS', name: 'Tata Motors', type: 'Stock' as const },
  { symbol: 'SBIN.NS', name: 'State Bank of India', type: 'Stock' as const },
  { symbol: 'ETERNAL.NS', name: 'Zomato (Eternal)', type: 'Stock' as const },
  { symbol: 'ITC.NS', name: 'ITC', type: 'Stock' as const },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', type: 'Stock' as const },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', type: 'Stock' as const },
  { symbol: 'WIPRO.NS', name: 'Wipro', type: 'Stock' as const },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', type: 'Stock' as const },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', type: 'Stock' as const },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever', type: 'Stock' as const },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', type: 'Stock' as const },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints', type: 'Stock' as const },
  { symbol: 'TITAN.NS', name: 'Titan Company', type: 'Stock' as const },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel', type: 'Stock' as const },
  { symbol: 'ONGC.NS', name: 'ONGC', type: 'Stock' as const },
  { symbol: 'RELIANCE.BO', name: 'Reliance (BSE)', type: 'Stock' as const },
  { symbol: 'TCS.BO', name: 'TCS (BSE)', type: 'Stock' as const }
];

export const WATCHLIST_SYMBOLS = WATCHLIST.map((w) => w.symbol);

const sseClients = new Set<Response>();
let marketDataCache = new Map<string, any>();
const loggedQuoteFailures = new Set<string>();

export function addSSEClient(res: Response) {
  sseClients.add(res);
  res.on('close', () => sseClients.delete(res));
}

export function broadcastToClients(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

export async function startMarketSimulation() {
  console.log('Starting real-time market simulation...');
  try {
    const movers = await MarketMover.find() as IMarketMoverDocument[];
    movers.forEach(m => {
      marketDataCache.set(m.symbol, {
        symbol: m.symbol,
        name: m.name,
        price: m.lastPrice,
        change: m.change || 0,
        changePercent: m.changePercent || 0,
        prevClose: m.prevClose || (m.lastPrice - (m.change || 0)),
        volume: m.volume || 0,
        type: m.type
      });
    });
  } catch (err) {
    console.error('Error loading initial market data for simulation:', err);
  }

  setInterval(() => {
    const status = getMarketStatus();
    const updates: any[] = [];

    if (status.isOpen) {
      // Market is open — apply micro-movements to simulate tick data
      marketDataCache.forEach((data, symbol) => {
        const movement = (Math.random() - 0.5) * 0.0004;
        const newPrice = data.price * (1 + movement);
        const change = newPrice - data.prevClose;
        const changePercent = (change / data.prevClose) * 100;
        const updated = {
          ...data,
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          lastUpdate: new Date()
        };
        marketDataCache.set(symbol, updated);
        updates.push({
          symbol: updated.symbol,
          price: updated.price,
          change: updated.change,
          changePercent: updated.changePercent
        });
      });
    }
    // When market is closed, broadcast last known prices without modification

    if (updates.length > 0 && sseClients.size > 0) {
      broadcastToClients({ type: 'ticker_update', data: updates, timestamp: new Date().toISOString() });
    }
  }, 1000);
}

export function getMarketStatusInfo() {
  const status = getMarketStatus();
  return {
    ...status,
    lastDataUpdate: lastDataUpdateTime?.toISOString() || null,
    hasData: marketDataCache.size > 0,
  };
}

async function fetchQuoteWithFallback(symbol: string): Promise<any> {
  const q = await fetchYahooQuote(symbol);
  if (q) return q;

  if (!loggedQuoteFailures.has(symbol)) {
    loggedQuoteFailures.add(symbol);
    console.log(`Yahoo failed for ${symbol}, trying Twelve Data...`);
  }
  const tdSymbol = toTwelveDataSymbol(symbol);
  if (tdSymbol !== symbol) {
    try {
      const tdQ = await fetchTwelveDataQuote(tdSymbol);
      if (tdQ) return tdQ;
    } catch {}
  }

  const cached = marketDataCache.get(symbol);
  if (cached && !loggedQuoteFailures.has(`${symbol}:cache`)) {
    loggedQuoteFailures.add(`${symbol}:cache`);
    console.log(`Using cached data for ${symbol}`);
  }
  if (cached) return cached;
  return null;
}

export async function updateDailyMarketData() {
  if (isUpdatingDaily) {
    console.log('Skipping update — previous update still running.');
    return;
  }
  isUpdatingDaily = true;
  try {
    let advances = 0;
    let declines = 0;
    let unchanged = 0;

    for (const config of WATCHLIST) {
      const origSymbol = config.symbol;
      const q = await fetchQuoteWithFallback(origSymbol);
      if (!q) continue;

      const changePercent = q.changePercent;
      let circuitHit: 'Upper' | 'Lower' | 'None' = 'None';
      if (changePercent >= 5) circuitHit = 'Upper';
      else if (changePercent <= -5) circuitHit = 'Lower';

      // Count market breadth for stocks only (not indices)
      if (config.type === 'Stock') {
        if (changePercent > 0) advances++;
        else if (changePercent < 0) declines++;
        else unchanged++;
      }

      const updateData: any = {
        symbol: origSymbol,
        name: config.name,
        type: config.type,
        lastPrice: q.price,
        openPrice: q.open,
        highPrice: q.high,
        lowPrice: q.low,
        prevClose: q.prevClose,
        change: q.change,
        changePercent: typeof changePercent === 'number' ? changePercent.toFixed(2) : changePercent,
        volume: q.volume,
        marketCap: q.marketCap || 0,
        circuitHit: circuitHit,
        fundamentals: { peRatio: q.pe || null, pbRatio: null, eps: null, dividendYield: q.dividendYield || null },
        timestamp: new Date()
      };

      marketDataCache.set(origSymbol, {
        symbol: origSymbol,
        name: config.name,
        price: q.price,
        change: q.change,
        changePercent: changePercent,
        prevClose: q.prevClose,
        volume: q.volume,
        type: config.type
      });

      const existing = await MarketMover.findOne({ symbol: origSymbol });
      let history = existing?.history || [];
      history.push({ price: q.price, timestamp: new Date() });
      if (history.length > 100) history.shift();
      updateData.history = history;

      await MarketMover.findOneAndUpdate({ symbol: origSymbol }, updateData, { upsert: true, returnDocument: 'after' });
    }

    // Save market stats (advances/declines)
    await MarketStats.findOneAndUpdate(
      {},
      {
        date: new Date(),
        advances,
        declines,
        unchanged,
        stockTraded: advances + declines + unchanged,
      },
      { upsert: true, returnDocument: 'after' }
    );

    const removed = await MarketMover.deleteMany({ symbol: { $nin: WATCHLIST_SYMBOLS } });
    if (removed.deletedCount > 0) {
      console.log(`Removed ${removed.deletedCount} stale market record(s)`);
    }

    lastDataUpdateTime = new Date();
    broadcastToClients({ type: 'market_update', timestamp: new Date().toISOString() });
    console.log('Live market update complete.');
  } catch (error) {
    console.error('Market update error:', error);
  } finally {
    isUpdatingDaily = false;
  }
}

export async function getQuotes(symbols: string[]) {
  const results = await Promise.all(symbols.map(async (s) => {
    try {
      const q = await fetchQuoteWithFallback(s);
      if (!q) return null;
      return {
        symbol: s,
        name: q.name || s,
        price: q.price || 0,
        change: q.change || 0,
        changePercent: q.changePercent || 0,
        open: q.open || 0,
        high: q.high || 0,
        low: q.low || 0,
        prevClose: q.prevClose || 0,
        volume: q.volume || 0,
        marketCap: q.marketCap || 0,
        pe: q.pe || null,
        exchange: '',
        dayHigh52: q.week52High || null,
        dayLow52: q.week52Low || null,
        dividendYield: q.dividendYield || null,
        eps: null,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error(`Quote error ${s}:`, err.message);
      return null;
    }
  }));
  return results.filter(Boolean);
}

export async function getChart(symbol: string, period1?: string, interval?: string) {
  try {
    let range = '1mo';
    if (period1) {
      const now = Date.now();
      const start = new Date(period1).getTime();
      const days = (now - start) / (1000 * 60 * 60 * 24);
      if (days <= 5) range = '5d';
      else if (days <= 30) range = '1mo';
      else if (days <= 90) range = '3mo';
      else if (days <= 180) range = '6mo';
      else if (days <= 365) range = '1y';
      else if (days <= 1825) range = '5y';
      else range = 'max';
    }
    const chartData = await fetchYahooChart(symbol, range, interval || '1d');
    if (chartData.length > 0) return chartData;

    console.log(`Yahoo chart failed for ${symbol}, trying Twelve Data...`);
    const tdSymbol = toTwelveDataSymbol(symbol);
    if (tdSymbol !== symbol) {
      try {
        const tdQ = await fetchTwelveDataQuote(tdSymbol);
        if (tdQ) return [];
      } catch {}
    }
    return [];
  } catch (err: any) {
    console.error(`Chart error ${symbol}:`, err.message);
    return [];
  }
}

export async function searchSymbols(query: string) {
  try {
    const results = await fetchYahooSearch(query);
    return results
      .filter(q => q.symbol)
      .slice(0, 10);
  } catch (err: any) {
    console.error(`Search error:`, err.message);
    return [];
  }
}

export async function searchMutualFunds(query: string) {
  try {
    const results = await fetchYahooSearch(query);
    return results
      .filter(q => q.symbol && (q.type === 'MUTUALFUND' || q.type === 'ETF'))
      .slice(0, 15)
      .map(q => ({ symbol: q.symbol, name: q.name, exchange: q.exchange, type: 'Mutual Fund' }));
  } catch (err: any) {
    console.error(`MF search error:`, err.message);
    return [];
  }
}

export async function getMutualFundQuotes(symbols: string[]) {
  const results = await Promise.all(symbols.map(async (s) => {
    try {
      const q = await fetchQuoteWithFallback(s);
      if (!q) return null;
      return {
        symbol: q.symbol,
        name: q.name || s,
        price: q.price || 0,
        change: q.change || 0,
        changePercent: q.changePercent || 0,
        prevClose: q.prevClose || 0,
        volume: q.volume || 0,
        marketCap: q.marketCap || 0,
        ytdReturn: null,
        threeYearReturn: null,
        fiveYearReturn: null,
        exchange: '',
        quoteType: 'MUTUALFUND',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error(`MF quote error ${s}:`, err.message);
      return null;
    }
  }));
  return results.filter(Boolean);
}

export async function getPortfolioLivePrices(holdings: any[]) {
  if (!holdings || holdings.length === 0) return [];
  const results = await Promise.all(holdings.map(async (h) => {
    try {
      const symbol = h.schemeCode || h.symbol;
      if (!symbol) return null;
      const q = await fetchQuoteWithFallback(symbol);
      if (!q) return null;
      return {
        symbol,
        name: h.schemeName || h.name,
        units: h.units,
        avgNav: h.avgNav || h.avgPrice,
        currentPrice: q.price || h.currentNav,
        change: q.change || 0,
        changePercent: q.changePercent || 0,
      };
    } catch (err: any) {
      console.error(`Portfolio price error ${h.schemeCode}:`, err.message);
      return null;
    }
  }));
  return results.filter(Boolean);
}
