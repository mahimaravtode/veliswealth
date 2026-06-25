import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from '@/lib/api';
import { Activity } from 'lucide-react';

export default function FinancialHealthCard() {
  const [health, setHealth] = useState({ score: 0, insights: [] });

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      const data = await apiRequest('/health/score');
      setHealth(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Financial Health Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-end">
            <span className="text-4xl font-black">{health.score}/100</span>
            <span className="text-sm font-bold text-muted-foreground uppercase">Status: {health.score > 70 ? 'Excellent' : 'Needs Work'}</span>
        </div>
        <Progress value={health.score} className="h-3" />
        <ul className="space-y-2">
            {health.insights.map((insight: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" /> {insight}
                </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
