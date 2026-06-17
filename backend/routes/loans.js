const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Loan = require('../models/Loan');
const {
  calculateAmortizationSchedule,
  simulateEMIChange,
  calculateEarlyClosure,
  calculateLoanAnalytics,
} = require('../services/loanService');

router.get('/', auth, async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.userId });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const loan = new Loan({ ...req.body, userId: req.userId });
    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Loan.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Loan deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    const analytics = calculateLoanAnalytics(
      loan.loanAmount, loan.interestRate,
      loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure,
      loan.startDate, loan.prepayments || []
    );
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/simulate', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    const { newEmi } = req.body;
    const tenureMonths = loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure;
    const monthlyRate = loan.interestRate / 12 / 100;
    const currentEmi = calculateAmortizationSchedule(loan.loanAmount, loan.interestRate, tenureMonths, loan.startDate).emi;
    const result = simulateEMIChange(loan.loanAmount, loan.interestRate, tenureMonths, currentEmi, newEmi);
    if (!result) return res.status(400).json({ message: 'New EMI is too low to cover interest' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/early-closure', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    const tenureMonths = loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure;
    const monthlyRate = loan.interestRate / 12 / 100;
    const emi = calculateAmortizationSchedule(loan.loanAmount, loan.interestRate, tenureMonths, loan.startDate).emi;
    const { monthsPaid } = req.body;
    const result = calculateEarlyClosure(loan.loanAmount, loan.interestRate, tenureMonths, monthsPaid || 0, emi);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/prepayment', auth, async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    const { amount, date, type, note } = req.body;
    loan.prepayments.push({ amount, date, type: type || 'partial', note: note || '' });
    await loan.save();
    res.json(loan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
