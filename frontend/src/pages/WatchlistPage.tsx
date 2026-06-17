import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Search, Trash2, RefreshCw, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { apiRequest } from '@/lib/api';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<any>({ stocks: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setAdding] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    try {
      const data = await apiRequest('/watchlist/live');
      setWatchlist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 5000);
    return () => clearInterval(interval);
  }, [fetchWatchlist]);

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await apiRequest(`/market/all-stocks?search=${value}&limit=10`);
      setSearchResults(data.stocks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (stock: any) => {
    setAdding(true);
    try {
      await apiRequest('/watchlist/add', {
        method: 'POST',
        body: JSON.stringify({ symbol: stock.symbol, name: stock.name, exchange: stock.exchange })
      });
      setSearchQuery('');
      setSearchResults([]);
      fetchWatchlist();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (symbol: string) => {
    try {
      await apiRequest(`/watchlist/remove/${symbol}`, { method: 'DELETE' });
      fetchWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-7 w-7 text-warning" /> My Watchlist
          </h1>
          <p className="text-muted-foreground">Track your favorite stocks with live prices</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchWatchlist}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search stocks to add..."
          className="pl-9"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
        />
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((stock: any) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between px-4 py-2 hover:bg-accent cursor-pointer"
                onClick={() => handleAdd(stock)}
              >
                <div>
                  <p className="font-semibold text-sm">{stock.symbol}</p>
                  <p className="text-xs text-muted-foreground">{stock.name}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{stock.exchange}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : watchlist.stocks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Star className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Your watchlist is empty. Search and add stocks above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.stocks.map((stock: any) => {
            const isPos = (stock.changePercent || 0) >= 0;
            return (
              <Card key={stock.symbol} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold">{stock.symbol}</p>
                      <p className="text-xs text-muted-foreground">{stock.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(stock.symbol)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-3">
                    <p className="text-xl font-bold">{stock.lastPrice ? formatCurrency(stock.lastPrice) : '-'}</p>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${isPos ? 'text-success' : 'text-destructive'}`}>
                      {isPos ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {isPos ? '+' : ''}{stock.changePercent || 0}%
                      <span className="text-xs font-normal">({isPos ? '+' : ''}{formatCurrency(stock.change || 0)})</span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Vol:</span> {(stock.volume || 0).toLocaleString()}</div>
                    <div><span className="text-muted-foreground">High:</span> {stock.highPrice ? formatCurrency(stock.highPrice) : '-'}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
