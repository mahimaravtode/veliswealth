import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Briefcase, RefreshCw, ArrowUpRight, ArrowDownRight, Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { apiRequest } from '@/lib/api';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export default function PortfolioTrackerPage() {
  const [portfolio, setPortfolio] = useState<any>({ holdings: [], summary: { totalInvested: 0, currentValue: 0, totalPnl: 0, totalPnlPercent: 0 } });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ symbol: '', name: '', quantity: '', buyPrice: '' });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPortfolio = useCallback(async () => {
    try {
      const data = await apiRequest('/portfolio-tracker/live');
      setPortfolio(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    if (value.length < 2) { setSearchResults([]); return; }
    try {
      const data = await apiRequest(`/market/all-stocks?search=${value}&limit=10`);
      setSearchResults(data.stocks || []);
    } catch (err) { console.error(err); }
  };

  const handleSelectStock = (stock: any) => {
    setFormData({ ...formData, symbol: stock.symbol, name: stock.name });
    setSearchQuery(stock.symbol);
    setSearchResults([]);
  };

  const handleAdd = async () => {
    try {
      await apiRequest('/portfolio-tracker/add', {
        method: 'POST',
        body: JSON.stringify({
          symbol: formData.symbol,
          name: formData.name,
          quantity: parseInt(formData.quantity),
          buyPrice: parseFloat(formData.buyPrice)
        })
      });
      setShowAdd(false);
      setFormData({ symbol: '', name: '', quantity: '', buyPrice: '' });
      fetchPortfolio();
    } catch (err) { console.error(err); }
  };

  const handleRemove = async (symbol: string) => {
    try {
      await apiRequest(`/portfolio-tracker/remove/${symbol}`, { method: 'DELETE' });
      fetchPortfolio();
    } catch (err) { console.error(err); }
  };

  const s = portfolio.summary;
  const isPnlPositive = s.totalPnl >= 0;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-primary" /> Portfolio Tracker
          </h1>
          <p className="text-muted-foreground">Track your stock holdings with live P&L</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPortfolio}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4 mr-1" /> Add Holding
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Invested</p>
            <p className="text-lg font-bold">{formatCurrency(s.totalInvested)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="text-lg font-bold">{formatCurrency(s.currentValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total P&L</p>
            <p className={`text-lg font-bold ${isPnlPositive ? 'text-success' : 'text-destructive'}`}>
              {isPnlPositive ? '+' : ''}{formatCurrency(s.totalPnl)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">P&L %</p>
            <p className={`text-lg font-bold ${isPnlPositive ? 'text-success' : 'text-destructive'}`}>
              {isPnlPositive ? '+' : ''}{s.totalPnlPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {showAdd && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add Holding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input placeholder="Search stock symbol..." value={searchQuery} onChange={e => handleSearch(e.target.value)} />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {searchResults.map((s: any) => (
                    <div key={s.symbol} className="px-3 py-2 hover:bg-accent cursor-pointer text-sm" onClick={() => handleSelectStock(s)}>
                      <span className="font-semibold">{s.symbol}</span> <span className="text-muted-foreground">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Quantity" type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
              <Input placeholder="Buy Price (₹)" type="number" value={formData.buyPrice} onChange={e => setFormData({ ...formData, buyPrice: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!formData.symbol || !formData.quantity || !formData.buyPrice}>Add</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : portfolio.holdings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No holdings yet. Add your first stock!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Avg Price</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">CMP</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Invested</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Current</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">P&L</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">P&L %</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((h: any) => {
                const isPos = h.pnl >= 0;
                return (
                  <tr key={h.symbol} className="border-b last:border-0 hover:bg-accent">
                    <td className="py-2.5 px-3"><p className="font-semibold">{h.symbol}</p><p className="text-xs text-muted-foreground">{h.name}</p></td>
                    <td className="text-right py-2.5 px-3">{h.quantity}</td>
                    <td className="text-right py-2.5 px-3">{formatCurrency(h.avgBuyPrice)}</td>
                    <td className="text-right py-2.5 px-3 font-bold">{formatCurrency(h.currentPrice)}</td>
                    <td className="text-right py-2.5 px-3">{formatCurrency(h.investedAmount)}</td>
                    <td className="text-right py-2.5 px-3 font-bold">{formatCurrency(h.currentValue)}</td>
                    <td className={`text-right py-2.5 px-3 font-semibold ${isPos ? 'text-success' : 'text-destructive'}`}>
                      {isPos ? '+' : ''}{formatCurrency(h.pnl)}
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <Badge variant="outline" className={`text-xs ${isPos ? 'border-success/30 text-success bg-success/10' : 'border-destructive/30 text-destructive bg-destructive/10'}`}>
                        {isPos ? '+' : ''}{h.pnlPercent.toFixed(2)}%
                      </Badge>
                    </td>
                    <td className="text-right py-2.5 px-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(h.symbol)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
