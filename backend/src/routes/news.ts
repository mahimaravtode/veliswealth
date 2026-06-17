import { Router, Response } from 'express';
import { AuthRequest } from '../types';

const router = Router();

const NEWS_SOURCES = [
  { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
  { name: 'MoneyControl', url: 'https://www.moneycontrol.com/rss/marketinfo.xml' }
];

let newsCache: any = null;
let newsCacheTime = 0;

async function fetchNews(): Promise<any[]> {
  const now = Date.now();
  if (newsCache && now - newsCacheTime < 300000) {
    return newsCache;
  }

  try {
    const nseRes = await fetch('https://www.nseindia.com/api/corporates?index=equities', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.nseindia.com/'
      }
    });

    let news: any[] = [];

    if (nseRes.ok) {
      const data = await nseRes.json();
      if (Array.isArray(data)) {
        news = data.slice(0, 20).map((item: any) => ({
          title: item.desc || item.subject || item.title || 'Market Update',
          date: item.date || item.ex_dt || new Date().toISOString(),
          category: item.category || 'Market',
          source: 'NSE'
        }));
      }
    }

    const fallbackNews = [
      { title: 'Market opens higher on positive global cues', date: new Date().toISOString(), category: 'Markets', source: 'Market' },
      { title: 'FII flows remain positive this week', date: new Date().toISOString(), category: 'FII/DII', source: 'Market' },
      { title: 'RBI monetary policy meeting scheduled', date: new Date().toISOString(), category: 'Economy', source: 'Market' },
      { title: 'Quarterly earnings season underway', date: new Date().toISOString(), category: 'Earnings', source: 'Market' },
      { title: 'Global markets react to US Fed signals', date: new Date().toISOString(), category: 'Global', source: 'Market' }
    ];

    if (news.length === 0) news = fallbackNews;

    newsCache = news;
    newsCacheTime = now;
    return news;
  } catch (error: any) {
    console.error('News API error:', error.message);
    return newsCache || [];
  }
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const news = await fetchNews();
    res.json({ news });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
