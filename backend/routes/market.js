const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');
const MarketMover = require('../models/MarketMover');

// Get Mutual Fund Schemes
router.get('/schemes', async (req, res) => {
  try {
    const schemes = await Scheme.find().limit(20);
    res.json(schemes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Market Movers (Stocks & Indices)
router.get('/movers', async (req, res) => {
  try {
    const movers = await MarketMover.find().sort({ changePercent: -1 }).select('-history');
    
    const stocks = movers.filter(m => m.type === 'Stock');
    const indices = movers.filter(m => m.type === 'Index');
    
    res.json({
      indices: indices,
      gainers: stocks.slice(0, 10),
      losers: [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 10),
      up5Percent: stocks.filter(m => m.changePercent >= 5),
      down5Percent: stocks.filter(m => m.changePercent <= -5),
      upperCircuits: stocks.filter(m => m.circuitHit === 'Upper'),
      lowerCircuits: stocks.filter(m => m.circuitHit === 'Lower')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Stock Details
router.get('/stock/:symbol', async (req, res) => {
  try {
    const stock = await MarketMover.findOne({ symbol: req.params.symbol });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Stock History (for charts)
router.get('/history/:symbol', async (req, res) => {
  try {
    const stock = await MarketMover.findOne({ symbol: req.params.symbol }).select('history');
    if (!stock) return res.status(404).json({ message: 'History not found' });
    res.json(stock.history);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
