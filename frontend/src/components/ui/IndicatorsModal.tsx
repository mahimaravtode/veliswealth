import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Script {
  name: string;
  author: string;
  boosts: string;
  type: 'indicator' | 'strategy';
}

const MOCK_SCRIPTS: Script[] = [
  { name: 'Predictive Breakout Channels | GainzAlgo', author: 'GainzAlgo', boosts: '1.5 K', type: 'strategy' },
  { name: 'Signal Forge [LuxAlgo]', author: 'LuxAlgo', boosts: '5.9 K', type: 'indicator' },
  { name: 'Machine Learning Random Forest Strateg...', author: 'GainzAlgo', boosts: '2.1 K', type: 'strategy' },
  { name: 'Nadaraya-Watson Regression Liquidity S...', author: 'AlgoAlpha', boosts: '3.2 K', type: 'indicator' },
];

export default function IndicatorsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [filter, setFilter] = useState<'All' | 'Indicators' | 'Strategies'>('All');
  const [search, setSearch] = useState('');

  const filteredScripts = MOCK_SCRIPTS.filter(s => {
    const matchesFilter = filter === 'All' || (filter === 'Indicators' && s.type === 'indicator') || (filter === 'Strategies' && s.type === 'strategy');
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Indicators, metrics, and strategies</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search" 
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-4">
            {(['All', 'Indicators', 'Strategies'] as const).map(f => (
              <button 
                key={f}
                className={cn("px-4 py-1 rounded-full text-sm", filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50")}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r p-4 space-y-6 text-sm text-muted-foreground">
             <div>
                <p className="font-semibold text-xs text-foreground mb-2">PERSONAL</p>
                <div className="space-y-1">
                    <p className="hover:text-foreground cursor-pointer">My scripts</p>
                    <p className="hover:text-foreground cursor-pointer">Purchased</p>
                </div>
             </div>
             <div>
                <p className="font-semibold text-xs text-foreground mb-2">BUILT-IN</p>
                <div className="space-y-1">
                    <p className="hover:text-foreground cursor-pointer">Technicals</p>
                    <p className="hover:text-foreground cursor-pointer">Fundamentals</p>
                </div>
             </div>
             <div>
                <p className="font-semibold text-xs text-foreground mb-2">COMMUNITY</p>
                <div className="space-y-1">
                    <p className="hover:text-foreground cursor-pointer">Editors' picks</p>
                    <p className="hover:text-foreground cursor-pointer">Top</p>
                    <p className="hover:text-foreground cursor-pointer bg-accent/50 text-foreground px-2 -ml-2 rounded">Trending</p>
                    <p className="hover:text-foreground cursor-pointer">Store</p>
                </div>
             </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
             <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-muted-foreground text-xs">
                        <th className="pb-2 font-normal">SCRIPT NAME</th>
                        <th className="pb-2 font-normal">AUTHOR</th>
                        <th className="pb-2 font-normal">BOOSTS</th>
                    </tr>
                </thead>
                <tbody className="text-foreground">
                    {filteredScripts.map((s, i) => (
                        <tr key={i} className="hover:bg-accent/50 cursor-pointer">
                            <td className="py-2">{s.name}</td>
                            <td className="py-2 text-primary">{s.author}</td>
                            <td className="py-2 text-muted-foreground">{s.boosts}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
