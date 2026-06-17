import { Router, Response } from 'express';
import { NseIndia } from 'stock-nse-india';
import { AuthRequest } from '../types';

const nseIndia = new NseIndia();
const router = Router();

router.get('/option-chain/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const result = await nseIndia.getEquityOptionChain(req.params.symbol as string);
    const rawData: any[] = result.data || [];

    const strikes = new Map<string, { CE: any; PE: any }>();

    for (const item of rawData) {
      const strike = item.strikePrice?.trim();
      if (!strike) continue;
      if (!strikes.has(strike)) {
        strikes.set(strike, { CE: null, PE: null });
      }
      const entry = strikes.get(strike)!;
      if (item.optionType === 'CE') {
        entry.CE = {
          openInterest: item.openInterest,
          changeinOpenInterest: item.changeinOpenInterest,
          totalTradedVolume: item.totalTradedVolume,
          impliedVolatility: 0,
          lastPrice: item.lastPrice,
          change: item.change,
          askPrice: item.lastPrice,
          bidPrice: item.lastPrice,
          prevClose: item.prevClose
        };
      } else if (item.optionType === 'PE') {
        entry.PE = {
          openInterest: item.openInterest,
          changeinOpenInterest: item.changeinOpenInterest,
          totalTradedVolume: item.totalTradedVolume,
          impliedVolatility: 0,
          lastPrice: item.lastPrice,
          change: item.change,
          askPrice: item.lastPrice,
          bidPrice: item.lastPrice,
          prevClose: item.prevClose
        };
      }
    }

    const records = Array.from(strikes.entries()).map(([strike, data]) => ({
      strikePrice: parseFloat(strike),
      CE: data.CE,
      PE: data.PE
    })).sort((a, b) => a.strikePrice - b.strikePrice);

    res.json({
      records,
      underlying: rawData[0]?.underlying || req.params.symbol,
      underlyingValue: rawData[0]?.underlyingValue || 0,
      timestamp: result.timestamp || new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch option chain', error: error.message });
  }
});

router.get('/indices/:symbol', async (req: AuthRequest, res: Response) => {
  try {
    const data = await nseIndia.getEquityStockIndices(req.params.symbol as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch index data', error: error.message });
  }
});

export default router;
