import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle, BarChart3,
  ArrowUpRight, ArrowDownRight, RefreshCw, Clock, Zap, Info, Search,
  Database, Download, ChevronLeft, ChevronRight, Globe
} from "lucide-react";
import { apiRequest } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export default function Research() {
  const [movers, setMovers] = useState<any>({ indices: [], gainers: [], losers: [], up5Percent: [], down5Percent: [], upperCircuits: [], lowerCircuits: [] });
  const [stats, setStats] = useState<any>({ stockTraded: 0, advances: 0, declines: 0, upperCircuitCount: 0, lowerCircuitCount: 0 });
  const [sentiment, setSentiment] = useState<any>({ score: 50, sentiment: 'Neutral', summary: 'Gathering market intelligence...' });
  const [, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [allStocksList, setAllStocksList] = useState<any[]>([]);
  const [allStocksTotal, setAllStocksTotal] = useState(0);
  const [allStocksPage, setAllStocksPage] = useState(1);
  const [allStocksSearch, setAllStocksSearch] = useState('');
  const [allStocksLoading, setAllStocksLoading] = useState(false);
  const [allStocksExchange, setAllStocksExchange] = useState<'NSE' | 'BSE' | ''>('');
  const [refreshingStocks, setRefreshingStocks] = useState(false);
  const [stockCounts, setStockCounts] = useState({ nse: 0, bse: 0, total: 0 });

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const fetchAllStocksList = useCallback(async (page: number = 1, search: string = '', exchange: string = '') => {
    setAllStocksLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      });
      if (search) params.set('search', search);
      if (exchange) params.set('exchange', exchange);

      const data = await apiRequest(`/market/all-stocks?${params.toString()}`);
      setAllStocksList(data.stocks || []);
      setAllStocksTotal(data.total || 0);
      setAllStocksPage(data.page || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setAllStocksLoading(false);
    }
  }, []);

  const fetchStockCounts = useCallback(async () => {
    try {
      const data = await apiRequest('/market/all-stocks/count');
      setStockCounts(data || { nse: 0, bse: 0, total: 0 });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchStockCounts();
  }, [fetchStockCounts]);

  const handleRefreshStocks = async () => {
    setRefreshingStocks(true);
    try {
      await apiRequest('/stock-list/all-stocks/refresh', { method: 'POST' });
      await fetchStockCounts();
      await fetchAllStocksList(allStocksPage, allStocksSearch, allStocksExchange);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshingStocks(false);
    }
  };

  const handleSearchAllStocks = (value: string) => {
    setAllStocksSearch(value);
    fetchAllStocksList(1, value, allStocksExchange);
  };

  const handleExchangeFilter = (exchange: 'NSE' | 'BSE' | '') => {
    setAllStocksExchange(exchange);
    fetchAllStocksList(1, allStocksSearch, exchange);
  };

  const handleStockClick = async (stock: any) => {
    setSelectedStock(stock);
    setStockHistory([]);
    setHistoryLoading(true);
    try {
      const history = await apiRequest(`/market/history/${stock.symbol}`);
      setStockHistory(history.map((h: any) => ({
        time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: h.price
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLiveStockClick = async (stock: any) => {
    setSelectedStock(stock);
    setStockHistory([]);
    setHistoryLoading(true);
    try {
      const [liveData, history] = await Promise.all([
        apiRequest(`/market/live/${stock.symbol}`),
        apiRequest(`/market/history/${stock.symbol}`).catch(() => [])
      ]);
      if (liveData) {
        setSelectedStock(liveData);
      }
      if (history) {
        setStockHistory(history.map((h: any) => ({
          time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: h.price
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const indices = movers.indices || [];
  const allStocks = [...(movers.gainers || []), ...(movers.losers || [])].filter(
    (v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i
  );
  const filteredStocks = searchQuery
    ? allStocks.filter((s: any) => s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.symbol?.toLowerCase().includes(searchQuery.toLowerCase()))
    : allStocks;

  const allStocksTotalPages = Math.ceil(allStocksTotal / 50);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Intelligence</h1>
          <p className="text-muted-foreground">Live NSE/BSE data powered by Yahoo Finance.</p>
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatMiniCard title="Stocks Traded" value={stats.stockTraded?.toLocaleString() || '0'} icon={<BarChart3 className="h-4 w-4" />} />
        <StatMiniCard title="Advances" value={stats.advances || '0'} icon={<TrendingUp className="h-4 w-4" />} color="text-success" bg="bg-success/10" />
        <StatMiniCard title="Declines" value={stats.declines || '0'} icon={<TrendingDown className="h-4 w-4" />} color="text-destructive" bg="bg-destructive/10" />
        <StatMiniCard title="Upper Circuit" value={stats.upperCircuitCount || '0'} icon={<Zap className="h-4 w-4" />} color="text-warning" bg="bg-warning/10" />
        <StatMiniCard title="Lower Circuit" value={stats.lowerCircuitCount || '0'} icon={<AlertTriangle className="h-4 w-4" />} color="text-destructive" bg="bg-destructive/10" />
      </div>

      {indices.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Market Indices
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {indices.map((idx: any) => {
              const isPos = (idx.change || 0) >= 0;
              return (
                <Card key={idx.symbol} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground font-medium truncate">{idx.name}</p>
                    <p className="text-lg font-bold mt-1">{formatCurrency(idx.lastPrice)}</p>
                    <div className={`flex items-center gap-1 text-xs font-semibold ${isPos ? 'text-success' : 'text-destructive'}`}>
                      {isPos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {isPos ? '+' : ''}{idx.changePercent}%
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-warning" /> Circuit Breaker Alerts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-success/30 bg-success/10 border-0 shadow-sm">
                <CardHeader className="pb-2 px-4">
                  <CardTitle className="text-xs font-bold text-success uppercase tracking-wider flex items-center justify-between">
                    Upper Circuit (+5%)
                    <Badge variant="outline" className="text-[10px] border-success/30 text-success">{movers.up5Percent?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {movers.up5Percent?.length > 0 ? movers.up5Percent.map((m: any, i: number) => (
                      <CircuitRow key={i} m={m} onClick={() => handleStockClick(m)} />
                    )) : <p className="text-xs text-muted-foreground py-2">No stocks hit upper circuit</p>}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-destructive/30 bg-destructive/10 border-0 shadow-sm">
                <CardHeader className="pb-2 px-4">
                  <CardTitle className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center justify-between">
                    Lower Circuit (-5%)
                    <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">{movers.down5Percent?.length || 0}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {movers.down5Percent?.length > 0 ? movers.down5Percent.map((m: any, i: number) => (
                      <CircuitRow key={i} m={m} isNegative onClick={() => handleStockClick(m)} />
                    )) : <p className="text-xs text-muted-foreground py-2">No stocks hit lower circuit</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> NSE / BSE Stocks
              </h2>
              <div className="relative w-64">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search stocks..."
                  className="pl-9 h-8 text-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Tabs defaultValue="gainers" className="w-full">
              <TabsList className="bg-card border border-border p-1 rounded-xl mb-4 w-full justify-start overflow-x-auto flex">
                <TabsTrigger value="gainers" className="rounded-lg font-bold text-xs">
                  Top Gainers ({movers.gainers?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="losers" className="rounded-lg font-bold text-xs">
                  Top Losers ({movers.losers?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="all" className="rounded-lg font-bold text-xs">
                  Active ({allStocks.length})
                </TabsTrigger>
                <TabsTrigger value="all-nse-bse" className="rounded-lg font-bold text-xs">
                  All NSE/BSE ({allStocksTotal})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gainers">
                <StockTable stocks={movers.gainers || []} onStockClick={handleStockClick} />
              </TabsContent>
              <TabsContent value="losers">
                <StockTable stocks={movers.losers || []} onStockClick={handleStockClick} />
              </TabsContent>
              <TabsContent value="all">
                <StockTable stocks={filteredStocks} onStockClick={handleStockClick} />
              </TabsContent>
              <TabsContent value="all-nse-bse">
                <AllNSEBSEStocks
                  stocks={allStocksList}
                  total={allStocksTotal}
                  page={allStocksPage}
                  totalPages={allStocksTotalPages}
                  loading={allStocksLoading}
                  search={allStocksSearch}
                  exchange={allStocksExchange}
                  stockCounts={stockCounts}
                  refreshing={refreshingStocks}
                  onSearch={handleSearchAllStocks}
                  onExchangeFilter={handleExchangeFilter}
                  onPageChange={(p) => fetchAllStocksList(p, allStocksSearch, allStocksExchange)}
                  onRefresh={handleRefreshStocks}
                  onStockClick={handleLiveStockClick}
                />
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <div className="space-y-6">
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
              <div className="space-y-2">
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
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed">"{sentiment.summary}"</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Market Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Stocks</span>
                <span className="text-sm font-bold">{allStocks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gainers</span>
                <span className="text-sm font-bold text-success">{movers.gainers?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Losers</span>
                <span className="text-sm font-bold text-destructive">{movers.losers?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Upper Circuits</span>
                <span className="text-sm font-bold text-warning">{movers.up5Percent?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lower Circuits</span>
                <span className="text-sm font-bold text-destructive">{movers.down5Percent?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm text-muted-foreground">Advance/Decline Ratio</span>
                <span className="text-sm font-bold">{stats.advances && stats.declines ? (stats.advances / stats.declines).toFixed(2) : 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" /> Stock Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" /> NSE Stocks
                </span>
                <span className="text-sm font-bold">{stockCounts.nse.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" /> BSE Stocks
                </span>
                <span className="text-sm font-bold">{stockCounts.bse.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm text-muted-foreground">Total in DB</span>
                <span className="text-sm font-bold">{stockCounts.total.toLocaleString()}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={handleRefreshStocks}
                disabled={refreshingStocks}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${refreshingStocks ? 'animate-spin' : ''}`} />
                {refreshingStocks ? 'Refreshing...' : 'Refresh Stock List'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedStock} onOpenChange={() => setSelectedStock(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStock?.name}
              <Badge variant="outline" className="text-xs">{selectedStock?.symbol}</Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedStock && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Last Price</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedStock.lastPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Change</p>
                  <p className={`text-2xl font-bold ${(selectedStock.change || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {selectedStock.change >= 0 ? '+' : ''}{formatCurrency(selectedStock.change || 0)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-muted dark:bg-card rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Open</p>
                  <p className="text-sm font-bold">{formatCurrency(selectedStock.openPrice || 0)}</p>
                </div>
                <div className="bg-muted dark:bg-card rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">High</p>
                  <p className="text-sm font-bold text-success">{formatCurrency(selectedStock.highPrice || 0)}</p>
                </div>
                <div className="bg-muted dark:bg-card rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Low</p>
                  <p className="text-sm font-bold text-destructive">{formatCurrency(selectedStock.lowPrice || 0)}</p>
                </div>
                <div className="bg-muted dark:bg-card rounded-lg p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Volume</p>
                  <p className="text-sm font-bold">{(selectedStock.volume || 0).toLocaleString()}</p>
                </div>
              </div>
              {stockHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Price History</p>
                  <ChartContainer
                    config={{
                      price: {
                        label: "Price",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-50 w-full"
                  >
                    <AreaChart data={stockHistory}>
                      <defs>
                        <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                        }
                      />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="url(#stockGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                </div>
              )}
              {historyLoading && <p className="text-xs text-muted-foreground text-center">Loading price history...</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AllNSEBSEStocks({ stocks, total, page, totalPages, loading, search, exchange, stockCounts, refreshing, onSearch, onExchangeFilter, onPageChange, onRefresh, onStockClick }: {
  stocks: any[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  search: string;
  exchange: string;
  stockCounts: { nse: number; bse: number; total: number };
  refreshing: boolean;
  onSearch: (value: string) => void;
  onExchangeFilter: (exchange: 'NSE' | 'BSE' | '') => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onStockClick: (stock: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={exchange === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onExchangeFilter('')}
            className="text-xs h-7"
          >
            All ({stockCounts.total.toLocaleString()})
          </Button>
          <Button
            variant={exchange === 'NSE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onExchangeFilter('NSE')}
            className="text-xs h-7"
          >
            NSE ({stockCounts.nse.toLocaleString()})
          </Button>
          <Button
            variant={exchange === 'BSE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onExchangeFilter('BSE')}
            className="text-xs h-7"
          >
            BSE ({stockCounts.bse.toLocaleString()})
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or symbol..."
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} className="h-8">
            <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {stockCounts.total === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Database className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No stocks in database yet.</p>
            <Button onClick={onRefresh} disabled={refreshing} size="sm">
              <Download className="h-4 w-4 mr-1" />
              {refreshing ? 'Fetching stocks...' : 'Fetch All NSE/BSE Stocks'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Loading stocks...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left py-2 px-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-center py-2 px-3 font-medium text-muted-foreground">Exchange</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Price</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Change</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Change %</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Volume</th>
                  <th className="text-right py-2 px-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock: any, i: number) => {
                  const isPos = (stock.changePercent || 0) >= 0;
                  const hasPrice = stock.lastPrice && stock.lastPrice > 0;
                  return (
                    <tr
                      key={stock.symbol + stock.exchange || i}
                      className="border-b last:border-0 hover:bg-accent cursor-pointer"
                      onClick={() => onStockClick(stock)}
                    >
                      <td className="py-2.5 px-3 text-muted-foreground text-xs">{(page - 1) * 50 + i + 1}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold">{stock.name || stock.symbol}</p>
                        <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant="outline" className={`text-[10px] ${stock.exchange === 'NSE' ? 'border-primary/30 text-primary bg-primary/10' : 'border-warning/30 text-warning bg-warning/10'}`}>
                          {stock.exchange}
                        </Badge>
                      </td>
                      <td className="text-right py-2.5 px-3 font-bold">
                        {hasPrice ? formatCurrency(stock.lastPrice) : '-'}
                      </td>
                      <td className={`text-right py-2.5 px-3 font-semibold ${isPos ? 'text-success' : 'text-destructive'}`}>
                        {hasPrice ? `${isPos ? '+' : ''}${formatCurrency(stock.change || 0)}` : '-'}
                      </td>
                      <td className="text-right py-2.5 px-3">
                        {hasPrice ? (
                          <Badge variant="outline" className={`text-xs font-bold ${isPos ? 'border-success/30 text-success bg-success/10' : 'border-destructive/30 text-destructive bg-destructive/10'}`}>
                            {isPos ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                            {isPos ? '+' : ''}{stock.changePercent}%
                          </Badge>
                        ) : '-'}
                      </td>
                      <td className="text-right py-2.5 px-3 text-muted-foreground">
                        {stock.volume ? stock.volume.toLocaleString() : '-'}
                      </td>
                      <td className="text-right py-2.5 px-3">
                        <Badge variant="outline" className={`text-[10px] ${stock.status === 'Active' ? 'border-success/30 text-success bg-success/10' : 'border-muted text-muted-foreground'}`}>
                          {stock.status || 'Active'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total.toLocaleString()} stocks
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-medium">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
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
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Stock</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Price</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Change</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Change %</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Volume</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">High</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Low</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock: any, i: number) => {
            const isPos = (stock.changePercent || 0) >= 0;
            return (
              <tr key={stock.symbol || i} className="border-b last:border-0 hover:bg-accent cursor-pointer"
                onClick={() => onStockClick(stock)}>
                <td className="py-2.5 px-3 text-muted-foreground text-xs">{i + 1}</td>
                <td className="py-2.5 px-3">
                  <p className="font-semibold">{stock.name}</p>
                  <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                </td>
                <td className="text-right py-2.5 px-3 font-bold">{formatCurrency(stock.lastPrice)}</td>
                <td className={`text-right py-2.5 px-3 font-semibold ${isPos ? 'text-success' : 'text-destructive'}`}>
                  {isPos ? '+' : ''}{formatCurrency(stock.change || 0)}
                </td>
                <td className="text-right py-2.5 px-3">
                  <Badge variant="outline" className={`text-xs font-bold ${isPos ? 'border-success/30 text-success bg-success/10' : 'border-destructive/30 text-destructive bg-destructive/10'}`}>
                    {isPos ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                    {isPos ? '+' : ''}{stock.changePercent}%
                  </Badge>
                </td>
                <td className="text-right py-2.5 px-3 text-muted-foreground">{(stock.volume || 0).toLocaleString()}</td>
                <td className="text-right py-2.5 px-3 text-success">{formatCurrency(stock.highPrice || 0)}</td>
                <td className="text-right py-2.5 px-3 text-destructive">{formatCurrency(stock.lowPrice || 0)}</td>
              </tr>
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
