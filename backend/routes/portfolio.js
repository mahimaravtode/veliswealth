const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');

// Get User Portfolio
router.get('/', auth, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.userId });
    
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.userId, holdings: [] });
      await portfolio.save();
    }
    
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sync/Update Portfolio Holdings
router.post('/sync', auth, async (req, res) => {
  try {
    const { holdings } = req.body;
    
    // Simple calculation logic for summary
    let totalInvested = 0;
    let currentValue = 0;
    
    holdings.forEach(h => {
      totalInvested += (h.units * h.avgNav);
      currentValue += (h.units * h.currentNav);
    });

    const summary = {
      totalInvested,
      currentValue,
      totalGain: currentValue - totalInvested,
      xirr: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0
    };

    let portfolio = await Portfolio.findOneAndUpdate(
      { userId: req.userId },
      { holdings, summary },
      { new: true, upsert: true }
    );

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
