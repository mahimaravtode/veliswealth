import { Router, Response } from 'express';
import { auth } from '../middleware/auth';
import Portfolio from '../models/Portfolio';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.userId });
    
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.userId, holdings: [] });
      await portfolio.save();
    }
    
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/sync', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { holdings } = req.body;
    
    let totalInvested = 0;
    let currentValue = 0;
    
    holdings.forEach((h: any) => {
      totalInvested += (h.units * h.avgNav);
      currentValue += (h.units * h.currentNav);
    });

    const summary = {
      totalInvested,
      currentValue,
      totalGain: currentValue - totalInvested,
      xirr: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0
    };

    let portfolio = await Portfolio.findOneAndUpdate(
      { userId: req.userId },
      { holdings, summary },
      { new: true, upsert: true }
    );

    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
