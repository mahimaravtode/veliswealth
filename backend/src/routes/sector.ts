import { Router, Response } from 'express';
import { NseIndia } from 'stock-nse-india';
import { AuthRequest } from '../types';

const nseIndia = new NseIndia();
const router = Router();

const SECTOR_INDICES: Record<string, string[]> = {
  'Nifty Bank': ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK', 'SBIN', 'INDUSINDBK', 'BANDHANBNK', 'FEDERALBNK', 'PNB', 'IDFCFIRSTB'],
  'Nifty IT': ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'INFY', 'LTIM', 'PERSISTENT', 'COFORGE', 'MPHASIS'],
  'Nifty Auto': ['M&M', 'TATAMOTORS', 'MARUTI', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT', 'TVSMOTOR', 'ASHOKLEY', 'MOTHERSON', 'BALKRISIND'],
  'Nifty FMCG': ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'MARICO', 'COLPAL', 'GODREJCP', 'EMAMILTD', 'VSTIND'],
  'Nifty Pharma': ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'TORNTPHARM', 'ALKEM', 'LUPIN', 'IPCALAB', 'AUROPHARMA', 'GLENMARK'],
  'Nifty Metal': ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'NMDC', 'COALINDIA', 'NATIONALUM', 'HINDZINC', 'SAIL', 'JINDALSTEL'],
  'Nifty Realty': ['DLF', 'GODREJPROP', 'OBEROIRLTY', 'PRESTIGE', 'BRIGADE', 'SOBHA', 'PHOENIXLTD', 'LODHA', 'GMRINFRA', 'NCC'],
  'Nifty Energy': ['RELIANCE', 'ONGC', 'NTPC', 'POWERGRID', 'ADANIGREEN', 'TATAPOWER', 'BPCL', 'HINDPETRO', 'IOC', 'GAIL'],
  'Nifty Infra': ['ADANIENT', 'ADANIPORTS', 'DLF', 'ULTRACEMCO', 'GRASIM', 'LT', 'THERMAX', 'TATAPOWER', 'NCC', 'ASHOKLEY'],
  'Nifty PrivBank': ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK', 'INDUSINDBK', 'BANDHANBNK', 'FEDERALBNK', 'IDFCFIRSTB', 'PNB', 'AUBANK']
};

let sectorCache: any = null;
let sectorCacheTime = 0;

async function fetchSectorPerformance(): Promise<any> {
  const now = Date.now();
  if (sectorCache && now - sectorCacheTime < 60000) {
    return sectorCache;
  }

  try {
    const sectors = [];

    for (const [sectorName, symbols] of Object.entries(SECTOR_INDICES)) {
      const stocks: any[] = [];
      for (const symbol of symbols) {
        try {
          const data = await nseIndia.getEquityStockIndices(sectorName);
          if (data?.data) {
            for (const stock of data.data) {
              if (!stocks.find((s: any) => s.symbol === stock.symbol)) {
                stocks.push({
                  symbol: stock.symbol,
                  name: stock.symbol,
                  lastPrice: stock.lastPrice,
                  change: stock.change,
                  changePercent: stock.pChange,
                  volume: stock.totalTradedVolume,
                  high: stock.dayHigh,
                  low: stock.dayLow
                });
              }
            }
          }
          break;
        } catch {
          // fallback: try individual stocks
        }
      }

      const avgChange = stocks.length > 0
        ? stocks.reduce((sum: number, s: any) => sum + (s.changePercent || 0), 0) / stocks.length
        : 0;

      sectors.push({
        name: sectorName,
        stocks,
        avgChange: parseFloat(avgChange.toFixed(2)),
        stockCount: stocks.length
      });
    }

    sectorCache = sectors;
    sectorCacheTime = now;
    return sectors;
  } catch (error: any) {
    console.error('Sector API error:', error.message);
    return sectorCache || [];
  }
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const sectors = await fetchSectorPerformance();
    res.json({ sectors });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:sector', async (req: AuthRequest, res: Response) => {
  try {
    const sectors = await fetchSectorPerformance();
    const sector = sectors.find((s: any) => s.name === req.params.sector);
    if (!sector) {
      res.status(404).json({ message: 'Sector not found' });
      return;
    }
    res.json(sector);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
