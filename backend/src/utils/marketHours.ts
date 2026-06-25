/**
 * Utility to detect if Indian stock markets (NSE/BSE) are open.
 *
 * Market hours: 9:15 AM – 3:30 PM IST, Monday–Friday
 * Pre-open session: 9:00 AM – 9:15 AM IST
 * We consider the market "open" from 9:15 AM to 3:30 PM IST on weekdays.
 * We consider the market "pre-open" from 9:00 AM to 9:15 AM IST on weekdays.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDate(date: Date = new Date()): Date {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + IST_OFFSET_MS);
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
      nextOpen: getNextWeekday(ist).toISOString(),
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
  if (date.getDay() === 5) {
    // Friday → Monday
    next.setDate(next.getDate() + 3);
  } else if (date.getDay() === 6) {
    // Saturday → Monday
    next.setDate(next.getDate() + 2);
  } else {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function getNextOpenTime(ist: Date): Date {
  const next = new Date(ist);
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes < 540) {
    // Before pre-open today
    next.setHours(9, 15, 0, 0);
  } else {
    // After market close — next weekday 9:15 AM
    return getNextWeekday(ist);
  }
  return next;
}

/** Returns true if the market has had at least one trading session today. */
export function hadTradingSessionToday(now: Date = new Date()): boolean {
  const ist = getISTDate(now);
  const day = ist.getDay();
  if (day === 0 || day === 6) return false;
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes > 930;
}
