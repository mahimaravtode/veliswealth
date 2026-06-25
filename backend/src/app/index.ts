import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';

// Assuming these are also converted or have types
import { updateDailyMarketData, startMarketSimulation } from '../services/marketService';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
// Note: You will need to convert these routes to use ES modules (export/import) 
// for full TypeScript compatibility.
import yahooRoutes from '../routes/yahoo';
import twelveRoutes from '../routes/twelve';
import mfRoutes from '../routes/mf';

app.use('/api/yahoo', yahooRoutes);
app.use('/api/twelve', twelveRoutes);
app.use('/api/mf', mfRoutes);

// DB-required routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database is offline. Please ensure MongoDB is running.',
      error: 'DB_CONNECTION_ERROR'
    });
  }
  next();
});

import authRoutes from '../routes/auth';
import portfolioRoutes from '../routes/portfolio';
import goalsRoutes from '../routes/goals';
import loansRoutes from '../routes/loans';
import riskRoutes from '../routes/risk';
import insuranceRoutes from '../routes/insurance';
import adminRoutes from '../routes/admin';
import marketRoutes from '../routes/market';
import marketStatsRoutes from '../routes/marketStats';
import researchRoutes from '../routes/research';
import netWorthRoutes from '../routes/netWorth';
import aiRoutes from '../routes/ai';
import healthRoutes from '../routes/health';
import transactionsRoutes from '../routes/transactions';

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/market-stats', marketStatsRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/net-worth', netWorthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/transactions', transactionsRoutes);

// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
  });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'WealthifyMe API is running...',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Cron Job — runs every 5 minutes on weekdays, but only fetches fresh data during market hours
cron.schedule('*/5 * * * 1-5', () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const marketMinutes = hours * 60 + minutes;
  // Market hours: 9:15 AM (555) to 3:30 PM (930) IST
  if (marketMinutes >= 555 && marketMinutes <= 930) {
    updateDailyMarketData();
  }
});

// Always fetch data once on startup (even outside market hours) so we have last closing prices
// In dev mode, also start the simulation for SSE streaming
if (process.env.NODE_ENV !== 'production') {
    updateDailyMarketData().then(() => startMarketSimulation());
} else {
    updateDailyMarketData();
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err: any) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
