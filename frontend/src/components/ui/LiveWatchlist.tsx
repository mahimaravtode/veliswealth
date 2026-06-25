import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, X, RefreshCw,
  ArrowUpRight, ArrowDownRight, Activity, Star, Clock
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import { apiRequest } from '@/lib/api';
import { useMarketStream } from '@/hooks/useMarketStream';
import { motion } from 'framer-motion';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val);

const DEFAULT_WATCHLIST = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: '^NSEI', name: 'Nifty 50' },
];

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  marketCap: number;
  pe: number;
  exchange: string;
  timestamp: string;
  history?: { date: string; close: number }[];
}

interface SearchItem {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

export default function LiveWatchlist() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(
    () => {
      try {
        const saved = localStorage.getItem('watchlistSymbols');
        return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST.map(w => w.symbol);
      } catch { return DEFAULT_WATCHLIST.map(w => w.symbol); }
    }
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [fetching, setFetching] = useState(false);
  const chartCache = useRef<Map<string, { date: string; close: number }[]>>(new Map());

  const fetchQuotes = useCallback(async () => {
    if (watchlistSymbols.length === 0) {
        setLoading(false);
        return;
    }
    setFetching(true);
    try {
      const data = await apiRequest('/market/quotes', {
        method: 'POST',
        body: JSON.stringify({ symbols: watchlistSymbols }),
      });
      const enriched = (data || []).map((q: Quote) => ({
        ...q,
        history: chartCache.current.get(q.symbol) || [],
      }));
      setQuotes(enriched);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setFetching(false);
      setLoading(false);
    }
  }, [watchlistSymbols]);

  const fetchCharts = useCallback(async () => {
    const promises = watchlistSymbols.map(async (symbol) => {
      if (chartCache.current.has(symbol)) return;
      try {
        const data = await apiRequest(`/market/chart/${symbol}?period1=1mo&interval=1d`);
        chartCache.current.set(symbol, data || []);
      } catch {
        // Chart data unavailable
      }
    });
    await Promise.all(promises);
  }, [watchlistSymbols]);

  useMarketStream(useCallback((msg: any) => {
    if (msg.type === 'market_update') {
      fetchQuotes();
    } else if (msg.type === 'ticker_update' && msg.data) {
      setQuotes(prev => prev.map(q => {
        const update = msg.data.find((u: any) => u.symbol === q.symbol);
        if (update) {
          return {
            ...q,
            price: update.price,
            change: update.change,
            changePercent: update.changePercent
          };
        }
        return q;
      }));
      setLastUpdated(new Date());
    }
  }, [fetchQuotes]));

  useEffect(() => {
    let cancelled = false;
    fetchCharts();
    const timer = setTimeout(() => { if (!cancelled) fetchQuotes(); }, 0);
    const interval = setInterval(() => { if (!cancelled) fetchQuotes(); }, 60000);
    return () => { cancelled = true; clearTimeout(timer); clearInterval(interval); };
  }, [fetchQuotes, fetchCharts]);

  useEffect(() => {
    localStorage.setItem('watchlistSymbols', JSON.stringify(watchlistSymbols));
  }, [watchlistSymbols]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await apiRequest(`/market/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const addToWatchlist = (symbol: string) => {
    if (!watchlistSymbols.includes(symbol)) {
      setWatchlistSymbols(prev => [...prev, symbol]);
    }
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    chartCache.current.delete(symbol);
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
    chartCache.current.delete(symbol);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-warning" /> Live Watchlist
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-5 gap-1 border-success/30 text-success bg-success/10 text-[10px]">
              <Activity className="h-2.5 w-2.5" /> Live
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> {lastUpdated.toLocaleTimeString()}
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={toggleSearch}>
              {showSearch ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={fetchQuotes} disabled={fetching}>
              <RefreshCw className={`h-3.5 w-3.5 ${fetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {showSearch && (
          <div className="mb-3 relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search stocks (e.g. RELIANCE, TCS, SBIN)..."
              className="pl-9 h-8 text-xs"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((r) => (
                  <button
                    key={r.symbol}
                    className="w-full text-left px-3 py-2 hover:bg-accent text-xs flex items-center justify-between gap-2"
                    onClick={() => addToWatchlist(r.symbol)}
                  >
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-muted-foreground">{r.symbol} &bull; {r.exchange}</p>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-3 text-xs text-muted-foreground text-center">
                Searching...
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No stocks in watchlist. Click + to add.</p>
        ) : (
          <div className="space-y-1.5">
            {quotes.map((q) => (
              <WatchlistRow key={q.symbol} quote={q} onRemove={removeFromWatchlist} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WatchlistRow({ quote, onRemove }: { quote: Quote; onRemove: (s: string) => void }) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(quote.price);

  useEffect(() => {
    if (quote.price > prevPriceRef.current) {
      setFlash('up');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    } else if (quote.price < prevPriceRef.current) {
      setFlash('down');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = quote.price;
  }, [quote.price]);

  const isPositive = (quote.changePercent || 0) >= 0;
  const chartData = (quote.history || []).map(h => ({
    date: new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    close: h.close
  }));

  return (
    <motion.div 
      animate={{
        backgroundColor: flash === 'up' ? 'rgba(34, 197, 94, 0.15)' : flash === 'down' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
      }}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold truncate">{quote.name}</p>
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-border">
            {quote.symbol.split('.')[1] || quote.symbol.split('^')[1] || 'NSE'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm font-black">{formatCurrency(quote.price)}</p>
          <span className={`text-[10px] font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <ArrowUpRight className="h-2.5 w-2.5 inline" /> : <ArrowDownRight className="h-2.5 w-2.5 inline" />}
            {isPositive ? '+' : ''}{(quote.changePercent || 0).toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="w-20 h-8 flex-shrink-0">
        {chartData.length > 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`spark-${quote.symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="close"
                stroke={isPositive ? '#22c55e' : '#ef4444'}
                fill={`url(#spark-${quote.symbol})`}
                strokeWidth={1.5}
                dot={false}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    return (
                      <div className="bg-card border border-border rounded px-2 py-1 text-[10px] shadow-sm">
                        {formatCurrency(payload[0].value as number)}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="text-right flex-shrink-0 w-14">
        <p className="text-[10px] text-muted-foreground">Vol</p>
        <p className="text-[10px] font-medium">{quote.volume ? (quote.volume / 1000000).toFixed(1) + 'M' : '-'}</p>
      </div>

      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
        onClick={(e) => { e.stopPropagation(); onRemove(quote.symbol); }}
        title="Remove from watchlist"
      >
        <X className="h-3 w-3 text-destructive" />
      </button>
    </motion.div>
  );
}
