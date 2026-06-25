import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Plus, TrendingUp, TrendingDown, Zap, Loader2 } from "lucide-react";
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function Portfolio() {
  const { holdings, loading, fetchPortfolio, syncHoldings, summary } = usePortfolioStore();
  const [refreshing, setRefreshing] = useState(false);
  const [lastLiveRefresh, setLastLiveRefresh] = useState<Date | null>(null);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleSyncMockData = () => {
    const mockHoldings = [
      { schemeCode: "101", schemeName: "SBI Nifty 50 Index", units: 100, avgNav: 150, currentNav: 184, category: "Equity" },
      { schemeCode: "102", schemeName: "HDFC Balanced Advantage", units: 500, avgNav: 380, currentNav: 420, category: "Hybrid" },
    ];
    syncHoldings(mockHoldings);
  };

  const handleRefreshLive = async () => {
    setRefreshing(true);
    try {
      const data = await apiRequest('/portfolio/refresh-live', { method: 'POST' });
      if (data?.holdings) {
        syncHoldings(data.holdings);
      }
      setLastLiveRefresh(new Date());
    } catch (err) {
      console.error('Live refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Holdings</h1>
          <p className="text-muted-foreground">Manage and track your individual investments.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefreshLive} disabled={refreshing}>
            <Zap className={`mr-2 h-4 w-4 ${refreshing ? 'animate-pulse' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Live Prices'}
          </Button>
          <Button variant="outline" onClick={handleSyncMockData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sync Data
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Asset
          </Button>
        </div>
      </div>

      {holdings.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Invested</p>
              <p className="text-lg font-bold">{formatCurrency(summary.totalInvested)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Current Value</p>
              <p className="text-lg font-bold">{formatCurrency(summary.currentValue)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Gain/Loss</p>
              <p className={`text-lg font-bold ${summary.totalGain >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(summary.totalGain)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Returns %</p>
              <p className={`text-lg font-bold ${summary.xirr >= 0 ? 'text-success' : 'text-destructive'}`}>
                {(summary.xirr ?? 0).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {lastLiveRefresh && (
        <p className="text-xs text-muted-foreground">
          Last live refresh: {lastLiveRefresh.toLocaleTimeString()}
        </p>
      )}

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Scheme Name</TableHead>
              <TableHead>Units</TableHead>
              <TableHead>Avg. NAV</TableHead>
              <TableHead>Curr. NAV</TableHead>
              <TableHead>Market Value</TableHead>
              <TableHead className="text-right">Profit/Loss</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : holdings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No holdings found. Click 'Sync Data' to add mock holdings.
                </TableCell>
              </TableRow>
            ) : (
              holdings.map((h, i) => {
                const marketValue = h.units * h.currentNav;
                const profit = marketValue - (h.units * h.avgNav);
                const isProfit = profit >= 0;

                return (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="font-medium">{h.schemeName}</div>
                      <Badge variant="secondary" className="text-[10px] uppercase">{h.category}</Badge>
                    </TableCell>
                    <TableCell>{h.units}</TableCell>
                    <TableCell>{formatCurrency(h.avgNav)}</TableCell>
                    <TableCell>{formatCurrency(h.currentNav)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(marketValue)}</TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 font-bold ${isProfit ? 'text-success' : 'text-destructive'}`}>
                        {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {formatCurrency(profit)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
