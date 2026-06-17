import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import Watchlist from '../models/Watchlist';
import { fetchLivePriceForSymbol } from '../services/marketService';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const watchlist = await Watchlist.findOne({ userId: req.userId });
    if (!watchlist) {
      res.json({ stocks: [] });
      return;
    }
    res.json(watchlist);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/add', async (req: AuthRequest, res: Response) => {
  try {
    const { symbol, name, exchange } = req.body;
    let watchlist = await Watchlist.findOne({ userId: req.userId });

    if (!watchlist) {
      watchlist = new Watchlist({ userId: req.userId, stocks: [] });
    }

    const exists = watchlist.stocks.find(s => s.symbol === symbol);
    if (exists) {
      res.status(400).json({ message: 'Stock already in watchlist' });
      return;
    }

    watchlist.stocks.push({ symbol, name, exchange: exchange || 'NSE', addedAt: new Date() });
    await watchlist.save();
    res.json(watchlist);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/remove/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const watchlist = await Watchlist.findOne({ userId: req.userId });
    if (!watchlist) {
      res.status(404).json({ message: 'Watchlist not found' });
      return;
    }

    watchlist.stocks = watchlist.stocks.filter(s => s.symbol !== req.params.symbol);
    await watchlist.save();
    res.json(watchlist);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/live', async (req: AuthRequest, res: Response) => {
  try {
    const watchlist = await Watchlist.findOne({ userId: req.userId });
    if (!watchlist || watchlist.stocks.length === 0) {
      res.json({ stocks: [] });
      return;
    }

    const liveStocks = await Promise.allSettled(
      watchlist.stocks.map(async (stock: any) => {
        const live = await fetchLivePriceForSymbol(stock.symbol);
        return {
          ...(typeof stock.toObject === 'function' ? stock.toObject() : stock),
          lastPrice: live?.lastPrice || 0,
          change: live?.change || 0,
          changePercent: live?.changePercent || 0,
          volume: live?.volume || 0,
          highPrice: live?.highPrice || 0,
          lowPrice: live?.lowPrice || 0
        };
      })
    );

    const stocks = liveStocks
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    res.json({ stocks });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
