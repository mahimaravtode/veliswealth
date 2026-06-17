import { Router, Response } from 'express';
import { auth } from '../middleware/auth';
import Asset from '../models/Asset';
import Goal from '../models/Goal';
import Insurance from '../models/Insurance';
import { AuthRequest } from '../types';

const router = Router();

router.get('/score', auth, async (req: AuthRequest, res: Response) => {
  try {
    const assets = await Asset.find({ userId: req.userId });
    const goals = await Goal.find({ userId: req.userId });
    const insurance = await Insurance.find({ userId: req.userId });

    let totalAssets = 0;
    let totalLiabilities = 0;
    assets.forEach(a => a.category === 'Asset' ? totalAssets += a.currentValue : totalLiabilities += a.currentValue);

    let score = 50; 
    const savingsRate = totalAssets > 0 ? (totalAssets - totalLiabilities) / totalAssets : 0;
    
    if (savingsRate > 0.3) score += 20;
    if (insurance.length > 0) score += 15;
    if (goals.length > 0) score += 15;
    
    score = Math.min(Math.max(score, 0), 100);

    const insights: string[] = [];
    if (score < 50) insights.push("Focus on building an emergency fund.");
    if (insurance.length === 0) insights.push("Consider purchasing health/life insurance.");

    res.json({ score, insights });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
