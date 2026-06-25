import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  Loader2, RefreshCw, Activity, BarChart3, Clock
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { apiRequest } from '@/lib/api';
import { formatCurrency, formatCompact } from '@/lib/utils';
import FinancialHealthCard from '@/components/ui/FinancialHealthCard';
import MarketTicker from '@/components/ui/MarketTicker';
import LiveWatchlist from '@/components/ui/LiveWatchlist';

export default function Dashboard() {
  const { summary, holdings, loading, fetchPortfolio } = usePortfolioStore();
  const [movers, setMovers] = useState<any>({ indices: [], gainers: [], losers: [] });
  const [netWorth, setNetWorth] = useState<any>({ totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
  const [stats, setStats] = useState<any>({ advances: 0, declines: 0 });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const fetchMarketData = useCallback(async () => {
    try {
      const [moversData, netWorthData, statsData] = await Promise.all([
        apiRequest('/market/movers'),
        apiRequest('/net-worth/net-worth'),
        apiRequest('/market-stats/stats'),
      ]);
      setMovers(moversData || { indices: [], gainers: [], losers: [] });
      setNetWorth(netWorthData || { totalAssets: 0, totalLiabilities: 0, netWorth: 0 });
      setStats(statsData || { advances: 0, declines: 0 });
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, [fetchPortfolio, fetchMarketData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMarketData();
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
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MarketTicker />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground">Real-time market data and portfolio insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-6 gap-1 border-success/30 text-success bg-success/10">
            <Activity className="h-3 w-3" /> Live
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {lastUpdated.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <Wallet className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netWorth.netWorth)}</div>
            <p className="text-xs text-primary">Assets: {formatCurrency(netWorth.totalAssets)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalGain)}</div>
            <div className={`flex items-center text-xs ${summary.totalGain >= 0 ? 'text-success' : 'text-destructive'}`}>
              <ArrowUpRight className="mr-1 h-3 w-3" />
              {(summary.xirr ?? 0).toFixed(2)}% XIRR
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Advances</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.advances || 0}</div>
            <p className="text-xs text-muted-foreground">Stocks up today</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Declines</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.declines || 0}</div>
            <p className="text-xs text-muted-foreground">Stocks down today</p>
          </CardContent>
        </Card>
      </div>

      {indices.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Live Market Indices
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {indices.map((idx: any) => (
              <IndexCard key={idx.symbol} data={idx} />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-0 shadow-md">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {allocationData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <div className="col-span-3 space-y-4">
          <LiveWatchlist />
          <FinancialHealthCard />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" /> Top Gainers (NSE/BSE)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topGainers.length > 0 ? (
              <div className="space-y-2">
                {topGainers.map((stock: any, i: number) => (
                  <MarketRow key={stock.symbol || i} stock={stock} isGainer />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> Top Losers (NSE/BSE)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLosers.length > 0 ? (
              <div className="space-y-2">
                {topLosers.map((stock: any, i: number) => (
                  <MarketRow key={stock.symbol || i} stock={stock} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {topGainers.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">All Tracked Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
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
                  {[...(movers.gainers || []), ...(movers.losers || [])].filter((v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i).map((stock: any) => (
                    <tr key={stock.symbol} className="border-b last:border-0 hover:bg-accent">
                      <td className="py-2 px-3">
                        <div>
                          <p className="font-medium">{stock.name}</p>
                          <p className="text-xs text-muted-foreground">{stock.symbol}</p>
                        </div>
                      </td>
                      <td className="text-right py-2 px-3 font-medium">{formatCurrency(stock.lastPrice)}</td>
                      <td className={`text-right py-2 px-3 font-medium ${(stock.change || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change || 0)}
                      </td>
                      <td className={`text-right py-2 px-3 font-medium ${(stock.changePercent || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                      </td>
                      <td className="text-right py-2 px-3 text-muted-foreground">{(stock.volume || 0).toLocaleString()}</td>
                      <td className="text-right py-2 px-3 text-muted-foreground">{formatCurrency(stock.highPrice || 0)}</td>
                      <td className="text-right py-2 px-3 text-muted-foreground">{formatCurrency(stock.lowPrice || 0)}</td>
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
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground font-medium truncate">{data.name}</p>
        <p className="text-lg font-bold mt-1">{formatCurrency(data.lastPrice)}</p>
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {isPositive ? '+' : ''}{data.changePercent}%
          <span className="text-muted-foreground font-normal ml-1">({isPositive ? '+' : ''}{formatCurrency(data.change || 0)})</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketRow({ stock, isGainer }: { stock: any; isGainer?: boolean }) {
  const isPositive = (stock.changePercent || 0) >= 0;
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{stock.name}</p>
        <p className="text-xs text-muted-foreground">{stock.symbol}</p>
      </div>
      <div className="text-right ml-4">
        <p className="text-sm font-bold">{formatCurrency(stock.lastPrice)}</p>
        <p className={`text-xs font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? '+' : ''}{stock.changePercent}%
        </p>
      </div>
    </div>
  );
}
