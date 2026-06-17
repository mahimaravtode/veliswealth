import { Router, Response } from 'express';
import Scheme from '../models/Scheme';
import MarketMover from '../models/MarketMover';
import StockList from '../models/StockList';
import { AuthRequest } from '../types';
import { fetchLivePriceForSymbol, fetchAllStocksLive } from '../services/marketService';

const router = Router();

router.get('/schemes', async (req: AuthRequest, res: Response) => {
  try {
    const schemes = await Scheme.find().limit(20);
    res.json(schemes);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/movers', async (req: AuthRequest, res: Response) => {
  try {
    const movers = await MarketMover.find().sort({ changePercent: -1 }).select('-history');

    const stocks = movers.filter(m => m.type === 'Stock');
    const indices = movers.filter(m => m.type === 'Index');

    res.json({
      indices: indices,
      gainers: stocks.slice(0, 10),
      losers: [...stocks].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 10),
      up5Percent: stocks.filter(m => (m.changePercent || 0) >= 5),
      down5Percent: stocks.filter(m => (m.changePercent || 0) <= -5),
      upperCircuits: stocks.filter(m => m.circuitHit === 'Upper'),
      lowerCircuits: stocks.filter(m => m.circuitHit === 'Lower')
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stock/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const stock = await MarketMover.findOne({ symbol: req.params.symbol });
    if (!stock) {
      res.status(404).json({ message: 'Stock not found' });
      return;
    }
    res.json(stock);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/history/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const stock = await MarketMover.findOne({ symbol: req.params.symbol }).select('history');
    if (!stock) {
      res.status(404).json({ message: 'History not found' });
      return;
    }
    res.json(stock.history);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/live/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const stock = await fetchLivePriceForSymbol((req.params.symbol as string).toUpperCase());
    if (!stock) {
      res.status(404).json({ message: 'Stock not found or API error' });
      return;
    }
    res.json(stock);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all-stocks', async (req: AuthRequest, res: Response) => {
  try {
    const { exchange, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

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
      .select('symbol name exchange lastPrice change changePercent volume status marketCap')
      .sort({ symbol: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ stocks, total, page: pageNum, limit: limitNum });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all-stocks/count', async (req: AuthRequest, res: Response) => {
  try {
    const nseCount = await StockList.countDocuments({ exchange: 'NSE' });
    const bseCount = await StockList.countDocuments({ exchange: 'BSE' });
    res.json({ nse: nseCount, bse: bseCount, total: nseCount + bseCount });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/live-fetch-all', async (req: AuthRequest, res: Response) => {
  try {
    res.json({ message: 'Fetching all stock prices in background. This may take several minutes.' });
    fetchAllStocksLive().catch(() => {});
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
