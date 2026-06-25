import { Router, Request, Response } from 'express';
import Scheme from '../models/Scheme';
import MarketMover from '../models/MarketMover';
import {
  getQuotes,
  getChart,
  searchSymbols,
  searchMutualFunds,
  getMutualFundQuotes,
  getPortfolioLivePrices,
  addSSEClient,
  WATCHLIST_SYMBOLS,
} from '../services/marketService';

function dedupeBySymbol<T extends { symbol: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    seen.set(item.symbol, item);
  }
  return [...seen.values()];
}

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    seen.set(item.name, item);
  }
  return [...seen.values()];
}

const router = Router();

router.get('/schemes', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const MF_BY_CATEGORY: Record<string, Array<{ code: string; name: string; amc: string; nav: number; returns1y: number; returns3y: number; returns5y: number }>> = {
      'Large Cap': [
        { code: '120716', name: 'Mirae Asset Large Cap Fund', amc: 'Mirae Asset', nav: 92.5, returns1y: 18.2, returns3y: 15.8, returns5y: 16.1 },
        { code: '118989', name: 'Canara Robeco Bluechip Equity Fund', amc: 'Canara Robeco', nav: 78.3, returns1y: 16.5, returns3y: 14.2, returns5y: 15.3 },
        { code: '120503', name: 'Axis Bluechip Fund', amc: 'Axis', nav: 55.8, returns1y: 14.8, returns3y: 12.5, returns5y: 13.9 },
        { code: '118771', name: 'SBI Blue Chip Fund', amc: 'SBI', nav: 68.2, returns1y: 15.9, returns3y: 13.8, returns5y: 14.5 },
        { code: '120491', name: 'ICICI Prudential Bluechip Fund', amc: 'ICICI Pru', nav: 72.1, returns1y: 16.1, returns3y: 14.0, returns5y: 14.8 },
        { code: '118263', name: 'HDFC Top 100 Fund', amc: 'HDFC', nav: 310.5, returns1y: 17.3, returns3y: 15.1, returns5y: 15.6 },
        { code: '120718', name: 'Nippon India Large Cap Fund', amc: 'Nippon', nav: 58.9, returns1y: 15.2, returns3y: 13.5, returns5y: 13.8 },
        { code: '119083', name: 'UTI Mastershare Fund', amc: 'UTI', nav: 205.4, returns1y: 14.5, returns3y: 12.8, returns5y: 13.2 },
      ],
      'Mid Cap': [
        { code: '120505', name: 'Axis Midcap Fund', amc: 'Axis', nav: 98.7, returns1y: 28.5, returns3y: 22.1, returns5y: 21.3 },
        { code: '118868', name: 'Kotak Emerging Equity Fund', amc: 'Kotak', nav: 145.2, returns1y: 26.8, returns3y: 20.5, returns5y: 20.1 },
        { code: '120573', name: 'HDFC Mid-Cap Opportunities Fund', amc: 'HDFC', nav: 118.6, returns1y: 25.3, returns3y: 19.8, returns5y: 19.5 },
        { code: '120719', name: 'SBI Magnum Midcap Fund', amc: 'SBI', nav: 89.4, returns1y: 27.1, returns3y: 21.2, returns5y: 20.8 },
        { code: '118992', name: 'Canara Robeco Emerging Equities', amc: 'Canara Robeco', nav: 175.8, returns1y: 24.6, returns3y: 19.2, returns5y: 19.0 },
        { code: '120575', name: 'Mirae Asset Midcap Fund', amc: 'Mirae Asset', nav: 42.3, returns1y: 29.2, returns3y: 23.5, returns5y: 0 },
        { code: '120712', name: 'Edelweiss Mid Cap Fund', amc: 'Edelweiss', nav: 68.9, returns1y: 26.1, returns3y: 20.8, returns5y: 20.2 },
        { code: '119076', name: 'UTI Mid Cap Fund', amc: 'UTI', nav: 112.5, returns1y: 24.9, returns3y: 18.7, returns5y: 18.5 },
      ],
      'Small Cap': [
        { code: '120717', name: 'Nippon India Small Cap Fund', amc: 'Nippon', nav: 185.6, returns1y: 38.2, returns3y: 28.5, returns5y: 27.8 },
        { code: '118990', name: 'SBI Small Cap Fund', amc: 'SBI', nav: 142.3, returns1y: 35.8, returns3y: 26.2, returns5y: 26.1 },
        { code: '120504', name: 'Axis Small Cap Fund', amc: 'Axis', nav: 78.9, returns1y: 32.5, returns3y: 24.8, returns5y: 25.2 },
        { code: '120714', name: 'HDFC Small Cap Fund', amc: 'HDFC', nav: 95.4, returns1y: 36.1, returns3y: 27.3, returns5y: 26.8 },
        { code: '120572', name: 'Kotak Small Cap Fund', amc: 'Kotak', nav: 210.8, returns1y: 33.7, returns3y: 25.1, returns5y: 25.5 },
        { code: '120713', name: 'Canara Robeco Small Cap Fund', amc: 'Canara Robeco', nav: 52.1, returns1y: 34.9, returns3y: 26.8, returns5y: 0 },
        { code: '119082', name: 'Tata Small Cap Fund', amc: 'Tata', nav: 38.7, returns1y: 37.5, returns3y: 28.2, returns5y: 0 },
        { code: '120715', name: 'Edelweiss Small Cap Fund', amc: 'Edelweiss', nav: 28.5, returns1y: 31.2, returns3y: 23.5, returns5y: 0 },
      ],
      'Index Fund': [
        { code: '120710', name: 'UTI Nifty 50 Index Fund', amc: 'UTI', nav: 245.8, returns1y: 18.5, returns3y: 14.8, returns5y: 15.2 },
        { code: '120711', name: 'HDFC Index Fund - Nifty 50 Plan', amc: 'HDFC', nav: 198.4, returns1y: 18.2, returns3y: 14.5, returns5y: 14.9 },
        { code: '120720', name: 'SBI Nifty Index Fund', amc: 'SBI', nav: 228.6, returns1y: 18.1, returns3y: 14.3, returns5y: 14.8 },
        { code: '120721', name: 'ICICI Pru Nifty 50 Index Fund', amc: 'ICICI Pru', nav: 215.3, returns1y: 18.0, returns3y: 14.2, returns5y: 14.7 },
        { code: '120722', name: 'Nippon India Nifty 50 Index Fund', amc: 'Nippon', nav: 178.9, returns1y: 17.9, returns3y: 14.1, returns5y: 14.6 },
        { code: '120723', name: 'Axis Nifty 50 Index Fund', amc: 'Axis', nav: 165.2, returns1y: 17.8, returns3y: 14.0, returns5y: 14.5 },
        { code: '120724', name: 'Kotak Nifty 50 Index Fund', amc: 'Kotak', nav: 152.7, returns1y: 17.7, returns3y: 13.9, returns5y: 14.4 },
        { code: '120725', name: 'Edelweiss Nifty 50 Index Fund', amc: 'Edelweiss', nav: 142.1, returns1y: 17.6, returns3y: 13.8, returns5y: 14.3 },
      ],
      'ELSS': [
        { code: '118988', name: 'Mirae Asset Tax Saver Fund', amc: 'Mirae Asset', nav: 98.5, returns1y: 22.5, returns3y: 18.2, returns5y: 19.1 },
        { code: '120502', name: 'Axis Long Term Equity Fund', amc: 'Axis', nav: 85.3, returns1y: 19.8, returns3y: 15.5, returns5y: 16.8 },
        { code: '118262', name: 'HDFC Tax Saver Fund', amc: 'HDFC', nav: 285.6, returns1y: 21.2, returns3y: 17.8, returns5y: 18.5 },
        { code: '118770', name: 'SBI Long Term Equity Fund', amc: 'SBI', nav: 195.4, returns1y: 20.5, returns3y: 16.8, returns5y: 17.2 },
        { code: '120490', name: 'ICICI Pru Long Term Equity Fund', amc: 'ICICI Pru', nav: 168.9, returns1y: 21.8, returns3y: 17.5, returns5y: 18.0 },
        { code: '120726', name: 'Canara Robeco Equity Tax Saver', amc: 'Canara Robeco', nav: 142.3, returns1y: 20.1, returns3y: 16.2, returns5y: 17.5 },
        { code: '120727', name: 'Nippon India Tax Saver Fund', amc: 'Nippon', nav: 88.7, returns1y: 19.5, returns3y: 15.8, returns5y: 16.9 },
        { code: '120728', name: 'Kotak Tax Saver Fund', amc: 'Kotak', nav: 72.1, returns1y: 20.8, returns3y: 16.5, returns5y: 17.1 },
      ],
      'Debt': [
        { code: '119078', name: 'HDFC Short Term Debt Fund', amc: 'HDFC', nav: 28.5, returns1y: 7.2, returns3y: 6.8, returns5y: 7.1 },
        { code: '120501', name: 'ICICI Pru Short Term Fund', amc: 'ICICI Pru', nav: 52.3, returns1y: 7.5, returns3y: 7.0, returns5y: 7.3 },
        { code: '118870', name: 'Kotak Bond Fund', amc: 'Kotak', nav: 38.9, returns1y: 6.8, returns3y: 6.5, returns5y: 6.9 },
        { code: '118772', name: 'SBI Short Term Debt Fund', amc: 'SBI', nav: 32.1, returns1y: 7.1, returns3y: 6.7, returns5y: 7.0 },
        { code: '120729', name: 'Nippon India Short Term Fund', amc: 'Nippon', nav: 45.6, returns1y: 7.3, returns3y: 6.9, returns5y: 7.2 },
        { code: '120730', name: 'Axis Short Term Fund', amc: 'Axis', nav: 29.8, returns1y: 7.0, returns3y: 6.6, returns5y: 6.8 },
        { code: '120731', name: 'Canara Robeco Short Duration Fund', amc: 'Canara Robeco', nav: 35.4, returns1y: 6.9, returns3y: 6.4, returns5y: 6.7 },
        { code: '120732', name: 'UTI Short Term Income Fund', amc: 'UTI', nav: 42.8, returns1y: 7.4, returns3y: 7.1, returns5y: 7.4 },
      ],
      'Hybrid': [
        { code: '118869', name: 'HDFC Balanced Advantage Fund', amc: 'HDFC', nav: 185.6, returns1y: 16.8, returns3y: 14.2, returns5y: 14.8 },
        { code: '120500', name: 'ICICI Pru Balanced Advantage Fund', amc: 'ICICI Pru', nav: 52.3, returns1y: 15.5, returns3y: 13.8, returns5y: 14.2 },
        { code: '120733', name: 'SBI Balanced Advantage Fund', amc: 'SBI', nav: 45.8, returns1y: 16.2, returns3y: 14.0, returns5y: 14.5 },
        { code: '120734', name: 'Nippon India Balanced Advantage Fund', amc: 'Nippon', nav: 38.9, returns1y: 15.8, returns3y: 13.5, returns5y: 14.0 },
        { code: '120735', name: 'Axis Balanced Advantage Fund', amc: 'Axis', nav: 28.5, returns1y: 15.2, returns3y: 13.2, returns5y: 13.8 },
        { code: '120736', name: 'Kotak Balanced Advantage Fund', amc: 'Kotak', nav: 32.1, returns1y: 16.5, returns3y: 14.1, returns5y: 14.6 },
        { code: '120737', name: 'Canara Robeco Balanced Advantage Fund', amc: 'Canara Robeco', nav: 25.8, returns1y: 15.9, returns3y: 13.9, returns5y: 14.3 },
        { code: '120738', name: 'Edelweiss Balanced Advantage Fund', amc: 'Edelweiss', nav: 22.4, returns1y: 15.6, returns3y: 13.6, returns5y: 14.1 },
      ],
    };

    const allFunds: Array<{
      schemeCode: string;
      schemeName: string;
      category: string;
      amc: string;
      currentNav: number;
      returns1y: number;
      returns3y: number;
      returns5y: number;
      minSip: number;
      minLumpsum: number;
    }> = [];
    const categories = category ? [category as string] : Object.keys(MF_BY_CATEGORY);

    for (const cat of categories) {
      const funds = MF_BY_CATEGORY[cat] || [];
      for (const f of funds) {
        allFunds.push({
          schemeCode: f.code,
          schemeName: f.name,
          category: cat,
          amc: f.amc,
          currentNav: f.nav,
          returns1y: f.returns1y,
          returns3y: f.returns3y,
          returns5y: f.returns5y,
          minSip: 500,
          minLumpsum: 5000,
        });
      }
    }

    res.json(allFunds);
  } catch (error) {
    console.error('Schemes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/movers', async (req: Request, res: Response) => {
  try {
    const movers = await MarketMover.find({ symbol: { $in: WATCHLIST_SYMBOLS } })
      .sort({ changePercent: -1 })
      .select('-history');

    const stocks = dedupeBySymbol(movers.filter(m => m.type === 'Stock'));
    const indices = dedupeByName(movers.filter(m => m.type === 'Index'));

    res.json({
      indices: indices,
      gainers: stocks.slice(0, 10),
      losers: [...stocks].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 10),
      up5Percent: stocks.filter(m => (m.changePercent || 0) >= 5),
      down5Percent: stocks.filter(m => (m.changePercent || 0) <= -5),
      upperCircuits: stocks.filter(m => m.circuitHit === 'Upper'),
      lowerCircuits: stocks.filter(m => m.circuitHit === 'Lower')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stock/:symbol', async (req: Request, res: Response) => {
  try {
    const stock = await MarketMover.findOne({ symbol: req.params.symbol });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/history/:symbol', async (req: Request, res: Response) => {
  try {
    const stock = await MarketMover.findOne({ symbol: req.params.symbol }).select('history');
    if (!stock) return res.status(404).json({ message: 'History not found' });
    res.json(stock.history);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/quotes', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.body;
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ message: 'symbols array required' });
    }
    const quotes = await getQuotes(symbols);
    res.json(quotes);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch quotes', error: error.message });
  }
});

router.get('/chart/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { period1, interval } = req.query;
    const period1Str = Array.isArray(period1) ? period1[0] : period1;
    const intervalStr = Array.isArray(interval) ? interval[0] : interval;
    const data = await getChart(symbol as string, period1Str as string, intervalStr as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch chart data', error: error.message });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) {
      return res.json([]);
    }
    const results = await searchSymbols(q as string);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

router.get('/mf-search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) {
      return res.json([]);
    }
    const results = await searchMutualFunds(q as string);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: 'MF search failed', error: error.message });
  }
});

router.post('/mf-quotes', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.body;
    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ message: 'symbols array required' });
    }
    const quotes = await getMutualFundQuotes(symbols);
    res.json(quotes);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch MF quotes', error: error.message });
  }
});

router.post('/portfolio/live', async (req: Request, res: Response) => {
  try {
    const { holdings } = req.body;
    if (!holdings || !Array.isArray(holdings)) {
      return res.status(400).json({ message: 'holdings array required' });
    }
    const livePrices = await getPortfolioLivePrices(holdings);
    res.json(livePrices);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch portfolio prices', error: error.message });
  }
});

router.get('/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
  addSSEClient(res);

  req.on('close', () => {
    res.end();
  });
});

export default router;
