const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Asset = require('../models/Asset');
const Goal = require('../models/Goal');
const Insurance = require('../models/Insurance');

router.get('/score', auth, async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.userId });
    const goals = await Goal.find({ userId: req.userId });
    const insurance = await Insurance.find({ userId: req.userId });

    let totalAssets = 0;
    let totalLiabilities = 0;
    assets.forEach(a => a.category === 'Asset' ? totalAssets += a.currentValue : totalLiabilities += a.currentValue);

    // AI Logic for Health Score
    let score = 50; 
    const savingsRate = totalAssets > 0 ? (totalAssets - totalLiabilities) / totalAssets : 0;
    
    if (savingsRate > 0.3) score += 20;
    if (insurance.length > 0) score += 15;
    if (goals.length > 0) score += 15;
    
    score = Math.min(Math.max(score, 0), 100);

    const insights = [];
    if (score < 50) insights.push("Focus on building an emergency fund.");
    if (insurance.length === 0) insights.push("Consider purchasing health/life insurance.");

    res.json({ score, insights });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
