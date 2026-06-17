import { Router, Response } from 'express';
import MarketStats from '../models/MarketStats';
import { AuthRequest } from '../types';

const router = Router();

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await MarketStats.findOne().sort({ date: -1 });
    res.json(stats || { stockTraded: 0, advances: 0, declines: 0, unchanged: 0, upperCircuitCount: 0, lowerCircuitCount: 0 });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
