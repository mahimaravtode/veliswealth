const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Insurance = require('../models/Insurance');

// Get all insurance policies for user
router.get('/', auth, async (req, res) => {
  try {
    const policies = await Insurance.find({ userId: req.userId });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new insurance policy
router.post('/', auth, async (req, res) => {
  try {
    const policy = new Insurance({
      ...req.body,
      userId: req.userId
    });
    await policy.save();
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
