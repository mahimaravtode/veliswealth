import { Router, Request, Response } from 'express';
import Report from '../models/Report';

const router = Router();

router.get('/reports', async (req: Request, res: Response) => {
  try {
    const reports = await Report.find().sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
