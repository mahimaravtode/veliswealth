import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import {
  fetchYahooQuote,
  fetchYahooChart,
  fetchYahooCandle,
  fetchYahooSearch,
  fetchTopMovers,
  fetchMarketOverview,
} from '../services/yahooService';

const router = Router();

router.get('/overview', auth, async (req: Request, res: Response) => {
  try {
    const data = await fetchMarketOverview();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/chart/:symbol', auth, async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol as string;
    const range = (req.query.range as string) || '1mo';
    const interval = (req.query.interval as string) || '1d';
    const data = await fetchYahooChart(symbol, range, interval);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/candle/:symbol', auth, async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol as string;
    const range = (req.query.range as string) || '1mo';
    const interval = (req.query.interval as string) || '1d';
    const data = await fetchYahooCandle(symbol, range, interval);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/movers', auth, async (req: Request, res: Response) => {
  try {
    const data = await fetchTopMovers();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/quote/:symbol', auth, async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol as string;
    const data = await fetchYahooQuote(symbol);
    if (!data) return res.status(404).json({ message: 'Quote not found' });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/search', auth, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const data = await fetchYahooSearch(q as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
