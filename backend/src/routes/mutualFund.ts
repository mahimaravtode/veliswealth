import { Router, Response } from 'express';
import { AuthRequest } from '../types';

const router = Router();

const MF_API = 'https://api.mfapi.in/mf';
let mfCache: any = null;
let mfCacheTime = 0;

async function fetchTopMFs(): Promise<any[]> {
  const now = Date.now();
  if (mfCache && now - mfCacheTime < 600000) {
    return mfCache;
  }

  try {
    const categories = [
      { name: 'Large Cap', category: 'equity', sub: 'large-cap' },
      { name: 'Mid Cap', category: 'equity', sub: 'mid-cap' },
      { name: 'Small Cap', category: 'equity', sub: 'small-cap' },
      { name: 'Flexi Cap', category: 'equity', sub: 'flexi-cap' },
      { name: 'Index Fund', category: 'index' },
      { name: 'ELSS', category: 'equity', sub: 'elss' },
      { name: 'Debt', category: 'debt' },
      { name: 'Hybrid', category: 'hybrid' }
    ];

    const results = await Promise.allSettled(
      categories.map(async (cat) => {
        try {
          const res = await fetch(`${MF_API}/trending/${cat.category}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (!res.ok) throw new Error('API error');
          const data: any = await res.json();
          return {
            category: cat.name,
            funds: (Array.isArray(data) ? data : []).slice(0, 5).map((f: any) => ({
              schemeCode: f.schemeCode,
              schemeName: f.schemeName,
              nav: parseFloat(f.nav) || 0,
              change: parseFloat(f.change) || 0,
              changePercent: parseFloat(f.changePercent) || 0,
              fundHouse: f.fundHouse || '',
              category: f.category || cat.name
            }))
          };
        } catch {
          return { category: cat.name, funds: [] };
        }
      })
    );

    mfCache = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);
    mfCacheTime = now;
    return mfCache;
  } catch (error: any) {
    console.error('MF API error:', error.message);
    return mfCache || [];
  }
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = await fetchTopMFs();
    res.json({ categories: data });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      res.json({ results: [] });
      return;
    }
    const res2 = await fetch(`${MF_API}/search/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data: any = await res2.json();
    res.json({ results: (Array.isArray(data) ? data : []).slice(0, 20) });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:schemeCode', async (req: AuthRequest, res: Response) => {
  try {
    const res2 = await fetch(`${MF_API}/${req.params.schemeCode}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res2.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
