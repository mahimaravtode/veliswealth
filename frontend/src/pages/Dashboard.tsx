import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  Loader2, RefreshCw, Activity, BarChart3, Clock, Sparkles
} from "lucide-react";
import { PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { apiRequest } from '@/lib/api';
import { useMarketStream } from '@/hooks/useMarketStream';
import FinancialHealthCard from '@/components/ui/FinancialHealthCard';
import MarketTicker from '@/components/ui/MarketTicker';

function LivePrice({ value, format = true }: { value: number; format?: boolean }) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlash(value > prevRef.current ? 'up' : 'down');
      prevRef.current = value;
      const t = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [value]);

  const cls = flash === 'up' ? 'bg-success/10 text-success' : flash === 'down' ? 'bg-destructive/10 text-destructive' : '';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-xl transition-all duration-300 ${cls}`}>
      {format ? formatCurrency(value) : value}
    </span>
  );
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export default function Dashboard() {
  const { summary, holdings, loading, fetchPortfolio } = usePortfolioStore();
  const [movers, setMovers] = useState<any>({ indices: [], gainers: [], losers: [] });
  const [netWorth, setNetWorth] = useState<any>({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  const [stats, setStats] = useState<any>({ advances: 0, declines: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const handleMarketData = useCallback((data: any) => {
    if (data) {
      setMovers(data);
      setLastUpdated(new Date());
    }
  }, []);

  useMarketStream(handleMarketData);

  useEffect(() => {
    fetchPortfolio();
    const fetchStatic = async () => {
      try {
        const [netWorthData, statsData, moversData] = await Promise.all([
          apiRequest('/net-worth/net-worth'),
          apiRequest('/market-stats/stats'),
          apiRequest('/market/movers').catch(() => null),
        ]);
        setNetWorth(netWorthData || { totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
        setStats(statsData || { advances: 0, declines: 0 });
        if (moversData && (!movers.gainers || movers.gainers.length === 0)) {
          setMovers(moversData);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatic();
  }, [fetchPortfolio]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [netWorthData, statsData] = await Promise.all([
        apiRequest('/net-worth/net-worth'),
        apiRequest('/market-stats/stats'),
      ]);
      setNetWorth(netWorthData || { totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
      setStats(statsData || { advances: 0, declines: 0 });
    } catch (err) {
      console.error(err);
    }
    setRefreshing(false);
  };

  const indices = movers.indices || [];
  const topGainers = (movers.gainers || []).slice(0, 5);
  const topLosers = (movers.losers || []).slice(0, 5);

  const allocationData = [
    { name: 'Equity', value: 60, color: '#2563eb' },
    { name: 'Debt', value: 30, color: '#f59e0b' },
    { name: 'Gold', value: 10, color: '#10b981' },
  ];

  if (loading && holdings.length === 0) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-3xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <MarketTicker />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Financial Overview</h1>
            <div className="p-1.5 bg-primary/10 rounded-xl">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Real-time market data and portfolio insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Live
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {lastUpdated.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2 lg:col-span-1 border-0 bg-linear-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(netWorth.netWorth)}</div>
            <p className="text-xs text-primary font-medium mt-1">Assets: {formatCurrency(netWorth.totalAssets)}</p>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <div className="p-2 bg-success/10 rounded-xl">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{formatCurrency(summary.totalGain)}</div>
            <div className={`flex items-center text-xs font-semibold mt-1 ${summary.totalGain >= 0 ? 'text-success' : 'text-destructive'}`}>
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {summary.xirr.toFixed(2)}% XIRR
            </div>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advances</CardTitle>
            <div className="p-2 bg-success/10 rounded-xl">
              <BarChart3 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-success">{stats.advances || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Stocks up today</p>
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declines</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-xl">
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive">{stats.declines || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Stocks down today</p>
          </CardContent>
        </Card>
      </div>

      {indices.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-xl">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            Live Market Indices
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {indices.map((idx: any) => (
              <IndexCard key={idx.symbol} data={idx} />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-0">
          <CardHeader>
            <CardTitle className="text-base">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-70 w-full">
              <ChartContainer
                config={{
                  Equity: { label: "Equity", color: "#2563eb" },
                  Debt: { label: "Debt", color: "#f59e0b" },
                  Gold: { label: "Gold", color: "#10b981" },
                }}
                className="h-full w-full"
              >
                <PieChart>
                  <Pie data={allocationData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                    {allocationData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
        <div className="col-span-3 space-y-4">
          <FinancialHealthCard />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-success/10 rounded-xl">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topGainers.length > 0 ? (
              <div className="space-y-1">
                {topGainers.map((stock: any, i: number) => (
                  <MarketRow key={stock.symbol || i} stock={stock} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-1.5 bg-destructive/10 rounded-xl">
                <TrendingDown className="h-4 w-4 text-destructive" />
              </div>
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLosers.length > 0 ? (
              <div className="space-y-1">
                {topLosers.map((stock: any, i: number) => (
                  <MarketRow key={stock.symbol || i} stock={stock} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {topGainers.length > 0 && (
        <Card className="border-0">
          <CardHeader>
            <CardTitle className="text-base">All Tracked Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Stock</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Change</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Change %</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Volume</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">High</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Low</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(movers.gainers || []), ...(movers.losers || [])].filter((v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i).map((stock: any) => (
                    <tr key={stock.symbol} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors duration-200">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold">{stock.name}</p>
                          <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-semibold">{formatCurrency(stock.lastPrice)}</td>
                      <td className={`text-right py-3 px-4 font-semibold ${(stock.change || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change || 0)}
                      </td>
                      <td className={`text-right py-3 px-4 font-semibold ${(stock.changePercent || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">{(stock.volume || 0).toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-muted-foreground">{formatCurrency(stock.highPrice || 0)}</td>
                      <td className="text-right py-3 px-4 text-muted-foreground">{formatCurrency(stock.lowPrice || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function IndexCard({ data }: { data: any }) {
  const isPositive = (data.change || 0) >= 0;
  return (
    <Card className="border-0 hover:shadow-md transition-all duration-300 group">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground font-medium truncate mb-2">{data.name}</p>
        <p className="text-lg font-black"><LivePrice value={data.lastPrice || 0} /></p>
        <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {isPositive ? '+' : ''}{data.changePercent}%
          <span className="text-muted-foreground font-normal ml-1">({isPositive ? '+' : ''}{formatCurrency(data.change || 0)})</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketRow({ stock }: { stock: any }) {
  const isPositive = (stock.changePercent || 0) >= 0;
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/30 transition-colors duration-200">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{stock.name}</p>
        <p className="text-xs text-muted-foreground">{stock.symbol}</p>
      </div>
      <div className="text-right ml-4">
        <p className="text-sm font-bold"><LivePrice value={stock.lastPrice || 0} /></p>
        <p className={`text-xs font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? '+' : ''}{stock.changePercent}%
        </p>
      </div>
    </div>
  );
}
