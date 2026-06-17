import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, ArrowUpDown, BarChart3, RefreshCw, Loader2, Clock, ChevronDown, ChevronUp
} from "lucide-react";
import { apiRequest } from '@/lib/api';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

const CATEGORIES = ['All', 'Equity', 'Debt', 'Hybrid', 'Index', 'ELSS', 'Solution Oriented'];

export default function Products() {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('returns');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedFund, setSelectedFund] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchSchemes = async () => {
    try {
      const data = await apiRequest('/market/schemes');
      setSchemes(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchemes(); }, []);

  const filteredSchemes = useMemo(() => {
    let result = [...schemes];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.schemeName?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.schemeCode?.toLowerCase().includes(q)
      );
    }
    if (category !== 'All') {
      result = result.filter(s => s.category?.toLowerCase().includes(category.toLowerCase()));
    }
    result.sort((a, b) => {
      let valA = 0, valB = 0;
      if (sortBy === 'returns') { valA = a.threeYearReturns || 0; valB = b.threeYearReturns || 0; }
      else if (sortBy === 'nav') { valA = a.currentNav || 0; valB = b.currentNav || 0; }
      else if (sortBy === 'name') { return sortDir === 'asc' ? a.schemeName?.localeCompare(b.schemeName) : b.schemeName?.localeCompare(a.schemeName); }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
    return result;
  }, [schemes, search, category, sortBy, sortDir]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: schemes.length };
    schemes.forEach(s => {
      const cat = s.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [schemes]);

  const topFunds = useMemo(() => {
    return [...schemes].sort((a, b) => (b.threeYearReturns || 0) - (a.threeYearReturns || 0)).slice(0, 5);
  }, [schemes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Explorer</h1>
          <p className="text-muted-foreground">Browse, compare, and analyze mutual fund schemes.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> {lastUpdated.toLocaleTimeString()}
          </span>
          <Button variant="outline" size="sm" onClick={fetchSchemes}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Schemes</p>
            <p className="text-2xl font-bold">{schemes.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Avg 3Y Returns</p>
            <p className="text-2xl font-bold text-success">
              {schemes.length > 0 ? (schemes.reduce((s, sc) => s + (sc.threeYearReturns || 0), 0) / schemes.length).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="text-2xl font-bold">{Object.keys(categoryCounts).length - 1}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Top Performer</p>
            <p className="text-lg font-bold truncate">{topFunds[0]?.schemeName || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by scheme name, AMC, or category..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="returns">3Y Returns</SelectItem>
            <SelectItem value="nav">Current NAV</SelectItem>
            <SelectItem value="name">Scheme Name</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
          {sortDir === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <Button
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
            className="whitespace-nowrap"
            onClick={() => setCategory(cat)}
          >
            {cat}
            {categoryCounts[cat] !== undefined && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{categoryCounts[cat]}</Badge>
            )}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredSchemes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No schemes found matching your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSchemes.map((scheme, i) => (
            <SchemeCard key={scheme.schemeCode || i} scheme={scheme} onClick={() => setSelectedFund(scheme)} />
          ))}
        </div>
      )}

      <Dialog open={!!selectedFund} onOpenChange={() => setSelectedFund(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg pr-8">{selectedFund?.schemeName}</DialogTitle>
          </DialogHeader>
          {selectedFund && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedFund.category}</Badge>
                <Badge variant="outline">{selectedFund.schemeCode}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted dark:bg-card rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground">Current NAV</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedFund.currentNav)}</p>
                </div>
                <div className="bg-success/10 dark:bg-success/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-success">3Y Returns</p>
                  <p className="text-2xl font-bold text-success">+{selectedFund.threeYearReturns}%</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted dark:bg-card rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">1Y Return</p>
                  <p className="text-sm font-bold">{selectedFund.oneYearReturns || 'N/A'}%</p>
                </div>
                <div className="bg-muted dark:bg-card rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">5Y Return</p>
                  <p className="text-sm font-bold">{selectedFund.fiveYearReturns || 'N/A'}%</p>
                </div>
                <div className="bg-muted dark:bg-card rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Fund House</p>
                  <p className="text-sm font-bold">{selectedFund.fundHouse || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SchemeCard({ scheme, onClick }: { scheme: any; onClick: () => void }) {
  const returns = scheme.threeYearReturns || 0;
  const isPositive = returns >= 0;

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold truncate">{scheme.schemeName}</h3>
            </div>
            <div className="flex items-center gap-2 ml-7">
              <Badge variant="secondary" className="text-[10px]">{scheme.category}</Badge>
              <span className="text-[10px] text-muted-foreground">{scheme.schemeCode}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">NAV</p>
            <p className="text-sm font-bold">{formatCurrency(scheme.currentNav)}</p>
          </div>
          <div className="text-right shrink-0 w-20">
            <p className="text-xs text-muted-foreground">3Y Returns</p>
            <p className={`text-sm font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? '+' : ''}{returns}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
