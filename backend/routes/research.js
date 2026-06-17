const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ date: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
