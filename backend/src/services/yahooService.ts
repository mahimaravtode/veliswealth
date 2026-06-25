import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/** Deprecated Yahoo tickers → current symbols (demergers, renames, index code changes). */
const YAHOO_SYMBOL_ALIASES: Record<string, string> = {
  '^CNXMID': '^NSEMDCP50',
  'TATAMOTORS.NS': 'TMPV.NS',
  'ZOMATO.NS': 'ETERNAL.NS',
  '532540.BO': 'TCS.BO',
  '500325.BO': 'RELIANCE.BO',
};

function resolveYahooSymbol(symbol: string): string {
  return YAHOO_SYMBOL_ALIASES[symbol] ?? symbol;
}

interface YahooIndex {
  symbol: string;
  name: string;
}

interface YahooStock {
  symbol: string;
  name: string;
}

export interface QuoteResult {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  marketCap?: number;
  pe?: number | null;
  dividendYield?: number | null;
  week52High?: number | null;
  week52Low?: number | null;
  avgVolume?: number;
  currency?: string;
  timestamp?: number | Date;
}

export interface ChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandlePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

// Indian market indices
const YAHOO_INDICES: YahooIndex[] = [
  { symbol: '^NSEI', name: 'Nifty 50' },
  { symbol: '^BSESN', name: 'SENSEX' },
  { symbol: '^NSEBANK', name: 'Bank Nifty' },
  { symbol: '^CNXIT', name: 'Nifty IT' },
  { symbol: '^NSEMDCP50', name: 'Nifty Midcap 50' },
  { symbol: '^CNXFIN', name: 'Nifty Financial Services' },
  { symbol: '^CNXREALTY', name: 'Nifty Realty' },
  { symbol: '^CNXENERGY', name: 'Nifty Energy' },
  { symbol: '^CNXMETAL', name: 'Nifty Metal' },
  { symbol: '^CNXPHARMA', name: 'Nifty Pharma' },
  { symbol: '^CNXFMCG', name: 'Nifty FMCG' },
  { symbol: '^CNXAUTO', name: 'Nifty Auto' },
  { symbol: '^CNXPSUBANK', name: 'Nifty PSU Bank' },
];

const YAHOO_POPULAR_STOCKS: YahooStock[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'TMPV.NS', name: 'Tata Motors' },
  { symbol: 'SBIN.NS', name: 'State Bank of India' },
  { symbol: 'ETERNAL.NS', name: 'Zomato (Eternal)' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises' },
  { symbol: 'WIPRO.NS', name: 'Wipro' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints' },
  { symbol: 'TITAN.NS', name: 'Titan Company' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel' },
  { symbol: 'ONGC.NS', name: 'ONGC' },
];

async function fetchYahooQuote(symbol: string): Promise<QuoteResult | null> {
  try {
    const result = await yahooFinance.quote(resolveYahooSymbol(symbol));
    if (!result) return null;

    return {
      symbol: result.symbol,
      name: result.shortName || result.longName || result.symbol,
      price: result.regularMarketPrice || 0,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0,
      open: result.regularMarketOpen || 0,
      high: result.regularMarketDayHigh || 0,
      low: result.regularMarketDayLow || 0,
      prevClose: result.regularMarketPreviousClose || 0,
      volume: result.regularMarketVolume || 0,
      marketCap: result.marketCap || 0,
      pe: result.trailingPE || null,
      dividendYield: result.dividendYield || null,
      week52High: result.fiftyTwoWeekHigh || null,
      week52Low: result.fiftyTwoWeekLow || null,
      avgVolume: result.averageDailyVolume3Month || 0,
      currency: result.currency || 'INR',
      timestamp: result.regularMarketTime || Date.now(),
    };
  } catch (err: any) {
    console.error(`Yahoo quote error ${symbol}:`, err.message);
    return null;
  }
}

async function fetchYahooChart(symbol: string, range: string = '1mo', interval: string = '1d'): Promise<ChartPoint[]> {
  try {
    const period1 = getPeriod1(range);
    const result = await yahooFinance.chart(resolveYahooSymbol(symbol), {
      period1,
      interval: (interval || '1d') as any,
    });

    if (!result || !result.quotes) return [];

    return result.quotes
      .filter((q: any) => q.close != null)
      .map((q: any) => ({
        date: q.date?.toISOString?.() || q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume || 0,
      }));
  } catch (err: any) {
    console.error(`Yahoo chart error ${symbol}:`, err.message);
    return [];
  }
}

async function fetchYahooCandle(symbol: string, range: string = '1mo', interval: string = '15m'): Promise<CandlePoint[]> {
  try {
    const period1 = getPeriod1(range);
    const result = await yahooFinance.chart(resolveYahooSymbol(symbol), {
      period1,
      interval: interval as any,
    });

    if (!result || !result.quotes) return [];

    return result.quotes
      .filter((q: any) => q.close != null && q.open != null)
      .map((q: any) => ({
        time: Math.floor(new Date(q.date).getTime() / 1000),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume || 0,
      }));
  } catch (err: any) {
    console.error(`Yahoo candle error ${symbol}:`, err.message);
    return [];
  }
}

function getPeriod1(range: string): Date {
  const now = new Date();
  switch (range) {
    case '1d': return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    case '5d': return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    case '1wk': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '1mo': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '3mo': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case '6mo': return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

async function fetchYahooSearch(query: string): Promise<SearchResult[]> {
  try {
    const result = await yahooFinance.search(query, {
      quotesCount: 15,
      newsCount: 0,
    });

    if (!result || !result.quotes) return [];

    return result.quotes
      .filter((q: any) => q.symbol)
      .slice(0, 15)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange || 'N/A',
        type: q.quoteType || 'Equity',
      }));
  } catch (err: any) {
    console.error(`Yahoo search error:`, err.message);
    return [];
  }
}

async function fetchAllIndices(): Promise<QuoteResult[]> {
  const results: QuoteResult[] = [];
  for (const idx of YAHOO_INDICES) {
    const q = await fetchYahooQuote(idx.symbol);
    if (q) results.push({ ...q, name: idx.name });
  }
  return results;
}

async function fetchTopMovers() {
  const results: QuoteResult[] = [];
  for (const stock of YAHOO_POPULAR_STOCKS) {
    const q = await fetchYahooQuote(stock.symbol);
    if (q) results.push({ ...q, name: stock.name });
  }

  const sorted = [...results].sort((a, b) => b.changePercent - a.changePercent);
  return {
    indices: [],
    gainers: sorted.slice(0, 10),
    losers: sorted.slice(-10).reverse(),
    all: results,
  };
}

async function fetchMarketOverview() {
  const indices = await fetchAllIndices();

  const stocks: QuoteResult[] = [];
  for (const stock of YAHOO_POPULAR_STOCKS) {
    const q = await fetchYahooQuote(stock.symbol);
    if (q) stocks.push({ ...q, name: stock.name });
  }

  const advances = stocks.filter(s => s.changePercent > 0).length;
  const declines = stocks.filter(s => s.changePercent < 0).length;
  const unchanged = stocks.filter(s => s.changePercent === 0).length;

  const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);

  return {
    indices,
    stocks,
    breadth: { advances, declines, unchanged },
    gainers: sorted.slice(0, 10),
    losers: sorted.slice(-10).reverse(),
  };
}

export {
  fetchYahooQuote,
  fetchYahooChart,
  fetchYahooCandle,
  fetchYahooSearch,
  fetchAllIndices,
  fetchTopMovers,
  fetchMarketOverview,
  YAHOO_INDICES,
  YAHOO_POPULAR_STOCKS,
};
