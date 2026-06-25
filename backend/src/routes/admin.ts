import { Router, Request, Response, NextFunction } from 'express';
import auth from '../middleware/auth';
import User from '../models/User';

const router = Router();

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.userId);
  if (user?.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });
  next();
};

router.get('/users', auth, isAdmin, async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id/kyc', auth, isAdmin, async (req: Request, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { 'profile.kycStatus': req.body.status });
    res.json({ message: 'KYC updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
