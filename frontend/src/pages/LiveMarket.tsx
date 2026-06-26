import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  RefreshCw, Activity, Clock, BarChart3, Globe, Zap,
   Loader2, X, Search, FlaskConical
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { apiRequest } from '@/lib/api';
import { formatCurrencyDec as formatCurrency, formatVolume } from '@/lib/utils';
import { motion } from 'framer-motion';
import CandlestickChart from '@/components/ui/CandlestickChart';
import SymbolSearchDialog from '@/components/ui/SymbolSearchDialog';
import IndicatorsModal from '@/components/ui/IndicatorsModal';

const formatNumber = (val: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(val);

interface YahooQuote {
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
  pe: number | null;
  dividendYield: number | null;
  week52High: number | null;
  week52Low: number | null;
  avgVolume: number;
  currency: string;
  type?: string;
}

interface ChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketOverview {
  indices: YahooQuote[];
  stocks: YahooQuote[];
  breadth: { advances: number; declines: number; unchanged: number };
  gainers: YahooQuote[];
  losers: YahooQuote[];
}

const POPULAR_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance', exchange: 'NSE' },
  { symbol: 'TCS.NS', name: 'TCS', exchange: 'NSE' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', exchange: 'NSE' },
  { symbol: 'INFY.NS', name: 'Infosys', exchange: 'NSE' },
  { symbol: 'AAPL', name: 'Apple', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla', exchange: 'NASDAQ' },
  { symbol: 'BTC/USD', name: 'Bitcoin', exchange: 'Crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', exchange: 'Crypto' },
  { symbol: '^NSEI', name: 'Nifty 50', exchange: 'NSE' },
  { symbol: '^BSESN', name: 'SENSEX', exchange: 'BSE' },
];

export default function LiveMarket() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [marketStatus, setMarketStatus] = useState<any>(null);

  // Chart state
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [candleData, setCandleData] = useState<any>(null);
  const searchPeriod = '1mo';
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);

  // Search dialog
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  // Index detail state
  const [selectedIndex, setSelectedIndex] = useState<YahooQuote | null>(null);
  const [indexChart, setIndexChart] = useState<ChartData[]>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexPeriod, setIndexPeriod] = useState('3mo');

  const fetchOverview = useCallback(async () => {
    try {
      const [overviewData, statusData] = await Promise.all([
        apiRequest('/yahoo/overview'),
        apiRequest('/market/status'),
      ]);
      setOverview(overviewData);
      setMarketStatus(statusData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectSymbol = useCallback(async (symbol: string, name: string) => {
    setSelectedSymbol(symbol);
    setSelectedName(name);
    setActiveTab('chart');
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => {
      if (marketStatus?.status !== 'holiday') fetchOverview();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchOverview, marketStatus?.status]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOverview();
    setRefreshing(false);
  };

  const handleIndexClick = async (index: YahooQuote) => {
    setSelectedIndex(index);
    setIndexLoading(true);
    try {
      const chartData = await apiRequest(`/yahoo/chart/${encodeURIComponent(index.symbol)}?range=${indexPeriod}&interval=1d`);
      setIndexChart(chartData || []);
    } catch {
      setIndexChart([]);
    } finally {
      setIndexLoading(false);
    }
  };

  useEffect(() => {
    if (selectedIndex?.symbol) {
      handleIndexClick(selectedIndex);
    }
  }, [indexPeriod]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const indices = overview?.indices || [];
  const gainers = overview?.gainers || [];
  const losers = overview?.losers || [];
  const breadth = overview?.breadth || { advances: 0, declines: 0, unchanged: 0 };
  const advanceDeclineData = [
    { name: 'Advances', value: breadth.advances, color: '#22c55e' },
    { name: 'Declines', value: breadth.declines, color: '#ef4444' },
    { name: 'Unchanged', value: breadth.unchanged, color: '#6b7280' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" /> Live Market
          </h1>
          <p className="text-muted-foreground">Real-time market data & candlestick charts</p>
        </div>
        <div className="flex items-center gap-3">
          {marketStatus?.isOpen ? (
            <Badge variant="outline" className="h-6 gap-1 border-success/30 text-success bg-success/10">
              <Activity className="h-3 w-3" /> Live
            </Badge>
          ) : marketStatus?.status === 'holiday' ? (
            <Badge variant="outline" className="h-6 gap-1 border-muted-foreground/30 text-muted-foreground bg-muted/10">
              <Clock className="h-3 w-3" /> Market Holiday
            </Badge>
          ) : (
            <Badge variant="outline" className="h-6 gap-1 border-warning/30 text-warning bg-warning/10">
              <Clock className="h-3 w-3" /> Market Closed
            </Badge>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {lastUpdated.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={() => setSearchDialogOpen(true)} className="gap-1.5">
            <Search className="h-4 w-4" /> Search
            <kbd className="px-1 py-0.5 bg-background rounded text-[9px] font-mono border ml-1">Ctrl+K</kbd>
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs: Chart | Market */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="chart" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Charts
          </TabsTrigger>
          <TabsTrigger value="market" className="text-xs gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Market Overview
          </TabsTrigger>
        </TabsList>
    
        {/* Charts Tab */}
        <TabsContent value="chart" className="space-y-4 mt-4">
          {/* Popular Stocks Quick Select */}
          {!selectedSymbol && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" /> Quick Select
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {POPULAR_STOCKS.map(s => (
                    <button
                      key={s.symbol}
                      onClick={() => handleSelectSymbol(s.symbol, s.name)}
                      className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 hover:bg-accent rounded-lg transition-all border border-border/30 hover:border-primary/30 group"
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold truncate">{s.symbol.replace('.NS', '').replace('^', '')}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Candlestick Chart */}
          {selectedSymbol ? (
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
                      onClick={() => { setSelectedSymbol(''); setSelectedName(''); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <IndicatorsModal open={isIndicatorsModalOpen} onOpenChange={setIsIndicatorsModalOpen} />
                <CandlestickChart
                  symbol={selectedSymbol}
                  range={searchPeriod}
                  height={500}
                  onCandleHover={setCandleData}
                />
                {candleData && (
                  <div className="flex items-center gap-4 mt-3 px-2 py-1.5 bg-muted/30 rounded-lg text-[10px] font-mono flex-wrap">
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
          ) : (
            <Card className="border-border/50 border-dashed">
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">Select a stock to view chart</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Choose from above or press Ctrl+K to search</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Market Overview Tab */}
        <TabsContent value="market" className="space-y-4 mt-4">
          {/* Indices */}
          {indices.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Market Indices
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {indices.map((idx) => (
                  <IndexCard
                    key={idx.symbol}
                    data={idx}
                    onClick={() => handleIndexClick(idx)}
                    isSelected={selectedIndex?.symbol === idx.symbol}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selected Index Detail */}
          {selectedIndex && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" /> {selectedIndex.name}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIndex(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <div className="flex gap-1 mb-3">
                      {['1wk', '1mo', '3mo', '6mo', '1y'].map(p => (
                        <button key={p} className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors ${indexPeriod === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`} onClick={() => setIndexPeriod(p)}>{p}</button>
                      ))}
                    </div>
                    {indexLoading ? (
                      <div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : indexChart.length > 1 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={indexChart.map(c => ({ date: new Date(c.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), close: c.close }))}>
                            <defs>
                              <linearGradient id="indexGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={selectedIndex.changePercent >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={selectedIndex.changePercent >= 0 ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: any) => [formatCurrency(value), 'Price']} />
                            <Area type="monotone" dataKey="close" stroke={selectedIndex.changePercent >= 0 ? '#22c55e' : '#ef4444'} fill="url(#indexGrad)" strokeWidth={2} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No chart data</div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-black">{formatCurrency(selectedIndex.price)}</p>
                      <p className={`text-sm font-bold ${selectedIndex.changePercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {selectedIndex.changePercent >= 0 ? '+' : ''}{(selectedIndex.change ?? 0).toFixed(2)} ({(selectedIndex.changePercent ?? 0).toFixed(2)}%)
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-[9px] text-muted-foreground">Open</p><p className="text-[10px] font-bold">{formatCurrency(selectedIndex.open)}</p></div>
                      <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-[9px] text-muted-foreground">Prev Close</p><p className="text-[10px] font-bold">{formatCurrency(selectedIndex.prevClose)}</p></div>
                      <div className="bg-success/10 rounded-lg p-2 text-center"><p className="text-[9px] text-success">High</p><p className="text-[10px] font-bold text-success">{formatCurrency(selectedIndex.high)}</p></div>
                      <div className="bg-destructive/10 rounded-lg p-2 text-center"><p className="text-[9px] text-destructive">Low</p><p className="text-[10px] font-bold text-destructive">{formatCurrency(selectedIndex.low)}</p></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Breadth</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs"><span className="text-success">Advances</span><span className="font-bold text-success">{breadth.advances}</span></div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-success rounded-full" style={{ width: `${(breadth.advances / Math.max(breadth.advances + breadth.declines + 1, 1)) * 100}%` }} /></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-destructive">Declines</span><span className="font-bold text-destructive">{breadth.declines}</span></div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-destructive rounded-full" style={{ width: `${(breadth.declines / Math.max(breadth.advances + breadth.declines + 1, 1)) * 100}%` }} /></div>
                </div>
                <div className="mt-3 h-20"><ResponsiveContainer width="100%" height="100%"><BarChart data={advanceDeclineData} layout="vertical" barSize={12}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} /><Bar dataKey="value" radius={[0, 4, 4, 0]}>{advanceDeclineData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar></BarChart></ResponsiveContainer></div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-warning" /> Stats</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Tracked</span><span className="text-sm font-bold">{gainers.length + losers.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Top Gainer</span><span className="text-sm font-bold text-success truncate ml-2">{gainers[0]?.name || '-'} (+{gainers[0]?.changePercent?.toFixed(2) || 0}%)</span></div>
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Top Loser</span><span className="text-sm font-bold text-destructive truncate ml-2">{losers[0]?.name || '-'} ({losers[0]?.changePercent?.toFixed(2) || 0}%)</span></div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Search className="h-4 w-4 text-primary" /> Quick Quote</CardTitle></CardHeader>
              <CardContent>
                <button onClick={() => setSearchDialogOpen(true)} className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:border-border transition-all">
                  <Search className="h-4 w-4" />
                  <span className="flex-1 text-left">Search any stock...</span>
                  <kbd className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono border">Ctrl+K</kbd>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Gainers / Losers */}
          <Tabs defaultValue="gainers">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="gainers" className="text-xs gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-success" /> Top Gainers</TabsTrigger>
              <TabsTrigger value="losers" className="text-xs gap-1.5"><TrendingDown className="h-3.5 w-3.5 text-destructive" /> Top Losers</TabsTrigger>
            </TabsList>
            <TabsContent value="gainers">
              <Card className="border-0 shadow-md"><CardContent className="p-0">
                {gainers.length > 0 ? (
                  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/30">
                    <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs">#</th>
                    <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs">Stock</th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">LTP</th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">Change</th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">%</th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">Volume</th>
                  </tr></thead><tbody>
                    {gainers.map((stock: YahooQuote, i: number) => (
                      <StockRow key={stock.symbol} stock={stock} index={i + 1} onClick={() => handleSelectSymbol(stock.symbol, stock.name)} />
                    ))}
                  </tbody></table></div>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="losers">
              <Card className="border-0 shadow-md"><CardContent className="p-0">
                {losers.length > 0 ? (
                  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/30">
                    <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs">#</th>
                    <th className="text-left py-2.5 px-4 font-medium text-muted-foreground text-xs">Stock</th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">LTP</th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">Change</th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">%</th>
                    <th className="text-right py-2.5 px-4 font-medium text-muted-foreground text-xs">Volume</th>
                  </tr></thead><tbody>
                    {losers.map((stock: YahooQuote, i: number) => (
                      <StockRow key={stock.symbol} stock={stock} index={i + 1} onClick={() => handleSelectSymbol(stock.symbol, stock.name)} />
                    ))}
                  </tbody></table></div>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <SymbolSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSelect={handleSelectSymbol}
      />
    </div>
  );
}

function IndexCard({ data, onClick, isSelected }: { data: YahooQuote; onClick: () => void; isSelected: boolean }) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(data.price);

  useEffect(() => {
    if (data.price > prevPriceRef.current) {
      setFlash('up');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    } else if (data.price < prevPriceRef.current) {
      setFlash('down');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = data.price;
  }, [data.price]);

  const isPositive = (data.change || 0) >= 0;
  return (
    <motion.div
      animate={{
        backgroundColor: flash === 'up' ? 'rgba(34, 197, 94, 0.15)' : flash === 'down' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(var(--card), 1)',
      }}
      className={`rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group bg-card ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <p className="text-[10px] text-muted-foreground font-medium truncate">{data.name}</p>
        <p className="text-lg font-bold mt-1">{formatCurrency(data.price)}</p>
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {isPositive ? '+' : ''}{data.changePercent?.toFixed(2)}%
        </div>
        <div className="flex gap-2 mt-2 text-[9px]">
          <span className="text-success">H: {formatCurrency(data.high)}</span>
          <span className="text-destructive">L: {formatCurrency(data.low)}</span>
        </div>
      </CardContent>
    </motion.div>
  );
}

function StockRow({ stock, index, onClick }: { stock: YahooQuote; index: number; onClick: () => void }) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(stock.price);

  useEffect(() => {
    if (stock.price > prevPriceRef.current) {
      setFlash('up');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    } else if (stock.price < prevPriceRef.current) {
      setFlash('down');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = stock.price;
  }, [stock.price]);

  const isPositive = (stock.changePercent || 0) >= 0;
  return (
    <motion.tr
      animate={{
        backgroundColor: flash === 'up' ? 'rgba(34, 197, 94, 0.1)' : flash === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
      }}
      className="border-b last:border-0 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <td className="py-2.5 px-4 text-xs text-muted-foreground font-medium">{index}</td>
      <td className="py-2.5 px-4">
        <div>
          <p className="font-semibold text-xs">{stock.name}</p>
          <p className="text-[10px] text-muted-foreground">{stock.symbol}</p>
        </div>
      </td>
      <td className="text-right py-2.5 px-4 font-bold text-xs">{formatCurrency(stock.price)}</td>
      <td className={`text-right py-2.5 px-4 font-bold text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {isPositive ? '+' : ''}{(stock.change ?? 0).toFixed(2)}
      </td>
      <td className="text-right py-2.5 px-4">
        <Badge variant={isPositive ? 'default' : 'destructive'} className={`text-[10px] ${isPositive ? 'bg-success/10 text-success border-success/30' : ''}`}>
          {isPositive ? '+' : ''}{(stock.changePercent ?? 0).toFixed(2)}%
        </Badge>
      </td>
      <td className="text-right py-2.5 px-4 text-xs text-muted-foreground">{formatVolume(stock.volume)}</td>
    </motion.tr>
  );
}
