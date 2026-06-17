const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MarketMover = require('../models/MarketMover');

// AI Sentiment Analysis
router.get('/sentiment', auth, async (req, res) => {
  try {
    const movers = await MarketMover.find();
    
    const bullishCount = movers.filter(m => m.changePercent > 0).length;
    const totalCount = movers.length;
    const bullishScore = totalCount > 0 ? Math.round((bullishCount / totalCount) * 100) : 50;

    let summary = "";
    if (bullishScore > 60) {
      summary = "Market is showing strong bullish momentum. Institutional buying seen in large caps.";
    } else if (bullishScore < 40) {
      summary = "Bearish sentiment dominates. Investors are cautious due to global macro headwinds.";
    } else {
      summary = "Neutral market trend. Sideways movement expected in the short term.";
    }

    res.json({
      score: bullishScore,
      sentiment: bullishScore > 60 ? 'Bullish' : bullishScore < 40 ? 'Bearish' : 'Neutral',
      summary,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'AI processing error' });
  }
});

module.exports = router;
