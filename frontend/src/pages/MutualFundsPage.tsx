import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, RefreshCw, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { apiRequest } from '@/lib/api';

export default function MutualFundsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchMFs = async () => {
    try {
      const data = await apiRequest('/mutual-fund');
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMFs(); }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const data = await apiRequest(`/mutual-fund/search?q=${q}`);
      setSearchResults(data.results || []);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PiggyBank className="h-7 w-7 text-primary" /> Mutual Funds
          </h1>
          <p className="text-muted-foreground">Top mutual funds across categories</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMFs}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search mutual funds..." className="pl-9" value={searchQuery} onChange={e => handleSearch(e.target.value)} />
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((mf: any) => (
              <div key={mf.schemeCode || mf.scheme_name} className="px-4 py-2 hover:bg-accent border-b last:border-0">
                <p className="font-semibold text-sm">{mf.scheme_name || mf.schemeName}</p>
                <p className="text-xs text-muted-foreground">{mf.fund_house || mf.fundHouse} | NAV: ₹{mf.nav || mf.latest_nav}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="Large Cap" className="w-full">
          <TabsList className="bg-card border border-border p-1 rounded-xl mb-4 w-full justify-start overflow-x-auto flex">
            {categories.map((cat: any) => (
              <TabsTrigger key={cat.category} value={cat.category} className="rounded-lg font-bold text-xs whitespace-nowrap">
                {cat.category}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((cat: any) => (
            <TabsContent key={cat.category} value={cat.category}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{cat.category} Funds</CardTitle>
                </CardHeader>
                <CardContent>
                  {cat.funds.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                  ) : (
                    <div className="space-y-2">
                      {cat.funds.map((fund: any) => {
                        const isPos = (fund.changePercent || 0) >= 0;
                        return (
                          <div key={fund.schemeCode} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent border-b last:border-0">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm truncate">{fund.schemeName}</p>
                              <p className="text-xs text-muted-foreground">{fund.fundHouse}</p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold">₹{fund.nav?.toFixed(2) || 'N/A'}</p>
                              <p className={`text-xs font-semibold ${isPos ? 'text-success' : 'text-destructive'}`}>
                                {isPos ? '+' : ''}{fund.changePercent?.toFixed(2) || 0}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
