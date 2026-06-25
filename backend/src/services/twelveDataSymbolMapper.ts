const TWELVE_DATA_ALIASES: Record<string, string> = {
  '^CNXMID': '^NSEMDCP50',
  'TATAMOTORS.NS': 'TMPV.NS',
  'ZOMATO.NS': 'ETERNAL.NS',
  '532540.BO': 'TCS.BO',
  '500325.BO': 'RELIANCE.BO',
};

function toTwelveDataSymbol(symbol: string): string {
  let s = TWELVE_DATA_ALIASES[symbol] ?? symbol;
  // Handle Indices
  if (s === '^NSEI') return 'NIFTY:NSE';
  if (s === '^BSESN') return 'SENSEX:BSE';
  if (s === '^NSEBANK') return 'BANKNIFTY:NSE';
  if (s === '^CNXIT') return 'NIFTYIT:NSE';
  if (s === '^NSEMDCP50' || s === '^CNXMID') return 'NIFTY_MIDCAP_50:NSE';

  // Handle Stocks
  s = s.replace(/\.NS$/i, ':NSE').replace(/\.BO$/i, ':BSE');
  return s;
}

export { toTwelveDataSymbol };
