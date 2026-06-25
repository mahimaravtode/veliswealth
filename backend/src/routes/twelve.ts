import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import {
  fetchTwelveDataQuote,
  fetchTwelveDataCandle,
  fetchTwelveDataSearch,
} from '../services/twelveDataService';

const router = Router();

router.get('/search', auth, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await fetchTwelveDataSearch(q as string);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/quote/:symbol', auth, async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol as string;
    const data = await fetchTwelveDataQuote(symbol);
    if (!data) return res.status(404).json({ message: 'Quote not found' });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/candle/:symbol', auth, async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol as string;
    const interval = (req.query.interval as string) || '1day';
    const outputsize = parseInt(req.query.outputsize as string) || 30;
    const data = await fetchTwelveDataCandle(symbol, interval, outputsize);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
