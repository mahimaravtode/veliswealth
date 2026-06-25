import { Router, Request, Response } from 'express';
import MarketStats from '../models/MarketStats';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await MarketStats.findOne().sort({ date: -1 });
    res.json(stats || { stockTraded: 0, advances: 0, declines: 0, unchanged: 0, upperCircuitCount: 0, lowerCircuitCount: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
