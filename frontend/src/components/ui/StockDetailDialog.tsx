import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiRequest } from '@/lib/api';
import CandlestickChart from './CandlestickChart';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

const formatNumber = (val: number) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(val);

interface StockDetailProps {
  symbol: string | null;
  open: boolean;
  onClose: () => void;
}

interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  currency: string;
}

export default function StockDetailDialog({ symbol, open, onClose }: StockDetailProps) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open || !symbol) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setQuote(null);

    apiRequest(`/yahoo/quote/${encodeURIComponent(symbol)}`)
      .then((data) => {
        if (!controller.signal.aborted) {
          setQuote(data || null);
        }
      })
      .catch(() => { /* ignore */ })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [symbol, open]);

  if (!open || !symbol) return null;

  const isPositive = quote ? quote.changePercent >= 0 : true;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : quote ? (
              <>
                <span>{quote.name}</span>
                <Badge variant="outline" className="text-[10px]">{quote.symbol}</Badge>
              </>
            ) : (
              <span>{symbol}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {quote && (
              <div className="flex items-end gap-3">
                <p className="text-3xl font-black">{formatCurrency(quote.price)}</p>
                <span className={`text-sm font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                </span>
              </div>
            )}

            {quote && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-lg p-2.5 text-center border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Open</p>
                  <p className="text-xs font-bold">{formatCurrency(quote.open)}</p>
                </div>
                <div className="bg-success/5 rounded-lg p-2.5 text-center border border-success/20">
                  <p className="text-[10px] text-success uppercase tracking-wider font-semibold">High</p>
                  <p className="text-xs font-bold text-success">{formatCurrency(quote.high)}</p>
                </div>
                <div className="bg-destructive/5 rounded-lg p-2.5 text-center border border-destructive/20">
                  <p className="text-[10px] text-destructive uppercase tracking-wider font-semibold">Low</p>
                  <p className="text-xs font-bold text-destructive">{formatCurrency(quote.low)}</p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/50 bg-card p-1">
              <CandlestickChart symbol={symbol} height={320} />
            </div>

            {quote && (
              <div className="grid grid-cols-2 gap-2">
                <Card className="border border-border/50 bg-muted/30 shadow-none">
                  <CardContent className="p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Volume</p>
                    <p className="text-sm font-bold">{formatNumber(quote.volume)}</p>
                  </CardContent>
                </Card>
                <Card className="border border-border/50 bg-muted/30 shadow-none">
                  <CardContent className="p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Currency</p>
                    <p className="text-sm font-bold">{quote.currency}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

