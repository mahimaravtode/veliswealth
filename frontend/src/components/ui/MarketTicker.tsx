import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMarketStream } from '@/hooks/useMarketStream';
import { TrendingUp, TrendingDown } from 'lucide-react';

function TickerPrice({ value }: { value: number }) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlash(value > prevRef.current ? 'up' : 'down');
      prevRef.current = value;
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  const cls = flash === 'up' ? 'text-success' : flash === 'down' ? 'text-destructive' : '';
  return (
    <span className={`text-xs font-bold transition-colors duration-300 ${cls}`}>
      ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export default function MarketTicker() {
  const [stocks, setStocks] = useState<any[]>([]);

  const handleData = useCallback((data: any) => {
    if (data) {
      const gainers = data.gainers || [];
      const losers = data.losers || [];
      setStocks([...gainers, ...losers]);
    }
  }, []);

  useMarketStream(handleData);

  if (stocks.length === 0) return null;

  return (
    <div className="w-full overflow-hidden py-3 ">
      <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/30 px-4 py-2.5 overflow-hidden">
        <motion.div
          className="flex gap-3"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 45, ease: "linear", repeat: Infinity }}
        >
          {[...stocks, ...stocks].map((stock, i) => {
            const change = stock.change || 0;
            const percent = stock.changePercent || 0;
            const isPositive = change >= 0;
            return (
              <div 
                key={i} 
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-muted/30 border border-border/20 min-w-fit hover:bg-muted/50 transition-colors duration-200"
              >
                <span className="font-black text-xs text-foreground">
                  {stock.symbol?.split('.')[0] || 'N/A'}
                </span>
                <TickerPrice value={stock.lastPrice || 0} />
                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  <span>
                    {isPositive ? '+' : ''}{change} ({percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
