import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import Loan from '../models/Loan';
import { validate } from '../middleware/validate';
import { createLoanSchema, prepaymentSchema, simulateEmiSchema, earlyClosureSchema } from '../middleware/schemas';
import {
  calculateAmortizationSchedule,
  simulateEMIChange,
  calculateEarlyClosure,
  calculateLoanAnalytics,
} from '../services/loanService';

const router = Router();

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const loans = await Loan.find({ userId: req.userId });
    res.json(loans);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, validate(createLoanSchema), async (req: Request, res: Response) => {
  try {
    const loan = new Loan({ ...req.body, userId: req.userId });
    await loan.save();
    res.json(loan);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const updated = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { returnDocument: 'after' }
    );
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    await Loan.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Loan deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/analytics', auth, async (req: Request, res: Response) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    const analytics = calculateLoanAnalytics(
      loan.loanAmount, loan.interestRate,
      loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure,
      loan.startDate, loan.prepayments || []
    );
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/simulate', auth, validate(simulateEmiSchema), async (req: Request, res: Response) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    const { newEmi } = req.body;
    const tenureMonths = loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure;
    const currentEmi = calculateAmortizationSchedule(loan.loanAmount, loan.interestRate, tenureMonths, loan.startDate).emi;
    const result = simulateEMIChange(loan.loanAmount, loan.interestRate, tenureMonths, currentEmi, newEmi);
    if (!result) return res.status(400).json({ message: 'New EMI is too low to cover interest' });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/early-closure', auth, validate(earlyClosureSchema), async (req: Request, res: Response) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    const tenureMonths = loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure;
    const emi = calculateAmortizationSchedule(loan.loanAmount, loan.interestRate, tenureMonths, loan.startDate).emi;
    const { monthsPaid } = req.body;
    const result = calculateEarlyClosure(loan.loanAmount, loan.interestRate, tenureMonths, monthsPaid || 0, emi);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/prepayment', auth, validate(prepaymentSchema), async (req: Request, res: Response) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.userId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });
    const { amount, date, type, note } = req.body;
    if (!loan.prepayments) loan.prepayments = [];
    loan.prepayments.push({ amount, date, type: type || 'partial', note: note || '' });
    await loan.save();
    res.json(loan);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
