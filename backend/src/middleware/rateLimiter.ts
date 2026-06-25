import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function createRateLimit(options: {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
} = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 10,
    message = 'Too many requests, please try again later',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.userId || req.ip || 'anonymous';
    const now = Date.now();
    const key = `${userId}:${req.path}`;

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      return res.status(429).json({
        message,
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
    }

    next();
  };
}

export const aiRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'AI rate limit exceeded. Please wait before making more requests.',
});

export const chatRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: 'Chat rate limit exceeded. Please wait before sending more messages.',
});
