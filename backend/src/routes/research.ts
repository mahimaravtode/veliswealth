import { Router, Response } from 'express';
import Report from '../models/Report';
import { AuthRequest } from '../types';

const router = Router();

router.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    const reports = await Report.find().sort({ date: -1 });
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
