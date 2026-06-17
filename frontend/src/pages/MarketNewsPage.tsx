import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, RefreshCw, ExternalLink } from "lucide-react";
import { apiRequest } from '@/lib/api';

export default function MarketNewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const data = await apiRequest('/news');
      setNews(data.news || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const categoryColors: Record<string, string> = {
    'Market': 'bg-primary/10 text-primary',
    'Economy': 'bg-warning/10 text-warning',
    'FII/DII': 'bg-success/10 text-success',
    'Earnings': 'bg-accent-foreground/10 text-accent-foreground',
    'Global': 'bg-muted-foreground/10 text-muted-foreground'
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Newspaper className="h-7 w-7 text-primary" /> Market News
          </h1>
          <p className="text-muted-foreground">Latest financial news and market updates</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchNews}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : news.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No news available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((item: any, i: number) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug">{item.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-[10px] ${categoryColors[item.category] || 'bg-muted text-muted-foreground'}`}>
                        {item.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {item.date ? new Date(item.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
