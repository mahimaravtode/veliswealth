import { NseIndia } from 'stock-nse-india';
import StockList from '../models/StockList';

const nseIndia = new NseIndia();

export interface StockItem {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  lastPrice?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
}

let isFetching = false;
let lastFetchTime: Date | null = null;

export async function fetchAllNSEStocks(): Promise<number> {
  try {
    console.log('Fetching all NSE stock symbols...');
    const symbols = await nseIndia.getAllStockSymbols();
    console.log(`Fetched ${symbols.length} NSE stock symbols`);

    const bulkOps = symbols.map((symbol: string) => ({
      updateOne: {
        filter: { symbol, exchange: 'NSE' as const },
        update: {
          $set: {
            symbol,
            name: symbol,
            exchange: 'NSE' as const,
            series: 'EQ',
            status: 'Active' as const,
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await StockList.bulkWrite(bulkOps as any, { ordered: false });
    console.log(`NSE bulk write done: ${result.upsertedCount} inserted, ${result.modifiedCount} modified`);
    return symbols.length;
  } catch (error: any) {
    console.error('Error fetching NSE stocks:', error.message);
    return 0;
  }
}

export async function fetchBSEStocksFromNSE(): Promise<number> {
  try {
    console.log('Adding BSE entries from NSE symbols...');
    const nseStocks = await StockList.find({ exchange: 'NSE' }).select('symbol name isin').lean();

    if (nseStocks.length === 0) {
      console.log('No NSE stocks found to create BSE entries');
      return 0;
    }

    const bulkOps = nseStocks.map((stock: any) => ({
      updateOne: {
        filter: { symbol: stock.symbol, exchange: 'BSE' as const },
        update: {
          $set: {
            symbol: stock.symbol,
            name: stock.name,
            exchange: 'BSE' as const,
            isin: stock.isin,
            series: 'EQ',
            status: 'Active' as const,
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    }));

    const result = await StockList.bulkWrite(bulkOps as any, { ordered: false });
    console.log(`BSE bulk write done: ${result.upsertedCount} inserted`);
    return nseStocks.length;
  } catch (error: any) {
    console.error('Error creating BSE entries:', error.message);
    return 0;
  }
}

export async function refreshAllStocks(): Promise<{
  nseCount: number;
  bseCount: number;
  total: number;
}> {
  if (isFetching) {
    throw new Error('Already fetching stock list');
  }

  isFetching = true;
  try {
    const nseCount = await fetchAllNSEStocks();
    const bseCount = await fetchBSEStocksFromNSE();

    lastFetchTime = new Date();
    return { nseCount, bseCount, total: nseCount + bseCount };
  } finally {
    isFetching = false;
  }
}

export async function getStockList(filters: {
  exchange?: 'NSE' | 'BSE';
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ stocks: StockItem[]; total: number; page: number; limit: number }> {
  const { exchange, search, page = 1, limit = 50 } = filters;
  const query: any = {};

  if (exchange) query.exchange = exchange;
  if (search) {
    query.$or = [
      { symbol: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await StockList.countDocuments(query);
  const stocks = await StockList.find(query)
    .select('symbol name exchange lastPrice change changePercent volume status')
    .sort({ symbol: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { stocks, total, page, limit };
}

export function getStockFetchStatus() {
  return { isFetching, lastFetchTime };
}
