import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from '@/lib/api';
import { Heart } from 'lucide-react';

export default function FinancialHealthCard() {
  const [health, setHealth] = useState({ score: 0, insights: [] });

  const fetchHealth = useCallback(async () => {
    try {
      const data = await apiRequest('/health/score');
      setHealth(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-primary/5 to-transparent rounded-bl-full" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="p-2.5 bg-primary/10 rounded-2xl">
            <Heart className="h-4 w-4 text-primary" />
          </div>
          Financial Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 relative">
        <div className="flex items-end justify-between">
          <div>
            <span className={`text-4xl font-black ${getScoreColor(health.score)}`}>
              {health.score}
            </span>
            <span className="text-lg text-muted-foreground font-medium">/100</span>
          </div>
          <span className={`text-sm font-bold uppercase tracking-wide ${getScoreColor(health.score)}`}>
            {getScoreLabel(health.score)}
          </span>
        </div>
        <div className="relative">
          <Progress value={health.score} className="h-3 rounded-full" />
          <div 
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background: `linear-gradient(90deg, 
                hsl(var(--destructive)) 0%, 
                hsl(var(--warning)) 40%, 
                hsl(var(--success)) 100%)`,
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
              padding: '1px',
            }}
          />
        </div>
        {health.insights.length > 0 && (
          <ul className="space-y-2.5">
            {health.insights.map((insight: string, i: number) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
