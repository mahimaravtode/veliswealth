import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import Portfolio from '../models/Portfolio';
import { fetchLivePriceForSymbol } from '../services/marketService';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.userId, holdings: [], summary: { totalInvested: 0, currentValue: 0, totalPnl: 0, totalPnlPercent: 0 } });
      await portfolio.save();
    }
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/add', async (req: AuthRequest, res: Response) => {
  try {
    const { symbol, name, exchange, quantity, buyPrice } = req.body;

    let portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.userId, holdings: [], summary: { totalInvested: 0, currentValue: 0, totalPnl: 0, totalPnlPercent: 0 } });
    }

    const existing = portfolio.holdings.find(h => h.symbol === symbol);
    if (existing) {
      const totalQty = existing.quantity + quantity;
      existing.avgBuyPrice = ((existing.avgBuyPrice * existing.quantity) + (buyPrice * quantity)) / totalQty;
      existing.quantity = totalQty;
      existing.investedAmount = existing.avgBuyPrice * existing.quantity;
    } else {
      portfolio.holdings.push({
        symbol, name, exchange: exchange || 'NSE',
        quantity, avgBuyPrice: buyPrice,
        currentPrice: buyPrice, pnl: 0, pnlPercent: 0,
        investedAmount: buyPrice * quantity,
        currentValue: buyPrice * quantity,
        addedAt: new Date()
      });
    }

    updateSummary(portfolio);
    await portfolio.save();
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/remove/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      res.status(404).json({ message: 'Portfolio not found' });
      return;
    }

    portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== req.params.symbol);
    updateSummary(portfolio);
    await portfolio.save();
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/live', async (req: AuthRequest, res: Response) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio || portfolio.holdings.length === 0) {
      res.json({ holdings: [], summary: { totalInvested: 0, currentValue: 0, totalPnl: 0, totalPnlPercent: 0 } });
      return;
    }

    const liveHoldings = await Promise.allSettled(
      portfolio.holdings.map(async (holding: any) => {
        const live = await fetchLivePriceForSymbol(holding.symbol);
        const currentPrice = live?.lastPrice || holding.avgBuyPrice;
        const currentValue = currentPrice * holding.quantity;
        const pnl = currentValue - holding.investedAmount;
        const pnlPercent = holding.investedAmount > 0 ? (pnl / holding.investedAmount) * 100 : 0;

        return {
          ...(typeof holding.toObject === 'function' ? holding.toObject() : holding),
          currentPrice,
          currentValue,
          pnl,
          pnlPercent,
          liveData: live
        };
      })
    );

    const holdings = liveHoldings
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);

    const totalInvested = holdings.reduce((sum: number, h: any) => sum + h.investedAmount, 0);
    const currentValue = holdings.reduce((sum: number, h: any) => sum + h.currentValue, 0);
    const totalPnl = currentValue - totalInvested;
    const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    res.json({
      holdings,
      summary: { totalInvested, currentValue, totalPnl, totalPnlPercent }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

function updateSummary(portfolio: any) {
  let totalInvested = 0;
  let currentValue = 0;

  for (const h of portfolio.holdings) {
    h.investedAmount = h.avgBuyPrice * h.quantity;
    h.currentValue = h.currentPrice * h.quantity;
    h.pnl = h.currentValue - h.investedAmount;
    h.pnlPercent = h.investedAmount > 0 ? (h.pnl / h.investedAmount) * 100 : 0;
    totalInvested += h.investedAmount;
    currentValue += h.currentValue;
  }

  portfolio.summary = {
    totalInvested,
    currentValue,
    totalPnl: currentValue - totalInvested,
    totalPnlPercent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0
  };
}

export default router;
