import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import MFPortfolio from '../models/MFPortfolio';
import {
  getAllSchemes,
  getSchemeDetails,
  searchSchemes,
  getSchemeByCategory,
  compareSchemes,
  calculateSIP,
  calculateLumpsum,
} from '../services/mfapiService';

const router = Router();

router.get('/schemes', auth, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', search, category } = req.query;
    const pg = parseInt(page as string) || 1;
    const lim = parseInt(limit as string) || 20;

    let schemes: any[];
    if (category) {
      schemes = await getSchemeByCategory(category as string);
    } else if (search) {
      schemes = await searchSchemes(search as string);
    } else {
      schemes = await getAllSchemes();
    }

    const total = schemes.length;
    const start = (pg - 1) * lim;
    const paged = schemes.slice(start, start + lim);

    res.json({
      schemes: paged,
      total,
      page: pg,
      totalPages: Math.ceil(total / lim),
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/scheme/:code', auth, async (req: Request, res: Response) => {
  try {
    const code = req.params.code as string;
    const details = await getSchemeDetails(code);
    if (!details) return res.status(404).json({ message: 'Scheme not found' });
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/search', auth, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await searchSchemes(q as string);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/compare', auth, async (req: Request, res: Response) => {
  try {
    const codes = req.query.codes as string;
    if (!codes) return res.status(400).json({ message: 'Codes required' });
    const codeList = codes.split(',').map(c => c.trim()).filter(Boolean);
    const results = await compareSchemes(codeList);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/sip/calculate', auth, async (req: Request, res: Response) => {
  try {
    const { monthlyAmount, annualReturn, years } = req.body;
    const result = calculateSIP(
      parseFloat(monthlyAmount) || 0,
      parseFloat(annualReturn) || 0,
      parseFloat(years) || 0
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/lumpsum/calculate', auth, async (req: Request, res: Response) => {
  try {
    const { amount, annualReturn, years } = req.body;
    const result = calculateLumpsum(
      parseFloat(amount) || 0,
      parseFloat(annualReturn) || 0,
      parseFloat(years) || 0
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/portfolio', auth, async (req: Request, res: Response) => {
  try {
    let portfolio = await MFPortfolio.findOne({ user: req.userId });
    if (!portfolio) {
      portfolio = new MFPortfolio({ user: req.userId, holdings: [] });
      await portfolio.save();
    }
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/portfolio/add', auth, async (req: Request, res: Response) => {
  try {
    const { schemeCode, schemeName, category, amc, units, nav, purchaseDate } = req.body;

    let portfolio = await MFPortfolio.findOne({ user: req.userId });
    if (!portfolio) {
      portfolio = new MFPortfolio({ user: req.userId, holdings: [] });
    }

    const investedAmount = (units || 0) * (nav || 0);
    portfolio.holdings.push({
      schemeCode,
      schemeName,
      category,
      amc,
      units: units || 0,
      avgNav: nav || 0,
      investedAmount,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      currentValue: investedAmount,
      currentNav: nav || 0,
      returns: 0,
      returnsPercent: 0,
    });

    portfolio.recalculate();
    await portfolio.save();
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/portfolio/remove/:id', auth, async (req: Request, res: Response) => {
  try {
    const portfolio = await MFPortfolio.findOne({ user: req.userId });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

    portfolio.holdings = portfolio.holdings.filter(
      (h: any) => h._id?.toString() !== req.params.id
    );
    portfolio.recalculate();
    await portfolio.save();
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/dashboard', auth, async (req: Request, res: Response) => {
  try {
    const portfolio = await MFPortfolio.findOne({ user: req.userId });
    if (!portfolio) {
      return res.json({
        totalInvested: 0,
        currentValue: 0,
        totalReturns: 0,
        totalReturnsPercent: 0,
        categoryAllocation: {},
        holdings: [],
      });
    }

    const categoryAllocation: Record<string, number> = {};
    for (const h of portfolio.holdings) {
      const cat = h.category || 'Other';
      categoryAllocation[cat] = (categoryAllocation[cat] || 0) + (h.currentValue || h.investedAmount || 0);
    }

    res.json({
      totalInvested: portfolio.totalInvested || 0,
      currentValue: portfolio.currentValue || 0,
      totalReturns: portfolio.totalReturns || 0,
      totalReturnsPercent: portfolio.totalReturnsPercent || 0,
      categoryAllocation,
      holdings: portfolio.holdings,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
