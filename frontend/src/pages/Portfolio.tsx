import { useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { usePortfolioStore } from '@/store/usePortfolioStore';

export default function Portfolio() {
  const { holdings, loading, fetchPortfolio, syncHoldings } = usePortfolioStore();

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleSyncMockData = () => {
    const mockHoldings = [
      { schemeCode: "101", schemeName: "SBI Nifty 50 Index", units: 100, avgNav: 150, currentNav: 184, category: "Equity" },
      { schemeCode: "102", schemeName: "HDFC Balanced Advantage", units: 500, avgNav: 380, currentNav: 420, category: "Hybrid" },
    ];
    syncHoldings(mockHoldings);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolio Holdings</h1>
          <p className="text-muted-foreground">Manage and track your individual investments.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSyncMockData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sync Data
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Asset
          </Button>
        </div>
      </div>

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
            {holdings.length === 0 ? (
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
