import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from '../src/routes/auth';
import marketRoutes from '../src/routes/market';
import marketStatsRoutes from '../src/routes/marketStats';
import researchRoutes from '../src/routes/research';
import aiRoutes from '../src/routes/ai';
import healthRoutes from '../src/routes/health';
import stockListRoutes from '../src/routes/stockList';
import watchlistRoutes from '../src/routes/watchlist';
import portfolioTrackerRoutes from '../src/routes/portfolioTracker';
import ipoRoutes from '../src/routes/ipo';
import sectorRoutes from '../src/routes/sector';
import mutualFundRoutes from '../src/routes/mutualFund';
import fnoRoutes from '../src/routes/fno';
import newsRoutes from '../src/routes/news';
import holidaysRoutes from '../src/routes/holidays';

const app = express();

app.use(cors());
app.use(express.json());

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB error:', err);
  }
}

app.use(async (req, res, next) => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database offline' });
    return;
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/market-stats', marketStatsRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/stock-list', stockListRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/portfolio-tracker', portfolioTrackerRoutes);
app.use('/api/ipo', ipoRoutes);
app.use('/api/sector', sectorRoutes);
app.use('/api/mutual-fund', mutualFundRoutes);
app.use('/api/fno', fnoRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/holidays', holidaysRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Velis Wealth API running' });
});

export default app;
