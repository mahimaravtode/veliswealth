import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import Portfolio from '../models/Portfolio';
import MFPortfolio from '../models/MFPortfolio';
import { validate } from '../middleware/validate';
import { syncPortfolioSchema } from '../middleware/schemas';
import { getSchemeDetails } from '../services/mfapiService';

const router = Router();

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.userId, holdings: [], summary: { totalInvested: 0, currentValue: 0, totalGain: 0, xirr: 0 } });
      await portfolio.save();
    }
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/sync', auth, validate(syncPortfolioSchema), async (req: Request, res: Response) => {
  try {
    const { holdings } = req.body;

    let totalInvested = 0;
    let currentValue = 0;

    for (const h of holdings) {
      const invested = (h.units || 0) * (h.avgNav || 0);
      const current = (h.units || 0) * (h.currentNav || h.avgNav || 0);
      totalInvested += invested;
      currentValue += current;
    }

    const summary = {
      totalInvested,
      currentValue,
      totalGain: currentValue - totalInvested,
      xirr: 0,
    };

    let portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.userId });
    }

    portfolio.holdings = holdings;
    portfolio.summary = summary;
    await portfolio.save();

    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/refresh-live', auth, async (req: Request, res: Response) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio || !portfolio.holdings?.length) {
      return res.json({ holdings: [], summary: { totalInvested: 0, currentValue: 0, totalGain: 0, xirr: 0 } });
    }

    let totalInvested = 0;
    let currentValue = 0;

    for (const holding of portfolio.holdings) {
      if (holding.schemeCode) {
        try {
          const details = await getSchemeDetails(holding.schemeCode);
          if (details && details.nav) {
            holding.currentNav = details.nav;
          }
        } catch {}
      }
      const invested = (holding.units || 0) * (holding.avgNav || 0);
      const current = (holding.units || 0) * (holding.currentNav || holding.avgNav || 0);
      totalInvested += invested;
      currentValue += current;
    }

    portfolio.summary = {
      totalInvested,
      currentValue,
      totalGain: currentValue - totalInvested,
      xirr: 0,
    };

    await portfolio.save();
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
