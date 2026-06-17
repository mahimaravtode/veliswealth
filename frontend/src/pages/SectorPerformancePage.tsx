import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, RefreshCw } from "lucide-react";
import { apiRequest } from '@/lib/api';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

export default function SectorPerformancePage() {
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetchSectors = async () => {
    try {
      const data = await apiRequest('/sector');
      setSectors(data.sectors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSectors(); }, []);

  const sortedSectors = [...sectors].sort((a, b) => b.avgChange - a.avgChange);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="h-7 w-7 text-primary" /> Sector Performance
          </h1>
          <p className="text-muted-foreground">Sector-wise market performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSectors}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {sortedSectors.map((sector) => {
              const isPos = sector.avgChange >= 0;
              return (
                <Card
                  key={sector.name}
                  className={`cursor-pointer hover:shadow-md transition-all ${selected?.name === sector.name ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelected(selected?.name === sector.name ? null : sector)}
                >
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground font-medium truncate">{sector.name}</p>
                    <p className={`text-lg font-bold mt-1 ${isPos ? 'text-success' : 'text-destructive'}`}>
                      {isPos ? '+' : ''}{sector.avgChange}%
                    </p>
                    <p className="text-xs text-muted-foreground">{sector.stockCount} stocks</p>
                    <div className={`mt-1 h-1.5 rounded-full ${isPos ? 'bg-success/20' : 'bg-destructive/20'}`}>
                      <div className={`h-full rounded-full ${isPos ? 'bg-success' : 'bg-destructive'}`} style={{ width: `${Math.min(Math.abs(sector.avgChange) * 10, 100)}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selected && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {selected.name}
                  <Badge variant="outline" className={`text-xs ${selected.avgChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {selected.avgChange >= 0 ? '+' : ''}{selected.avgChange}%
                  </Badge>
                </CardTitle>
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
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.stocks || []).map((stock: any) => {
                        const isPos = (stock.changePercent || 0) >= 0;
                        return (
                          <tr key={stock.symbol} className="border-b last:border-0 hover:bg-accent">
                            <td className="py-2 px-3 font-semibold">{stock.symbol}</td>
                            <td className="text-right py-2 px-3">{formatCurrency(stock.lastPrice)}</td>
                            <td className={`text-right py-2 px-3 font-semibold ${isPos ? 'text-success' : 'text-destructive'}`}>
                              {isPos ? '+' : ''}{formatCurrency(stock.change || 0)}
                            </td>
                            <td className="text-right py-2 px-3">
                              <Badge variant="outline" className={`text-xs ${isPos ? 'border-success/30 text-success bg-success/10' : 'border-destructive/30 text-destructive bg-destructive/10'}`}>
                                {isPos ? '+' : ''}{stock.changePercent}%
                              </Badge>
                            </td>
                            <td className="text-right py-2 px-3 text-muted-foreground">{(stock.volume || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
