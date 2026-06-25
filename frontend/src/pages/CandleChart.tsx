import React, { useState, useCallback } from 'react';
import CandlestickChart from '@/components/ui/CandlestickChart';
import IndicatorsModal from '@/components/ui/IndicatorsModal';
import { apiRequest } from '@/lib/api';
import { formatCurrencyDec as formatCurrency } from '@/lib/utils';
import { Search, X, TrendingUp, BarChart3, FlaskConical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const formatNumber = (val: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(val);

const POPULAR_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance', exchange: 'NSE' },
  { symbol: 'TCS.NS', name: 'TCS', exchange: 'NSE' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE' },
  { symbol: 'AAPL', name: 'Apple', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla', exchange: 'NASDAQ' },
  { symbol: 'BTC/USD', name: 'Bitcoin', exchange: 'Crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', exchange: 'Crypto' },
  { symbol: 'EUR/USD', name: 'Euro/USD', exchange: 'Forex' },
  { symbol: '^NSEI', name: 'Nifty 50', exchange: 'NSE' },
  { symbol: '^BSESN', name: 'SENSEX', exchange: 'BSE' },
];

export default function CandleChart() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [candleData, setCandleData] = useState<any>(null);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await apiRequest(`/twelve/search?q=${encodeURIComponent(query)}`);
        setSearchResults(results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, []);

  const selectStock = (symbol: string, name: string) => {
    setSelectedSymbol(symbol);
    setSelectedName(name);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Candlestick Chart
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time global markets & Indian stocks (NSE/BSE)
        </p>
      </div>

      {/* Stock Search */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search global & Indian markets... (e.g., RELIANCE, AAPL, BTC/USD)"
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border/50 bg-popover">
              {searchResults.map((r: any) => (
                <button
                  key={r.symbol}
                  onClick={() => selectStock(r.symbol, r.name)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-semibold">{r.symbol}</p>
                    <p className="text-xs text-muted-foreground">{r.name}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px]">{r.exchange}</Badge>
                </button>
              ))}
            </div>
          )}
          {searching && (
            <div className="mt-2 text-center text-xs text-muted-foreground">Searching...</div>
          )}

          {/* Popular Stocks Grid */}
          {!selectedSymbol && !searchQuery && (
            <div className="mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Popular Stocks</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {POPULAR_STOCKS.map(s => (
                  <button
                    key={s.symbol}
                    onClick={() => selectStock(s.symbol, s.name)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 hover:bg-accent rounded-lg transition-all border border-border/30 hover:border-primary/30 group"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="text-left">
                      <p className="text-xs font-bold">{s.symbol.replace('.NS', '').replace('^', '')}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{s.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {selectedSymbol && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">{selectedName}</h2>
                <Badge variant="outline" className="text-[10px]">{selectedSymbol}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsIndicatorsModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-accent/80 transition-colors"
                >
                  <FlaskConical className="h-3 w-3" />
                  Indicators
                </button>
                <button
                  onClick={() => { setSelectedSymbol(null); setSelectedName(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Change Stock
                </button>
              </div>
            </div>
            <IndicatorsModal open={isIndicatorsModalOpen} onOpenChange={setIsIndicatorsModalOpen} />
            <CandlestickChart
              symbol={selectedSymbol}
              height={500}
              onCandleHover={setCandleData}
            />

            {/* OHLCV Data Bar */}
            {candleData && (
              <div className="flex items-center gap-4 mt-3 px-2 py-1.5 bg-muted/30 rounded-lg text-[10px] font-mono">
                <span className="text-muted-foreground">{candleData.time}</span>
                <span>O <span className="text-foreground font-bold">{formatCurrency(candleData.open)}</span></span>
                <span>H <span className="text-success font-bold">{formatCurrency(candleData.high)}</span></span>
                <span>L <span className="text-destructive font-bold">{formatCurrency(candleData.low)}</span></span>
                <span>C <span className={`font-bold ${candleData.close >= candleData.open ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(candleData.close)}
                </span></span>
                <span>Vol <span className="text-foreground font-bold">{formatNumber(candleData.volume)}</span></span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      {!selectedSymbol && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Select a symbol above to view its candlestick chart</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Hybrid Data: Supports NSE, BSE, Global Stocks, Forex, and Crypto</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
