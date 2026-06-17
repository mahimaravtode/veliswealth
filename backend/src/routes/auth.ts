import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../types';

const router = Router();

router.post('/refresh', async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(401).json({ message: 'Refresh token required' });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as { userId: string };
    const token = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
    res.json({ token });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;
    console.log(`Registration attempt: ${email}`);
    
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists');
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    user = new User({ name, email, password });
    await user.save();
    console.log('User saved successfully');

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.status(201).json({ token, refreshToken, user: { id: user._id, name, email } });
  } catch (error: any) {
    console.error('Registration Error Details:', error);
    res.status(500).json({ 
      message: 'Server error during registration', 
      error: error.message 
    });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    res.json({ token, refreshToken, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
