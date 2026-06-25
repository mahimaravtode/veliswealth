import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, X, Loader2, TrendingUp, BarChart3, Globe, Bitcoin, Landmark } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchItem {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

interface SymbolSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (symbol: string, name: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'stock', label: 'Stocks', icon: TrendingUp },
  { id: 'fund', label: 'Funds', icon: Landmark },
  { id: 'future', label: 'Futures', icon: BarChart3 },
  { id: 'forex', label: 'Forex', icon: Globe },
  { id: 'crypto', label: 'Crypto', icon: Bitcoin },
  { id: 'index', label: 'Indices', icon: BarChart3 },
  { id: 'bond', label: 'Bonds', icon: Landmark },
];

const TYPE_MAP: Record<string, string> = {
  Equity: 'stock',
  'Common Stock': 'stock',
  EQUITY: 'stock',
  ETF: 'fund',
  Fund: 'fund',
  FUND: 'fund',
  MutualFund: 'fund',
  Index: 'index',
  INDEX: 'index',
  Currency: 'forex',
  CURRENCY: 'forex',
  'Currency Cross': 'forex',
  Cryptocurrency: 'crypto',
  Future: 'future',
  FUTURE: 'future',
  Bond: 'bond',
  BOND: 'bond',
  Warrant: 'other',
  dr: 'stock',
  ADR: 'stock',
};

export default function SymbolSearchDialog({ open, onOpenChange, onSelect }: SymbolSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActiveCategory('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest(`/twelve/search?q=${encodeURIComponent(q)}`);
      setResults(data || []);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    setLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => doSearch(value), 300);
  };

  const filtered = activeCategory === 'all'
    ? results
    : results.filter(r => TYPE_MAP[r.type] === activeCategory || r.type?.toLowerCase().includes(activeCategory));

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  const handleSelect = (item: SearchItem) => {
    onSelect(item.symbol, item.name);
    onOpenChange(false);
  };

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const item = listRef.current.children[selectedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const getExchangeBadge = (exchange: string) => {
    const colors: Record<string, string> = {
      NSE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      BSE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      NYQ: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      NAS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      CRYPTO: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      forex: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    };
    const ex = exchange?.toUpperCase() || '';
    const cls = colors[ex] || 'bg-muted text-muted-foreground';
    return (
      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', cls)}>
        {exchange}
      </span>
    );
  };

  const getTypeIcon = (item: SearchItem) => {
    const t = TYPE_MAP[item.type] || 'other';
    const iconClass = 'h-4 w-4';
    const colorMap: Record<string, string> = {
      stock: 'text-blue-500',
      fund: 'text-purple-500',
      index: 'text-green-500',
      forex: 'text-cyan-500',
      crypto: 'text-orange-500',
      future: 'text-yellow-500',
      bond: 'text-teal-500',
      other: 'text-muted-foreground',
    };
    if (t === 'crypto') return <Bitcoin className={cn(iconClass, colorMap[t])} />;
    if (t === 'index') return <BarChart3 className={cn(iconClass, colorMap[t])} />;
    if (t === 'forex') return <Globe className={cn(iconClass, colorMap[t])} />;
    return <TrendingUp className={cn(iconClass, colorMap[t])} />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search symbol..."
            className="flex-1 bg-transparent border-none outline-none text-base px-3 placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = cat.id === 'all'
              ? results.length
              : results.filter(r => TYPE_MAP[r.type] === cat.id || r.type?.toLowerCase().includes(cat.id)).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
                {count > 0 && (
                  <span className={cn(
                    'ml-0.5 text-[9px] px-1 py-0 rounded-full',
                    activeCategory === cat.id ? 'bg-primary-foreground/20' : 'bg-muted-foreground/10'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto">
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Searching...
            </div>
          )}

          {!loading && query.length >= 2 && filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Type at least 2 characters to search
            </div>
          )}

          {filtered.map((item, i) => (
            <button
              key={`${item.symbol}-${item.exchange}-${i}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-border/30 last:border-0',
                selectedIndex === i ? 'bg-accent' : 'hover:bg-accent/50'
              )}
            >
              <div className="shrink-0">{getTypeIcon(item)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{item.symbol}</span>
                  <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getExchangeBadge(item.exchange)}
                <span className="text-[9px] text-muted-foreground uppercase">{item.type}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/30 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Enter</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Esc</kbd> Close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
