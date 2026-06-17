const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get Risk Profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('riskProfile');
    res.json(user.riskProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Risk Profile (from Questionnaire)
router.post('/calculate', auth, async (req, res) => {
  try {
    const { answers } = req.body; // Array of scores from questions
    const totalScore = answers.reduce((a, b) => a + b, 0);
    
    let category = 'Moderate';
    if (totalScore < 15) category = 'Conservative';
    else if (totalScore > 30) category = 'Aggressive';

    const riskProfile = {
      score: totalScore,
      category,
      lastUpdated: new Date()
    };

    await User.findByIdAndUpdate(req.userId, { riskProfile });
    res.json(riskProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
