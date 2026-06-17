const express = require('express');
const router = express.Router();
const MarketStats = require('../models/MarketStats');

router.get('/stats', async (req, res) => {
  try {
    const stats = await MarketStats.findOne().sort({ date: -1 });
    res.json(stats || { stockTraded: 0, advances: 0, declines: 0, unchanged: 0, upperCircuitCount: 0, lowerCircuitCount: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
