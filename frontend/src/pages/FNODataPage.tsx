import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandlestickChart, RefreshCw } from "lucide-react";
import { apiRequest } from '@/lib/api';

export default function FNODataPage() {
  const [optionChain, setOptionChain] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('NIFTY');

  const fetchOptionChain = async (sym: string) => {
    setSymbol(sym);
    setLoading(true);
    try {
      const data = await apiRequest(`/fno/option-chain/${sym}`);
      setOptionChain(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOptionChain('NIFTY'); }, []);

  const quickSymbols = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'TCS', 'HDFCBANK'];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CandlestickChart className="h-7 w-7 text-primary" /> F&O Data
          </h1>
          <p className="text-muted-foreground">Futures & Options chain data</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchOptionChain(symbol)}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {quickSymbols.map(s => (
          <Button
            key={s}
            variant={symbol === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => fetchOptionChain(s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : !optionChain ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CandlestickChart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Select a symbol to view option chain</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="calls" className="w-full">
          <TabsList className="bg-card border border-border p-1 rounded-xl mb-4">
            <TabsTrigger value="calls" className="rounded-lg font-bold text-xs">Calls (CE)</TabsTrigger>
            <TabsTrigger value="puts" className="rounded-lg font-bold text-xs">Puts (PE)</TabsTrigger>
          </TabsList>

          <TabsContent value="calls">
            <OptionChainTable
              data={optionChain.records?.filter((r: any) => r.CE) || []}
              side="CE"
            />
          </TabsContent>
          <TabsContent value="puts">
            <OptionChainTable
              data={optionChain.records?.filter((r: any) => r.PE) || []}
              side="PE"
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function OptionChainTable({ data, side }: { data: any[]; side: 'CE' | 'PE' }) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No option chain data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">OI</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Chg OI</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Volume</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">IV</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">LTP</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Chg</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Bid</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Ask</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Strike</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => {
            const opt = row[side];
            if (!opt) return null;
            return (
              <tr key={i} className="border-b last:border-0 hover:bg-accent">
                <td className="text-right py-2 px-3 text-muted-foreground">{(opt.openInterest || 0).toLocaleString()}</td>
                <td className="text-right py-2 px-3">{(opt.changeinOpenInterest || 0).toLocaleString()}</td>
                <td className="text-right py-2 px-3 text-muted-foreground">{(opt.totalTradedVolume || 0).toLocaleString()}</td>
                <td className="text-right py-2 px-3">{opt.impliedVolatility?.toFixed(1) || '-'}</td>
                <td className="text-right py-2 px-3 font-bold">{opt.lastPrice?.toFixed(2) || '-'}</td>
                <td className={`text-right py-2 px-3 font-semibold ${(opt.change || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {(opt.change || 0) >= 0 ? '+' : ''}{opt.change?.toFixed(2) || 0}
                </td>
                <td className="text-right py-2 px-3 text-muted-foreground">{opt.askPrice?.toFixed(2) || '-'}</td>
                <td className="text-right py-2 px-3 text-muted-foreground">{opt.bidPrice?.toFixed(2) || '-'}</td>
                <td className="text-right py-2 px-3 font-semibold">{row.strikePrice}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
