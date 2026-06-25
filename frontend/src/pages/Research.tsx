import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle, BarChart3,
  ArrowUpRight, ArrowDownRight, RefreshCw, Clock, Zap, Info, Search,
  Globe, Loader2, ChevronRight, X, Star, PieChart, Gauge, Shield,
  Target, AlertCircle
} from "lucide-react";
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatCurrencyDec, formatVolume, formatCompact } from '@/lib/utils';
import { useMarketStream } from '@/hooks/useMarketStream';
import StockDetailDialog from '@/components/ui/StockDetailDialog';
import { ResponsiveContainer, AreaChart, Area, Tooltip as ChartTooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

export default function Research() {
  const [movers, setMovers] = useState<any>({ indices: [], gainers: [], losers: [], up5Percent: [], down5Percent: [], upperCircuits: [], lowerCircuits: [] });
  const [stats, setStats] = useState<any>({ stockTraded: 0, advances: 0, declines: 0, upperCircuitCount: 0, lowerCircuitCount: 0 });
  const [sentiment, setSentiment] = useState<any>({ score: 50, sentiment: 'Neutral', summary: 'Gathering market intelligence...' });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Stock search state
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSearchResults, setStockSearchResults] = useState<any[]>([]);
  const [stockSearching, setStockSearching] = useState(false);
  const [stockSearchQuote, setStockSearchQuote] = useState<any>(null);
  const [stockSearchChart, setStockSearchChart] = useState<any[]>([]);
  const [stockSearchLoading, setStockSearchLoading] = useState(false);
  const [stockSearchPeriod, setStockSearchPeriod] = useState('1mo');

  // Mutual fund search state
  const [mfSearchQuery, setMfSearchQuery] = useState('');
  const [mfSearchResults, setMfSearchResults] = useState<any[]>([]);
  const [mfSearching, setMfSearching] = useState(false);
  const [mfQuote, setMfQuote] = useState<any>(null);
  const [mfLoading, setMfLoading] = useState(false);
  const [mfSchemes, setMfSchemes] = useState<any[]>([]);

  // Detail dialog
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const stockSearchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mfSearchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const [moversData, sentimentData, statsData] = await Promise.all([
        apiRequest('/market/movers'),
        apiRequest('/ai/sentiment'),
        apiRequest('/market-stats/stats')
      ]);
      setMovers(moversData || { indices: [], gainers: [], losers: [] });
      setSentiment(sentimentData || { score: 50, sentiment: 'Neutral', summary: 'Gathering market intelligence...' });
      setStats(statsData || { stockTraded: 0, advances: 0, declines: 0 });
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // SSE live streaming
  useMarketStream(useCallback((msg: any) => {
    if (msg.type === 'market_update') {
      fetchData();
    } else if (msg.type === 'ticker_update' && msg.data) {
      setMovers((prev: any) => {
        const updateList = (list: any[]) => (list || []).map(item => {
          const update = msg.data.find((u: any) => u.symbol === item.symbol);
          if (update) {
            return { ...item, lastPrice: update.price, change: update.change, changePercent: update.changePercent };
          }
          return item;
        });
        return {
          ...prev,
          indices: updateList(prev.indices),
          gainers: updateList(prev.gainers),
          losers: updateList(prev.losers),
          up5Percent: updateList(prev.up5Percent),
          down5Percent: updateList(prev.down5Percent),
          upperCircuits: updateList(prev.upperCircuits),
          lowerCircuits: updateList(prev.lowerCircuits),
        };
      });
      setLastUpdated(new Date());
    }
  }, [fetchData]));

  const fetchMfSchemes = async () => {
    try {
      const data = await apiRequest('/market/schemes');
      setMfSchemes(data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchData();
    fetchMfSchemes();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Stock search via Yahoo Finance
  const handleStockSearch = useCallback(async (query: string) => {
    setStockSearchQuery(query);
    if (query.length < 2) {
      setStockSearchResults([]);
      setStockSearchQuote(null);
      setStockSearchChart([]);
      return;
    }
    clearTimeout(stockSearchTimeout.current);
    stockSearchTimeout.current = setTimeout(async () => {
      setStockSearching(true);
      try {
        const data = await apiRequest(`/market/search?q=${encodeURIComponent(query)}`);
        setStockSearchResults(data || []);
      } catch {
        setStockSearchResults([]);
      } finally {
        setStockSearching(false);
      }
    }, 300);
  }, []);

  const handleSelectStock = useCallback(async (symbol: string) => {
    setStockSearchLoading(true);
    setStockSearchResults([]);
    setStockSearchQuery(symbol);
    try {
      const [quotes, chartData] = await Promise.all([
        apiRequest('/market/quotes', { method: 'POST', body: JSON.stringify({ symbols: [symbol] }) }),
        apiRequest(`/market/chart/${symbol}?period1=${stockSearchPeriod}&interval=1d`),
      ]);
      setStockSearchQuote(quotes?.[0] || null);
      setStockSearchChart(chartData || []);
    } catch {
      setStockSearchQuote(null);
      setStockSearchChart([]);
    } finally {
      setStockSearchLoading(false);
    }
  }, [stockSearchPeriod]);

  useEffect(() => {
    if (stockSearchQuote?.symbol) {
      handleSelectStock(stockSearchQuote.symbol);
    }
  }, [stockSearchPeriod]);

  // MF search via Yahoo Finance
  const handleMfSearch = useCallback(async (query: string) => {
    setMfSearchQuery(query);
    if (query.length < 2) {
      setMfSearchResults([]);
      setMfQuote(null);
      return;
    }
    clearTimeout(mfSearchTimeout.current);
    mfSearchTimeout.current = setTimeout(async () => {
      setMfSearching(true);
      try {
        const data = await apiRequest(`/market/mf-search?q=${encodeURIComponent(query)}`);
        setMfSearchResults(data || []);
      } catch {
        setMfSearchResults([]);
      } finally {
        setMfSearching(false);
      }
    }, 300);
  }, []);

  const handleSelectMf = useCallback(async (symbol: string) => {
    setMfLoading(true);
    setMfSearchResults([]);
    setMfSearchQuery(symbol);
    try {
      const quotes = await apiRequest('/market/mf-quotes', { method: 'POST', body: JSON.stringify({ symbols: [symbol] }) });
      setMfQuote(quotes?.[0] || null);
    } catch {
      setMfQuote(null);
    } finally {
      setMfLoading(false);
    }
  }, []);

  const openStockDetail = (symbol: string) => {
    setDetailSymbol(symbol);
    setDetailOpen(true);
  };

  const indices = movers.indices || [];
  const allStocks = [...(movers.gainers || []), ...(movers.losers || [])].filter(
    (v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" /> Market Research
          </h1>
          <p className="text-muted-foreground">Live NSE/BSE data, stocks, mutual funds &amp; charts powered by Yahoo Finance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-6 gap-1 border-success/30 text-success bg-success/10">
            <Activity className="h-3 w-3" /> Live
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {lastUpdated.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Market Indices */}
      {indices.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Market Indices
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {indices.map((idx: any) => (
              <IndexCard key={idx.symbol} data={idx} onClick={() => openStockDetail(idx.symbol)} />
            ))}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatMiniCard title="Stocks Traded" value={stats.stockTraded?.toLocaleString() || '0'} icon={<BarChart3 className="h-4 w-4" />} />
        <StatMiniCard title="Advances" value={stats.advances || '0'} icon={<TrendingUp className="h-4 w-4" />} color="text-success" bg="bg-success/10" />
        <StatMiniCard title="Declines" value={stats.declines || '0'} icon={<TrendingDown className="h-4 w-4" />} color="text-destructive" bg="bg-destructive/10" />
        <StatMiniCard title="Upper Circuit" value={stats.upperCircuitCount || '0'} icon={<Zap className="h-4 w-4" />} color="text-warning" bg="bg-warning/10" />
        <StatMiniCard title="Lower Circuit" value={stats.lowerCircuitCount || '0'} icon={<AlertTriangle className="h-4 w-4" />} color="text-destructive" bg="bg-destructive/10" />
      </div>

      {/* Put/Call Ratio Indicator */}
      <PutCallRatioCard stats={stats} sentiment={sentiment} />

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card border border-border p-1 rounded-xl mb-4 w-full justify-start overflow-x-auto flex">
          <TabsTrigger value="overview" className="rounded-lg font-bold text-xs gap-1.5">
            <Info className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="stocks" className="rounded-lg font-bold text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Stocks
          </TabsTrigger>
          <TabsTrigger value="mutual-funds" className="rounded-lg font-bold text-xs gap-1.5">
            <PieChart className="h-3.5 w-3.5" /> Mutual Funds
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Circuit Breakers */}
              <section>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-warning" /> 5% Movers (Circuit Breakers)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-success/30 bg-success/10 border-0 shadow-sm">
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-xs font-bold text-success uppercase tracking-wider flex items-center justify-between">
                        Stocks Up 5%+
                        <Badge variant="outline" className="text-[10px] border-success/30 text-success">{movers.up5Percent?.length || 0}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {movers.up5Percent?.length > 0 ? movers.up5Percent.map((m: any, i: number) => (
                          <CircuitRow key={i} m={m} onClick={() => openStockDetail(m.symbol)} />
                        )) : <p className="text-xs text-muted-foreground py-2">No stocks up 5%+ today</p>}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-destructive/30 bg-destructive/10 border-0 shadow-sm">
                    <CardHeader className="pb-2 px-4">
                      <CardTitle className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center justify-between">
                        Stocks Down 5%+
                        <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{movers.down5Percent?.length || 0}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {movers.down5Percent?.length > 0 ? movers.down5Percent.map((m: any, i: number) => (
                          <CircuitRow key={i} m={m} isNegative onClick={() => openStockDetail(m.symbol)} />
                        )) : <p className="text-xs text-muted-foreground py-2">No stocks down 5%+ today</p>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Quick Stock Search */}
              <section>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                  <Search className="h-5 w-5 text-primary" /> Search Any Stock (NSE/BSE)
                </h2>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search stock by name or symbol (e.g. RELIANCE, TCS, INFY)..."
                        className="pl-10"
                        value={stockSearchQuery}
                        onChange={(e) => handleStockSearch(e.target.value)}
                      />
                      {stockSearchQuery && (
                        <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { setStockSearchQuery(''); setStockSearchResults([]); setStockSearchQuote(null); setStockSearchChart([]); }}>
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      )}
                      {stockSearchResults.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {stockSearchResults.map((r) => (
                            <button
                              key={r.symbol}
                              className="w-full text-left px-3 py-2 hover:bg-accent text-xs flex items-center justify-between"
                              onClick={() => handleSelectStock(r.symbol)}
                            >
                              <div>
                                <p className="font-semibold">{r.name}</p>
                                <p className="text-muted-foreground">{r.symbol} &bull; {r.exchange}</p>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      )}
                      {stockSearching && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-3 text-xs text-muted-foreground text-center">
                          Searching...
                        </div>
                      )}
                    </div>

                    {stockSearchLoading && (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}

                    {stockSearchQuote && !stockSearchLoading && (
                      <div className="space-y-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">{stockSearchQuote.name}</p>
                            <p className="text-2xl font-black">{formatCurrencyDec(stockSearchQuote.price)}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[10px] mb-1">{stockSearchQuote.symbol}</Badge>
                            <p className={`text-sm font-bold ${stockSearchQuote.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {stockSearchQuote.changePercent >= 0 ? '+' : ''}{stockSearchQuote.change?.toFixed(2)} ({stockSearchQuote.changePercent?.toFixed(2)}%)
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          {['1wk', '1mo', '3mo', '6mo', '1y'].map(p => (
                            <button
                              key={p}
                              className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors ${stockSearchPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                              onClick={() => setStockSearchPeriod(p)}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        {stockSearchChart.length > 1 && (
                          <div className="h-48 bg-muted/30 rounded-xl p-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stockSearchChart.map((c: any) => ({
                                date: new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                                close: c.close,
                              }))}>
                                <defs>
                                  <linearGradient id="searchGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={stockSearchQuote.changePercent >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={stockSearchQuote.changePercent >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                                <ChartTooltip
                                  contentStyle={{ fontSize: 10, borderRadius: 6, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                  formatter={(v) => [`${formatCurrencyDec(v as number)}`, 'Close']}
                                />
                                <Area type="monotone" dataKey="close" stroke={stockSearchQuote.changePercent >= 0 ? '#22c55e' : '#ef4444'} fill="url(#searchGrad)" strokeWidth={2} dot={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-muted-foreground">Open</p>
                            <p className="text-xs font-bold">{formatCurrencyDec(stockSearchQuote.open)}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-muted-foreground">High</p>
                            <p className="text-xs font-bold text-success">{formatCurrencyDec(stockSearchQuote.high)}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-muted-foreground">Low</p>
                            <p className="text-xs font-bold text-destructive">{formatCurrencyDec(stockSearchQuote.low)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-muted-foreground">Volume</p>
                            <p className="text-xs font-bold">{formatVolume(stockSearchQuote.volume)}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-muted-foreground">Mkt Cap</p>
                            <p className="text-xs font-bold">{formatCompact(stockSearchQuote.marketCap)}</p>
                          </div>
                        </div>

                        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => openStockDetail(stockSearchQuote.symbol)}>
                          View Full Details &amp; Chart
                        </Button>
                      </div>
                    )}

                    {!stockSearchQuote && !stockSearchLoading && stockSearchQuery.length >= 2 && stockSearchResults.length === 0 && !stockSearching && (
                      <p className="text-xs text-muted-foreground text-center py-4">No stocks found</p>
                    )}
                    {!stockSearchQuote && stockSearchQuery.length < 2 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Type a stock name or symbol to get live data with chart</p>
                    )}
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Sentiment */}
              <Card className="bg-card text-card-foreground border-none shadow-xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-4 w-4 text-warning" /> Market Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-2">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                      sentiment.score > 60 ? 'bg-success/10 text-success' :
                      sentiment.score < 40 ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {sentiment.sentiment} ({sentiment.score}%)
                    </div>
                  </div>
                  <div className="h-3 bg-card rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sentiment.score > 60 ? 'bg-success' :
                        sentiment.score < 40 ? 'bg-destructive' :
                        'bg-warning'
                      }`}
                      style={{ width: `${sentiment.score}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{sentiment.summary}"</p>
                </CardContent>
              </Card>

              {/* Market Summary */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" /> Market Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SummaryRow label="Total Stocks" value={allStocks.length} />
                  <SummaryRow label="Gainers" value={movers.gainers?.length || 0} color="text-success" />
                  <SummaryRow label="Losers" value={movers.losers?.length || 0} color="text-destructive" />
                  <SummaryRow label="Up 5%+" value={movers.up5Percent?.length || 0} color="text-success" />
                  <SummaryRow label="Down 5%+" value={movers.down5Percent?.length || 0} color="text-destructive" />
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm text-muted-foreground">A/D Ratio</span>
                    <span className="text-sm font-bold">{stats.advances && stats.declines ? (stats.advances / stats.declines).toFixed(2) : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Stocks Tab */}
        <TabsContent value="stocks">
          <div className="space-y-6">
            {/* Top Gainers & Losers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-success">
                    <TrendingUp className="h-4 w-4" /> Top Gainers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <StockTable stocks={movers.gainers || []} onStockClick={(s) => openStockDetail(s.symbol)} />
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
                    <TrendingDown className="h-4 w-4" /> Top Losers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <StockTable stocks={movers.losers || []} onStockClick={(s) => openStockDetail(s.symbol)} />
                </CardContent>
              </Card>
            </div>

            {/* All Stocks with search */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> All NSE/BSE Stocks ({allStocks.length})
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Filter stocks..."
                      className="pl-9 h-8 text-sm"
                      value={stockSearchQuery}
                      onChange={e => {
                        setStockSearchQuery(e.target.value);
                        if (e.target.value.length < 2) {
                          setStockSearchResults([]);
                          setStockSearchQuote(null);
                          setStockSearchChart([]);
                        }
                      }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <StockTable
                  stocks={stockSearchQuery.length >= 2
                    ? allStocks.filter((s: any) => s.name?.toLowerCase().includes(stockSearchQuery.toLowerCase()) || s.symbol?.toLowerCase().includes(stockSearchQuery.toLowerCase()))
                    : allStocks
                  }
                  onStockClick={(s) => openStockDetail(s.symbol)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mutual Funds Tab */}
        <TabsContent value="mutual-funds">
          <div className="space-y-6">
            {/* MF Search */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" /> Search Mutual Funds (Yahoo Finance)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mutual funds (e.g. SBI Bluechip, HDFC Midcap, Axis Growth)..."
                    className="pl-10"
                    value={mfSearchQuery}
                    onChange={(e) => handleMfSearch(e.target.value)}
                  />
                  {mfSearchQuery && (
                    <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { setMfSearchQuery(''); setMfSearchResults([]); setMfQuote(null); }}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                  {mfSearchResults.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {mfSearchResults.map((r) => (
                        <button
                          key={r.symbol}
                          className="w-full text-left px-3 py-2 hover:bg-accent text-xs flex items-center justify-between"
                          onClick={() => handleSelectMf(r.symbol)}
                        >
                          <div>
                            <p className="font-semibold">{r.name}</p>
                            <p className="text-muted-foreground">{r.symbol} &bull; {r.exchange}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px]">MF</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                  {mfSearching && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-3 text-xs text-muted-foreground text-center">
                      Searching...
                    </div>
                  )}
                </div>

                {mfLoading && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {mfQuote && !mfLoading && (
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">{mfQuote.name}</p>
                        <p className="text-2xl font-black">{formatCurrencyDec(mfQuote.price)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[10px] mb-1">{mfQuote.symbol}</Badge>
                        <p className={`text-sm font-bold ${mfQuote.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {mfQuote.changePercent >= 0 ? '+' : ''}{mfQuote.change?.toFixed(2)} ({mfQuote.changePercent?.toFixed(2)}%)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {mfQuote.ytdReturn != null && (
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-muted-foreground">YTD Return</p>
                          <p className={`text-xs font-bold ${(mfQuote.ytdReturn || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>{mfQuote.ytdReturn?.toFixed(2)}%</p>
                        </div>
                      )}
                      {mfQuote.threeYearReturn != null && (
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-muted-foreground">3Y Return</p>
                          <p className="text-xs font-bold text-success">{mfQuote.threeYearReturn?.toFixed(2)}%</p>
                        </div>
                      )}
                      {mfQuote.fiveYearReturn != null && (
                        <div className="bg-muted/50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-muted-foreground">5Y Return</p>
                          <p className="text-xs font-bold text-success">{mfQuote.fiveYearReturn?.toFixed(2)}%</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-[9px] text-muted-foreground">Prev Close</p>
                        <p className="text-xs font-bold">{formatCurrencyDec(mfQuote.prevClose)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-[9px] text-muted-foreground">Exchange</p>
                        <p className="text-xs font-bold">{mfQuote.exchange}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!mfQuote && !mfLoading && mfSearchQuery.length >= 2 && mfSearchResults.length === 0 && !mfSearching && (
                  <p className="text-xs text-muted-foreground text-center py-4">No mutual funds found</p>
                )}
                {!mfQuote && mfSearchQuery.length < 2 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Search for any mutual fund to get live NAV and returns</p>
                )}
              </CardContent>
            </Card>

            {/* Local MF Schemes */}
            {mfSchemes.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" /> Top Performing Schemes (DB)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs">#</th>
                          <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs">Scheme</th>
                          <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">NAV</th>
                          <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">1Y Return</th>
                          <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">3Y Return</th>
                          <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">5Y Return</th>
                          <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...mfSchemes]
                          .sort((a, b) => (b.threeYearReturns || 0) - (a.threeYearReturns || 0))
                          .slice(0, 15)
                          .map((scheme: any, i: number) => (
                            <tr key={scheme.schemeCode || i} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                              <td className="py-2.5 px-4 text-xs text-muted-foreground">{i + 1}</td>
                              <td className="py-2.5 px-4">
                                <p className="font-semibold text-xs truncate max-w-[250px]">{scheme.schemeName}</p>
                                <p className="text-[10px] text-muted-foreground">{scheme.schemeCode}</p>
                              </td>
                              <td className="text-right py-2.5 px-4 font-bold text-xs">{formatCurrencyDec(scheme.currentNav || 0)}</td>
                              <td className="text-right py-2.5 px-4">
                                <span className={`text-xs font-bold ${(scheme.oneYearReturns || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {scheme.oneYearReturns != null ? `${scheme.oneYearReturns}%` : 'N/A'}
                                </span>
                              </td>
                              <td className="text-right py-2.5 px-4">
                                <span className={`text-xs font-bold ${(scheme.threeYearReturns || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {scheme.threeYearReturns != null ? `${scheme.threeYearReturns}%` : 'N/A'}
                                </span>
                              </td>
                              <td className="text-right py-2.5 px-4">
                                <span className={`text-xs font-bold ${(scheme.fiveYearReturns || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {scheme.fiveYearReturns != null ? `${scheme.fiveYearReturns}%` : 'N/A'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <Badge variant="secondary" className="text-[10px]">{scheme.category || 'N/A'}</Badge>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Stock Detail Dialog */}
      <StockDetailDialog symbol={detailSymbol} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}

function IndexCard({ data, onClick }: { data: any; onClick: () => void }) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(data.lastPrice);

  useEffect(() => {
    if (data.lastPrice > prevPriceRef.current) {
      setFlash('up');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    } else if (data.lastPrice < prevPriceRef.current) {
      setFlash('down');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = data.lastPrice;
  }, [data.lastPrice]);

  const isPositive = (data.change || 0) >= 0;
  return (
    <motion.div
      animate={{
        backgroundColor: flash === 'up' ? 'rgba(34, 197, 94, 0.15)' : flash === 'down' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
      }}
      className="rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group bg-card"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground font-medium truncate">{data.name}</p>
        <p className="text-lg font-bold mt-1">{formatCurrency(data.lastPrice)}</p>
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {isPositive ? '+' : ''}{data.changePercent}%
          <span className="text-muted-foreground font-normal ml-1">({isPositive ? '+' : ''}{formatCurrency(data.change || 0)})</span>
        </div>
      </CardContent>
    </motion.div>
  );
}

function StockTable({ stocks, onStockClick }: {
  stocks: any[]; onStockClick: (s: any) => void;
}) {
  if (stocks.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">#</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Stock</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Price</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Change</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Change %</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Volume</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">High</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Low</th>
            <th className="text-center py-2 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock: any, i: number) => {
            const isPos = (stock.changePercent || 0) >= 0;
            return (
              <motion.tr
                key={stock.symbol || i}
                className="border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => onStockClick(stock)}
              >
                <td className="py-2.5 px-3 text-muted-foreground text-xs">{i + 1}</td>
                <td className="py-2.5 px-3">
                  <p className="font-semibold text-xs">{stock.name}</p>
                  <p className="text-[10px] text-muted-foreground">{stock.symbol}</p>
                </td>
                <td className="text-right py-2.5 px-3 font-bold text-xs">{formatCurrency(stock.lastPrice)}</td>
                <td className={`text-right py-2.5 px-3 font-semibold text-xs ${isPos ? 'text-success' : 'text-destructive'}`}>
                  {isPos ? '+' : ''}{formatCurrency(stock.change || 0)}
                </td>
                <td className="text-right py-2.5 px-3">
                  <Badge variant="outline" className={`text-[10px] font-bold ${isPos ? 'border-success/30 text-success bg-success/10' : 'border-destructive/30 text-destructive bg-destructive/10'}`}>
                    {isPos ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                    {isPos ? '+' : ''}{stock.changePercent}%
                  </Badge>
                </td>
                <td className="text-right py-2.5 px-3 text-xs text-muted-foreground">{(stock.volume || 0).toLocaleString()}</td>
                <td className="text-right py-2.5 px-3 text-xs text-success">{formatCurrency(stock.highPrice || 0)}</td>
                <td className="text-right py-2.5 px-3 text-xs text-destructive">{formatCurrency(stock.lowPrice || 0)}</td>
                <td className="text-center py-2.5 px-3">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CircuitRow({ m, isNegative, onClick }: { m: any; isNegative?: boolean; onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex justify-between items-center p-2 rounded-lg hover:bg-accent dark:hover:bg-card transition-all cursor-pointer group">
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-foreground dark:text-white truncate">{m.symbol}</span>
        <span className="text-[10px] text-muted-foreground font-medium">{m.name}</span>
      </div>
      <div className={`text-right font-bold ${isNegative ? 'text-destructive' : 'text-success'}`}>
        <p className="text-sm">{isNegative ? '' : '+'}{m.changePercent}%</p>
        <p className="text-[10px] text-muted-foreground">₹{m.lastPrice}</p>
      </div>
    </div>
  );
}

function StatMiniCard({ title, value, icon, color = 'text-primary', bg = 'bg-primary/10' }: {
  title: string; value: string | number; icon: React.ReactNode; color?: string; bg?: string;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3">
        <div className={`inline-flex p-1.5 rounded-lg ${bg} ${color} mb-1.5`}>{icon}</div>
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-bold ${color || ''}`}>{value}</span>
    </div>
  );
}

function PutCallRatioCard({ stats, sentiment }: { stats: any; sentiment: any }) {
  const advances = stats.advances || 0;
  const declines = stats.declines || 0;
  const totalStocks = advances + declines;

  // Derive Put/Call ratio from market breadth (declines = puts proxy, advances = calls proxy)
  const putCallRatio = declines > 0 && advances > 0
    ? parseFloat((declines / advances).toFixed(2))
    : 1.0;

  // Determine danger level
  const getDangerLevel = (ratio: number) => {
    if (ratio >= 1.5) return { level: 'Extreme Fear', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', icon: <AlertCircle className="h-5 w-5" /> };
    if (ratio >= 1.2) return { level: 'High Fear', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', icon: <AlertTriangle className="h-5 w-5" /> };
    if (ratio >= 1.0) return { level: 'Neutral', color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border', icon: <Info className="h-5 w-5" /> };
    if (ratio >= 0.8) return { level: 'Moderate Greed', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', icon: <TrendingUp className="h-5 w-5" /> };
    return { level: 'Extreme Greed', color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', icon: <Zap className="h-5 w-5" /> };
  };

  const danger = getDangerLevel(putCallRatio);

  // Historical P/C ratios (simulated for visualization)
  const historicalData = [
    { day: 'Mon', ratio: 0.85 },
    { day: 'Tue', ratio: 0.92 },
    { day: 'Wed', ratio: 1.05 },
    { day: 'Thu', ratio: 1.18 },
    { day: 'Fri', ratio: putCallRatio },
  ];

  const strategies = putCallRatio >= 1.2 ? [
    { title: 'Contrarian Buy Signal', desc: 'High P/C ratio often precedes market bottoms. Consider accumulating quality stocks at discounts.', icon: <Target className="h-4 w-4" /> },
    { title: 'Protective Puts', desc: 'If holding positions, buy protective puts to hedge against further downside.', icon: <Shield className="h-4 w-4" /> },
    { title: 'Cash Deployment', desc: 'Deploy idle cash in tranches. Markets fear = opportunity for long-term investors.', icon: <PieChart className="h-4 w-4" /> },
  ] : putCallRatio <= 0.8 ? [
    { title: 'Caution: Overbought', desc: 'Low P/C ratio suggests excessive optimism. Book partial profits and tighten stop-losses.', icon: <AlertTriangle className="h-4 w-4" /> },
    { title: 'Trailing Stop-Loss', desc: 'Set trailing stop-loss at 5-7% below current levels to protect gains.', icon: <Shield className="h-4 w-4" /> },
    { title: 'Sector Rotation', desc: 'Shift from momentum stocks to defensive sectors (Pharma, IT, FMCG).', icon: <RefreshCw className="h-4 w-4" /> },
  ] : [
    { title: 'Stay Invested', desc: 'Neutral P/C ratio indicates balanced sentiment. Continue SIPs and stay invested.', icon: <Activity className="h-4 w-4" /> },
    { title: 'Stock Selection', desc: 'Focus on fundamentally strong stocks with good earnings growth.', icon: <BarChart3 className="h-4 w-4" /> },
    { title: 'Portfolio Rebalance', desc: 'Review asset allocation and rebalance if equity has exceeded target weight.', icon: <PieChart className="h-4 w-4" /> },
  ];

  // Gauge angle: 0 (left) to 180 (right) degrees, ratio 0-2 maps to 0-180
  const gaugeAngle = Math.min(Math.max((putCallRatio / 2) * 180, 0), 180);

  return (
    <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" /> Put/Call Ratio Indicator
          <Badge variant="outline" className={`text-[10px] ml-auto ${danger.color} ${danger.bg} ${danger.border}`}>
            {danger.icon}
            <span className="ml-1">{danger.level}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-28 mb-2">
              {/* Background arc */}
              <svg viewBox="0 0 200 100" className="w-full h-full">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="35%" stopColor="#3b82f6" />
                    <stop offset="65%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" strokeLinecap="round" />
                <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" />
                {/* Needle */}
                <line
                  x1="100"
                  y1="90"
                  x2={100 + 60 * Math.cos(Math.PI - (gaugeAngle * Math.PI) / 180)}
                  y2={90 - 60 * Math.sin((gaugeAngle * Math.PI) / 180)}
                  stroke="hsl(var(--foreground))"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="90" r="6" fill="hsl(var(--foreground))" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black">{putCallRatio}</p>
              <p className={`text-xs font-bold ${danger.color}`}>{danger.level}</p>
            </div>
            <div className="flex justify-between w-full max-w-[180px] mt-1">
              <span className="text-[9px] text-success">0</span>
              <span className="text-[9px] text-muted-foreground">0.8</span>
              <span className="text-[9px] text-warning">1.2</span>
              <span className="text-[9px] text-destructive">2.0</span>
            </div>
          </div>

          {/* Historical Trend */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
              <Activity className="h-3 w-3" /> Weekly P/C Ratio Trend
            </h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="pcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={putCallRatio >= 1 ? '#ef4444' : '#22c55e'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={putCallRatio >= 1 ? '#ef4444' : '#22c55e'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0.5, 1.5]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip
                    contentStyle={{ fontSize: 10, borderRadius: 6, backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(v) => [`${Number(v).toFixed(2)}`, 'P/C Ratio']}
                  />
                  {/* Danger zone lines */}
                  <CartesianGrid horizontal={false} vertical={false} />
                  <Area type="monotone" dataKey="ratio" stroke={putCallRatio >= 1 ? '#ef4444' : '#22c55e'} fill="url(#pcGrad)" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-1">
              <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive bg-destructive/10">
                Danger Zone (&gt;1.2)
              </Badge>
              <Badge variant="outline" className="text-[9px] border-success/30 text-success bg-success/10">
                Greed Zone (&lt;0.8)
              </Badge>
            </div>
          </div>

          {/* Strategies */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" /> Trading Strategies
            </h4>
            <div className="space-y-2">
              {strategies.map((s, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-primary">{s.icon}</div>
                    <p className="text-xs font-bold">{s.title}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Interpretation */}
        <div className="mt-4 p-3 rounded-xl bg-muted/20 border border-border/30">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold mb-1">Market Interpretation</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {putCallRatio >= 1.5
                  ? `Extreme fear in the market with P/C ratio at ${putCallRatio}. Historically, such levels have marked significant market bottoms. Contrarian investors may find this a compelling entry point, but patience is key - markets can remain irrational longer than you can remain solvent.`
                  : putCallRatio >= 1.2
                  ? `Rising fear with P/C ratio at ${putCallRatio}. The market is experiencing selling pressure. This could be a good time to start accumulating quality stocks in small quantities. Watch for confirmation signals before making large commitments.`
                  : putCallRatio <= 0.8
                  ? `Excessive optimism with P/C ratio at ${putCallRatio}. The market may be overheated. Consider booking partial profits and maintaining adequate cash reserves. Don't chase momentum blindly.`
                  : `Balanced market sentiment with P/C ratio at ${putCallRatio}. No extreme signals detected. Continue with your regular investment plan and focus on stock selection based on fundamentals.`
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
