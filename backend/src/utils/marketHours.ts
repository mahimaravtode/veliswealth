/**
 * Utility to detect if Indian stock markets (NSE/BSE) are open.
 *
 * Market hours: 9:15 AM – 3:30 PM IST, Monday–Friday
 * Pre-open session: 9:00 AM – 9:15 AM IST
 * We consider the market "open" from 9:15 AM to 3:30 PM IST on weekdays
 * excluding officially published NSE/BSE holidays.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDate(date: Date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + IST_OFFSET_MS);
}

// NSE/BSE official trading holidays (market closes — no trading at all)
// Source: NSE holiday circulars for 2025, 2026, 2027
const MARKET_HOLIDAYS = new Set([
  // 2025
  '2025-03-14', // Holi
  '2025-03-31', // Id-ul-Fitr
  '2025-04-10', // Shri Mahavir Jayanti
  '2025-04-14', // Dr. Ambedkar Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Maharashtra Day
  '2025-05-12', // Buddha Pournima
  '2025-08-15', // Independence Day
  '2025-08-27', // Ganesh Chaturthi
  '2025-10-02', // Dussehra
  '2025-10-22', // Diwali Balipratipada
  '2025-11-05', // Guru Nanak Jayanti
  '2025-12-25', // Christmas

  // 2026
  '2026-01-26', // Republic Day
  '2026-03-19', // Holi
  '2026-03-20', // Id-ul-Fitr
  '2026-03-30', // Shri Mahavir Jayanti
  '2026-04-03', // Good Friday
  '2026-04-14', // Dr. Ambedkar Jayanti
  '2026-05-01', // Maharashtra Day
  '2026-05-27', // Id-ul-Adha (Bakrid)
  '2026-06-26', // Muharram
  '2026-08-17', // Parsi New Year
  '2026-09-21', // Ganesh Chaturthi
  '2026-11-11', // Diwali Balipratipada
  '2026-11-24', // Guru Nanak Jayanti
  '2026-12-25', // Christmas

  // 2027
  '2027-01-26', // Republic Day
  '2027-03-09', // Holi
  '2027-03-10', // Id-ul-Fitr
  '2027-03-19', // Shri Mahavir Jayanti
  '2027-04-14', // Dr. Ambedkar Jayanti
  '2027-04-23', // Good Friday
  '2027-05-01', // Maharashtra Day
  '2027-05-17', // Buddha Pournima
  '2027-06-16', // Id-ul-Adha (Bakrid)
  '2027-07-15', // Muharram
  '2027-08-15', // Independence Day (Sunday)
  '2027-09-10', // Ganesh Chaturthi
  '2027-10-21', // Dussehra
  '2027-10-31', // Diwali Balipratipada
  '2027-11-13', // Guru Nanak Jayanti
  '2027-12-25', // Christmas (Saturday)
]);

function isHoliday(date: Date): boolean {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return MARKET_HOLIDAYS.has(`${y}-${m}-${d}`);
}

export function isMarketHoliday(date: Date = new Date()): boolean {
  const ist = getISTDate(date);
  return isHoliday(ist);
}

export interface MarketStatus {
  isOpen: boolean;
  isPreOpen: boolean;
  status: 'open' | 'pre-open' | 'closed' | 'holiday';
  nextOpen: string;
  lastClose: string;
}

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const ist = getISTDate(now);
  const day = ist.getDay();
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Weekend
  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      isPreOpen: false,
      status: 'closed',
      nextOpen: getNextOpenTime(ist).toISOString(),
      lastClose: ist.toISOString(),
    };
  }

  // Holiday
  if (isHoliday(ist)) {
    return {
      isOpen: false,
      isPreOpen: false,
      status: 'holiday',
      nextOpen: getNextOpenTime(ist).toISOString(),
      lastClose: ist.toISOString(),
    };
  }

  // Pre-open: 9:00 AM – 9:15 AM IST (540 – 555 minutes)
  if (totalMinutes >= 540 && totalMinutes < 555) {
    return {
      isOpen: false,
      isPreOpen: true,
      status: 'pre-open',
      nextOpen: ist.toISOString(),
      lastClose: ist.toISOString(),
    };
  }

  // Market open: 9:15 AM – 3:30 PM IST (555 – 930 minutes)
  if (totalMinutes >= 555 && totalMinutes <= 930) {
    return {
      isOpen: true,
      isPreOpen: false,
      status: 'open',
      nextOpen: ist.toISOString(),
      lastClose: ist.toISOString(),
    };
  }

  // Outside market hours
  return {
    isOpen: false,
    isPreOpen: false,
    status: 'closed',
    nextOpen: getNextOpenTime(ist).toISOString(),
    lastClose: ist.toISOString(),
  };
}

function getNextWeekday(date: Date): Date {
  const next = new Date(date);
  next.setHours(9, 15, 0, 0);
  do {
    next.setDate(next.getDate() + 1);
  } while (next.getDay() === 0 || next.getDay() === 6 || isHoliday(next));
  return next;
}

function getNextOpenTime(ist: Date): Date {
  const next = new Date(ist);
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes < 540 && !isHoliday(ist)) {
    // Before pre-open today and not a holiday
    next.setHours(9, 15, 0, 0);
  } else {
    // After market close or holiday — next non-holiday weekday 9:15 AM
    return getNextWeekday(ist);
  }
  return next;
}

/** Returns true if the market has had at least one trading session today. */
export function hadTradingSessionToday(now: Date = new Date()): boolean {
  const ist = getISTDate(now);
  const day = ist.getDay();
  if (day === 0 || day === 6) return false;
  if (isHoliday(ist)) return false;
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes > 930;
}
