import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { updateDailyMarketData, addSSEClient, getCurrentInterval } from './services/marketService';
import { refreshAllStocks } from './services/stockListService';

import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolio';
import goalsRoutes from './routes/goals';
import adminRoutes from './routes/admin';
import marketRoutes from './routes/market';
import marketStatsRoutes from './routes/marketStats';
import researchRoutes from './routes/research';
import netWorthRoutes from './routes/netWorth';
import aiRoutes from './routes/ai';
import healthRoutes from './routes/health';
import stockListRoutes from './routes/stockList';
import watchlistRoutes from './routes/watchlist';
import portfolioTrackerRoutes from './routes/portfolioTracker';
import ipoRoutes from './routes/ipo';
import sectorRoutes from './routes/sector';
import mutualFundRoutes from './routes/mutualFund';
import fnoRoutes from './routes/fno';
import newsRoutes from './routes/news';
import holidaysRoutes from './routes/holidays';

const app = express();

app.use(express.json());
app.use(cors());

app.use((req: Request, res: Response, next) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ 
      message: 'Database is offline. Please ensure MongoDB is running.',
      error: 'DB_CONNECTION_ERROR'
    });
    return;
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/market-stats', marketStatsRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/net-worth', netWorthRoutes);
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

app.get('/api/market/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');
  addSSEClient(res);
  req.on('close', () => {});
});

app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'WealthifyMe API is running...',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

function scheduleUpdate(): void {
  updateDailyMarketData().finally(() => {
    setTimeout(scheduleUpdate, getCurrentInterval());
  });
}

if (process.env.NODE_ENV !== 'production') {
  updateDailyMarketData();
}

mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => {
    console.log('MongoDB connected');
    console.log('Auto-populating stock list...');
    refreshAllStocks()
      .then(r => console.log(`Stock list populated: ${r.nseCount} NSE + ${r.bseCount} BSE = ${r.total} total`))
      .catch(e => console.error('Stock list population failed:', e.message));
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  scheduleUpdate();
});
