import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[AUTH] CRITICAL: JWT_SECRET is not defined in environment!');
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const authHeader = req.header('Authorization') || req.header('authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (err: any) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default auth;
