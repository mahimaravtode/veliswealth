const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Middleware to check Admin role
const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (user?.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });
  next();
};

// Get all users
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update KYC
router.patch('/users/:id/kyc', auth, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { 'profile.kycStatus': req.body.status });
    res.json({ message: 'KYC updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
