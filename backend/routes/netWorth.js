const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Asset = require('../models/Asset');

// Get Net Worth Summary
router.get('/net-worth', auth, async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.userId });
    
    let totalAssets = 0;
    let totalLiabilities = 0;

    assets.forEach(a => {
      if (a.category === 'Asset') totalAssets += a.currentValue;
      else totalLiabilities += a.currentValue;
    });

    res.json({
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Asset/Liability
router.post('/asset', auth, async (req, res) => {
  try {
    const asset = new Asset({ ...req.body, userId: req.userId });
    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
