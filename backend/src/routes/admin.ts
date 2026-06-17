import { Router, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import User from '../models/User';
import { AuthRequest } from '../types';

const router = Router();

const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const user = await User.findById(req.userId);
  if (user?.role !== 'Admin') {
    res.status(403).json({ message: 'Access denied' });
    return;
  }
  next();
};

router.get('/users', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id/kyc', auth, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { 'profile.kycStatus': req.body.status });
    res.json({ message: 'KYC updated' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
