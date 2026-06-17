const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

// Create Goal
router.post('/', auth, async (req, res) => {
  try {
    const goal = new Goal({ ...req.body, userId: req.userId });
    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get All Goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete Goal
router.delete('/:id', auth, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Goal
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    res.json(updatedGoal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
