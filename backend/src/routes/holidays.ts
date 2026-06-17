import { Router, Response } from 'express';
import { NseIndia } from 'stock-nse-india';
import { AuthRequest } from '../types';

const nseIndia = new NseIndia();
const router = Router();

let holidaysCache: any = null;
let holidaysCacheTime = 0;

async function fetchHolidays(): Promise<any> {
  const now = Date.now();
  if (holidaysCache && now - holidaysCacheTime < 86400000) {
    return holidaysCache;
  }

  try {
    const [tradingHolidays, clearingHolidays] = await Promise.all([
      nseIndia.getTradingHolidays(),
      nseIndia.getClearingHolidays()
    ]);

    holidaysCache = {
      trading: tradingHolidays || [],
      clearing: clearingHolidays || []
    };
    holidaysCacheTime = now;
    return holidaysCache;
  } catch (error: any) {
    console.error('Holidays API error:', error.message);
    return holidaysCache || { trading: [], clearing: [] };
  }
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const holidays = await fetchHolidays();
    res.json(holidays);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/next', async (req: AuthRequest, res: Response) => {
  try {
    const holidays = await fetchHolidays();
    const now = new Date();

    const upcoming = holidays.trading
      .filter((h: any) => new Date(h.date || h.holiday) > now)
      .sort((a: any, b: any) => new Date(a.date || a.holiday).getTime() - new Date(b.date || b.holiday).getTime());

    res.json({
      nextHoliday: upcoming[0] || null,
      upcomingCount: upcoming.length
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
