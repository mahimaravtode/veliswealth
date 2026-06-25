import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/api';
import { useMarketStream } from '@/hooks/useMarketStream';

export default function MarketTicker() {
  const [stocks, setStocks] = useState<any[]>([]);
  const prevPrices = useRef<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    try {
      const data = await apiRequest('/market/movers');
      const gainers = data?.gainers || [];
      const losers = data?.losers || [];
      const all = [...gainers, ...losers];
      
      setStocks(all);
      all.forEach(s => {
        prevPrices.current[s.symbol] = s.lastPrice;
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useMarketStream(useCallback((msg: any) => {
    if (msg.type === 'market_update') {
      fetchData();
    } else if (msg.type === 'ticker_update' && msg.data) {
      setStocks(prev => prev.map(stock => {
        const update = msg.data.find((u: any) => u.symbol === stock.symbol);
        if (update) {
          return {
            ...stock,
            lastPrice: update.price,
            change: update.change,
            changePercent: update.changePercent
          };
        }
        return stock;
      }));
    }
  }, [fetchData]));

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="w-full bg-card border-y border-border overflow-hidden py-2">
      {stocks.length > 0 && (
        <motion.div
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity }}
        >
          {[...stocks, ...stocks].map((stock, i) => (
            <TickerItem key={`${stock.symbol}-${i}`} stock={stock} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function TickerItem({ stock }: { stock: any }) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(stock.lastPrice);

  useEffect(() => {
    if (stock.lastPrice > prevPriceRef.current) {
      setFlash('up');
      const timer = setTimeout(() => setFlash(null), 1000);
      return () => clearTimeout(timer);
    } else if (stock.lastPrice < prevPriceRef.current) {
      setFlash('down');
      const timer = setTimeout(() => setFlash(null), 1000);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = stock.lastPrice;
  }, [stock.lastPrice]);

  const price = stock.lastPrice || 0;
  const change = stock.change || 0;
  const percent = stock.changePercent || 0;
  const isPositive = change >= 0;

  return (
    <motion.div 
      animate={{
        backgroundColor: flash === 'up' ? 'rgba(34, 197, 94, 0.2)' : flash === 'down' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(var(--muted), 0.5)',
      }}
      className="flex items-center gap-2 px-4 py-1.5 border border-border rounded-lg min-w-fit shadow-sm bg-muted/50 transition-colors duration-300"
    >
      <span className="font-black text-xs text-foreground">{stock.symbol?.split('.')[0] || 'N/A'}</span>
      <span className="text-xs font-medium text-muted-foreground">₹{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      <span className={`text-[10px] font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? '+' : ''}{change.toFixed(2)} ({percent.toFixed(2)}%)
      </span>
    </motion.div>
  );
}
