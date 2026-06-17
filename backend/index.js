require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { updateDailyMarketData, addSSEClient, getCurrentInterval } = require('./services/marketService');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      message: 'Database is offline. Please ensure MongoDB is running.',
      error: 'DB_CONNECTION_ERROR'
    });
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/risk', require('./routes/risk'));
app.use('/api/insurance', require('./routes/insurance'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/market', require('./routes/market'));
app.use('/api/market-stats', require('./routes/marketStats'));
app.use('/api/research', require('./routes/research'));
app.use('/api/net-worth', require('./routes/netWorth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/health', require('./routes/health'));

// SSE: Live market stream
app.get('/api/market/stream', (req, res) => {
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

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'WealthifyMe API is running...',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Dynamic interval - starts at 1 second, backs off if rate limited
function scheduleUpdate() {
  updateDailyMarketData().finally(() => {
    setTimeout(scheduleUpdate, getCurrentInterval());
  });
}

// Also trigger one update on startup during development
if (process.env.NODE_ENV !== 'production') {
    updateDailyMarketData();
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  scheduleUpdate();
});
