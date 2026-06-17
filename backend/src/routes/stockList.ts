import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import {
  refreshAllStocks,
  getStockList,
  getStockFetchStatus,
  fetchAllNSEStocks,
  fetchBSEStocksFromNSE
} from '../services/stockListService';

const router = Router();

router.get('/all-stocks', async (req: AuthRequest, res: Response) => {
  try {
    const { exchange, search, page, limit } = req.query;
    const result = await getStockList({
      exchange: exchange as 'NSE' | 'BSE' | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/all-stocks/status', async (req: AuthRequest, res: Response) => {
  try {
    const status = getStockFetchStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/all-stocks/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const result = await refreshAllStocks();
    res.json({ message: 'Stock list refreshed', ...result });
  } catch (error: any) {
    if (error.message === 'Already fetching stock list') {
      res.status(429).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

router.post('/all-stocks/refresh-nse', async (req: AuthRequest, res: Response) => {
  try {
    const count = await fetchAllNSEStocks();
    res.json({ message: 'NSE stocks refreshed', count });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/all-stocks/refresh-bse', async (req: AuthRequest, res: Response) => {
  try {
    const count = await fetchBSEStocksFromNSE();
    res.json({ message: 'BSE stocks refreshed', count });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
