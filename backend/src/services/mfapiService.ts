const MFAPI_BASE = 'https://api.mfapi.in/mf';

const schemeCache = new Map<string, { data: any; ts: number }>();
const navCache = new Map<string, { data: any; ts: number }>();
const SCHEME_TTL = 5 * 60 * 1000;
const NAV_TTL = 15 * 60 * 1000;

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 200;

async function throttledFetch(url: string) {
  const now = Date.now();
  const wait = Math.max(0, MIN_REQUEST_INTERVAL - (now - lastRequestTime));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestTime = Date.now();

  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      } as any);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}

export async function getAllSchemes() {
  const cached = schemeCache.get('all');
  if (cached && Date.now() - cached.ts < SCHEME_TTL) return cached.data;

  try {
    const data = await throttledFetch(MFAPI_BASE);
    if (!Array.isArray(data)) return [];

    const schemes = data.map((s: any) => ({
      schemeCode: String(s.schemeCode || s.code || ''),
      schemeName: s.schemeName || s.name || '',
      amc: s.mutualFundName || s.fund_house || s.amc || '',
      category: s.schemeCategory || s.category || '',
      schemeType: s.schemeType || '',
      plan: s.plan || '',
      option: s.option || '',
    })).filter((s: any) => s.schemeCode && s.schemeName);

    schemeCache.set('all', { data: schemes, ts: Date.now() });
    return schemes;
  } catch (err: any) {
    console.error('MFAPI getAllSchemes error:', err.message);
    return schemeCache.get('all')?.data || [];
  }
}

export async function getSchemeDetails(schemeCode: string) {
  const cacheKey = String(schemeCode);
  const cached = navCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < NAV_TTL) return cached.data;

  try {
    const data = (await throttledFetch(`${MFAPI_BASE}/${schemeCode}`)) as any;
    if (!data) return null;

    const meta = data.meta || {};
    const navHistory = (data.data || []).map((d: any) => ({
      date: d.date,
      nav: parseFloat(d.nav) || 0,
    })).filter((d: any) => d.nav > 0);

    const latest = navHistory[0] || {};
    const prev = navHistory[1] || {};

    const calcReturns = (days: number) => {
      if (navHistory.length < 2) return null;
      const targetIdx = Math.min(days, navHistory.length - 1);
      const currentNav = navHistory[0]?.nav || 0;
      const pastNav = navHistory[targetIdx]?.nav || 0;
      if (!pastNav || pastNav === 0) return null;
      return parseFloat((((currentNav - pastNav) / pastNav) * 100).toFixed(2));
    };

    const result: any = {
      schemeCode: cacheKey,
      schemeName: meta.scheme_name || '',
      amc: meta.fund_house || '',
      category: meta.scheme_category || '',
      schemeType: meta.scheme_type || '',
      plan: meta.plan || '',
      option: meta.option || '',
      benchmark: meta.benchmark || '',
      fundManager: meta.fund_manager || '',
      launchDate: meta.scheme_start_date || '',
      nav: latest.nav || 0,
      navDate: latest.date || '',
      previousNav: prev.nav || 0,
      navChange: latest.nav && prev.nav ? parseFloat((latest.nav - prev.nav).toFixed(4)) : 0,
      navChangePercent: latest.nav && prev.nav ? parseFloat((((latest.nav - prev.nav) / prev.nav) * 100).toFixed(2)) : 0,
      returns1m: calcReturns(22),
      returns3m: calcReturns(66),
      returns6m: calcReturns(132),
      returns1y: calcReturns(252),
      returns3y: null,
      returns5y: null,
      returnsSinceInception: null,
      navHistory,
    };

    if (navHistory.length > 0) {
      const currentNav = navHistory[0].nav;
      const findNav = (daysAgo: number) => {
        const target = daysAgo;
        for (let i = 0; i < navHistory.length; i++) {
          const d = navHistory[i];
          const diff = Math.abs(i - target);
          if (diff <= 5) return d.nav;
        }
        return navHistory[navHistory.length - 1]?.nav;
      };
      const nav3y = findNav(756);
      const nav5y = findNav(1260);
      const navInception = navHistory[navHistory.length - 1]?.nav;
      if (nav3y) result.returns3y = parseFloat((((currentNav - nav3y) / nav3y) * 100).toFixed(2));
      if (nav5y) result.returns5y = parseFloat((((currentNav - nav5y) / nav5y) * 100).toFixed(2));
      if (navInception) result.returnsSinceInception = parseFloat((((currentNav - navInception) / navInception) * 100).toFixed(2));
    }

    navCache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (err: any) {
    console.error(`MFAPI getSchemeDetails error ${schemeCode}:`, err.message);
    return navCache.get(cacheKey)?.data || null;
  }
}

export async function getNavHistory(schemeCode: string, days = 365) {
  const details = await getSchemeDetails(schemeCode);
  if (!details || !details.navHistory) return [];
  return details.navHistory.slice(0, days);
}

export async function searchSchemes(query: string) {
  const schemes = await getAllSchemes();
  const q = query.toLowerCase();
  return schemes.filter((s: any) =>
    s.schemeName.toLowerCase().includes(q) ||
    s.amc.toLowerCase().includes(q) ||
    s.schemeCode.includes(q)
  ).slice(0, 30);
}

export const CATEGORY_MAP: Record<string, string[]> = {
  'Large Cap': ['Large Cap Fund', 'Large Cap', 'Large Cap Mutual Fund'],
  'Mid Cap': ['Mid Cap Fund', 'Mid Cap', 'Midcap Fund'],
  'Small Cap': ['Small Cap Fund', 'Small Cap', 'Smallcap Fund'],
  'Flexi Cap': ['Flexi Cap Fund', 'Flexi Cap', 'Flexicap Fund', 'Multi Cap Fund', 'Multi Cap'],
  'ELSS': ['ELSS', 'ELSS Fund', 'Tax Saver', 'Tax Saving'],
  'Index Fund': ['Index Fund', 'Index', 'Index Fund/ETF'],
  'Debt': ['Debt', 'Overnight Fund', 'Liquid Fund', 'Ultra Short Duration', 'Short Duration', 'Medium Duration', 'Gilt', 'Corporate Bond', 'Banking & PSU', 'Dynamic Bond', 'Money Market', 'Low Duration', 'Ultra Short', 'Short Term'],
  'Hybrid': ['Hybrid', 'Aggressive Hybrid', 'Conservative Hybrid', 'Balanced Advantage', 'Multi Asset Allocation', 'Arbitrage', 'Equity Savings'],
  'International': ['International', 'Global', 'FOF Overseas', 'World'],
};

export async function getSchemeByCategory(category: string) {
  const schemes = await getAllSchemes();
  const keywords = CATEGORY_MAP[category] || [category];
  return schemes.filter((s: any) => {
    const cat = s.category.toLowerCase();
    return keywords.some(k => cat.includes(k.toLowerCase()));
  });
}

export async function getTopFunds(category: string, limit = 10) {
  const categorySchemes = await getSchemeByCategory(category);
  const enriched: any[] = [];
  for (const s of categorySchemes.slice(0, Math.min(limit * 2, 50))) {
    const details = await getSchemeDetails(s.schemeCode);
    if (details && details.returns1y != null) {
      enriched.push({ ...s, ...details });
    }
  }
  return enriched.sort((a, b) => (b.returns1y || 0) - (a.returns1y || 0)).slice(0, limit);
}

export async function compareSchemes(codes: string[]) {
  const results = [];
  for (const code of codes.slice(0, 4)) {
    const details = await getSchemeDetails(code);
    if (details) results.push(details);
  }
  return results;
}

export function calculateSIP(monthlyAmount: number, annualReturn: number, years: number) {
  const monthlyRate = annualReturn / 12 / 100;
  const months = years * 12;
  const totalInvested = monthlyAmount * months;

  const monthWise = [];
  let currentVal = 0;
  for (let i = 1; i <= months; i++) {
    currentVal = (currentVal + monthlyAmount) * (1 + monthlyRate);
    monthWise.push({
      month: i,
      invested: monthlyAmount * i,
      value: parseFloat(currentVal.toFixed(2)),
    });
  }

  const totalValue = parseFloat(currentVal.toFixed(2));
  const wealthGain = parseFloat((totalValue - totalInvested).toFixed(2));
  const cagr = totalInvested > 0 ? parseFloat(((Math.pow(totalValue / totalInvested, 1 / years) - 1) * 100).toFixed(2)) : 0;

  return {
    monthlyAmount,
    annualReturn,
    years,
    totalInvested,
    totalValue,
    wealthGain,
    cagr: parseFloat(cagr.toFixed(2)),
    monthWise,
  };
}

export function calculateLumpsum(amount: number, annualReturn: number, years: number) {
  const rate = annualReturn / 100;
  const futureValue = amount * Math.pow(1 + rate, years);
  const profit = futureValue - amount;
  const cagr = annualReturn;

  const yearWise = [];
  for (let i = 0; i <= years; i++) {
    const val = amount * Math.pow(1 + rate, i);
    yearWise.push({
      year: i,
      invested: amount,
      value: parseFloat(val.toFixed(2)),
    });
  }

  return {
    amount,
    annualReturn,
    years,
    investedAmount: amount,
    futureValue: parseFloat(futureValue.toFixed(2)),
    profit: parseFloat(profit.toFixed(2)),
    cagr: parseFloat(cagr.toFixed(2)),
    yearWise,
  };
}

export function calculateXIRR(cashflows: { date: Date, amount: number }[]) {
  if (!cashflows || cashflows.length < 2) return 0;

  let guess = 0.1;
  const maxIterations = 100;
  const tolerance = 0.00001;

  for (let iter = 0; iter < maxIterations; iter++) {
    let npv = 0;
    let dnpv = 0;
    const t0 = cashflows[0].date.getTime();

    for (const cf of cashflows) {
      const years = (cf.date.getTime() - t0) / (365.25 * 24 * 60 * 60 * 1000);
      const factor = Math.pow(1 + guess, years);
      npv += cf.amount / factor;
      dnpv -= years * cf.amount / (factor * (1 + guess));
    }

    if (Math.abs(dnpv) < 1e-10) break;
    const newGuess = guess - npv / dnpv;
    if (Math.abs(newGuess - guess) < tolerance) {
      guess = newGuess;
      break;
    }
    guess = newGuess;
  }

  return parseFloat((guess * 100).toFixed(2));
}
