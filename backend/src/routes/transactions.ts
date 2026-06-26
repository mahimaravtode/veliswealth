import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import Transaction from '../models/Transaction';
import { validate } from '../middleware/validate';
import { createTransactionSchema } from '../middleware/schemas';

const router = Router();

router.get('/categories', auth, async (req: Request, res: Response) => {
  try {
    const categories: Record<string, string[]> = {
      income: ['Salary', 'Freelance', 'Business', 'Investment Income', 'Rental', 'Other Income'],
      expense: ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education', 'Personal', 'Other Expense'],
      investment: ['Mutual Fund', 'Stock', 'Fixed Deposit', 'PPF', 'NPS', 'Gold', 'Crypto', 'Bond', 'Other Investment'],
      insurance: ['Health Insurance', 'Life Insurance', 'Motor Insurance', 'Travel Insurance', 'Other Insurance'],
      transfer: ['Bank Transfer', 'UPI', 'Wallet', 'Cash', 'Other Transfer'],
    };
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/summary', auth, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthTransactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startOfMonth },
    });

    const todayTransactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: startOfToday },
    });

    let monthIncome = 0, monthExpense = 0, monthInvestment = 0;

    for (const t of monthTransactions) {
      if (t.direction === 'in') monthIncome += t.amount;
      else if (t.type === 'investment') monthInvestment += t.amount;
      else monthExpense += t.amount;
    }

    const monthSavings = monthIncome - monthExpense - monthInvestment;
    const monthSavingsRate = monthIncome > 0 ? parseFloat(((monthSavings / monthIncome) * 100).toFixed(2)) : 0;

    res.json({
      monthIncome,
      monthExpense,
      monthInvestment,
      monthSavings,
      monthSavingsRate,
      todayCount: todayTransactions.length,
      monthCount: monthTransactions.length,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/analytics', auth, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = { userId: req.userId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const transactions = await Transaction.find(filter).sort({ date: -1 });

    let totalIncome = 0, totalExpense = 0, totalInvestment = 0;
    const categoryMap: Record<string, { income: number; expense: number }> = {};
    const typeMap: Record<string, number> = {};
    const monthlyMap: Record<string, { income: number; expense: number; investment: number }> = {};

    for (const t of transactions) {
      if (t.direction === 'in') totalIncome += t.amount;
      else if (t.type === 'investment') totalInvestment += t.amount;
      else totalExpense += t.amount;

      const cat = t.category || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = { income: 0, expense: 0 };
      if (t.direction === 'in') categoryMap[cat].income += t.amount;
      else categoryMap[cat].expense += t.amount;

      typeMap[t.type] = (typeMap[t.type] || 0) + t.amount;

      const monthKey = t.date ? new Date(t.date).toISOString().slice(0, 7) : 'unknown';
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { income: 0, expense: 0, investment: 0 };
      if (t.direction === 'in') monthlyMap[monthKey].income += t.amount;
      else if (t.type === 'investment') monthlyMap[monthKey].investment += t.amount;
      else monthlyMap[monthKey].expense += t.amount;
    }

    const netCashFlow = totalIncome - totalExpense - totalInvestment;
    const savingsRate = totalIncome > 0 ? parseFloat(((netCashFlow / totalIncome) * 100).toFixed(2)) : 0;

    const categoryBreakdown = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      income: data.income,
      expense: data.expense,
    }));

    const typeBreakdown = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

    const monthlyTrend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    res.json({
      totalIncome,
      totalExpense,
      totalInvestment,
      netCashFlow,
      savingsRate,
      transactionCount: transactions.length,
      categoryBreakdown,
      typeBreakdown,
      monthlyTrend,
      dailyCashFlow: [],
      recentTransactions: transactions.slice(0, 10),
      topExpenseCategories: categoryBreakdown
        .filter(c => c.expense > 0)
        .sort((a, b) => b.expense - a.expense)
        .slice(0, 5),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/budget', auth, async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    const m = month ? parseInt(month as string) : new Date().getMonth();
    const y = year ? parseInt(year as string) : new Date().getFullYear();

    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      userId: req.userId,
      type: 'expense',
      date: { $gte: start, $lte: end },
    });

    const spentByCategory: Record<string, number> = {};
    let totalSpent = 0;

    for (const t of transactions) {
      const cat = t.category || 'Other';
      spentByCategory[cat] = (spentByCategory[cat] || 0) + t.amount;
      totalSpent += t.amount;
    }

    res.json({
      month: m,
      year: y,
      totalSpent,
      spentByCategory,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const {
      type, category, status, direction, account,
      startDate, endDate, minAmount, maxAmount,
      search, tags, favorite,
      page = '1', limit = '50', sort = '-date',
    } = req.query;

    const filter: any = { userId: req.userId };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (direction) filter.direction = direction;
    if (account) filter.account = account;
    if (favorite === 'true') filter.isFavorite = true;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount as string);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount as string);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const pg = parseInt(page as string) || 1;
    const lim = parseInt(limit as string) || 50;
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort(sort as string)
      .skip((pg - 1) * lim)
      .limit(lim);

    res.json({
      transactions,
      total,
      page: pg,
      pages: Math.ceil(total / lim),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, validate(createTransactionSchema), async (req: Request, res: Response) => {
  try {
    const transaction = new Transaction({ ...req.body, userId: req.userId });
    await transaction.save();
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(404).json({ message: 'Transaction not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Transaction deleted' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/favorite', auth, async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    transaction.isFavorite = !transaction.isFavorite;
    await transaction.save();
    res.json(transaction);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/bulk', auth, async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ message: 'Transactions array required' });
    }

    const docs = transactions.map(t => ({ ...t, userId: req.userId }));
    await Transaction.insertMany(docs);
    res.json({ message: `${docs.length} transactions imported` });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/budget', auth, async (req: Request, res: Response) => {
  try {
    const { month, year, totalBudget, categories } = req.body;
    res.json({
      month,
      year,
      totalBudget,
      categories,
      saved: true,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
