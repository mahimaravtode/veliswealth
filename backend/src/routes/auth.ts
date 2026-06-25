import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../middleware/schemas';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' });
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    const token = signToken(decoded.userId);
    res.json({ token });
  } catch {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = signToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    res.status(201).json({
      token,
      refreshToken,
      user: { id: user._id, name, email, role: user.role }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = signToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    res.json({
      token,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
