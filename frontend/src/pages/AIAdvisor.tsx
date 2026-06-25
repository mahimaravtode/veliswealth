import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, RefreshCw, Loader2, AlertTriangle, CheckCircle2,
  Target, ArrowRight, Lightbulb, Calendar, PieChart as PieChartIcon,
  Receipt, IndianRupee
} from "lucide-react";
import { apiRequest } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const ALLOCATION_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#94a3b8'];
const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-primary/10 text-primary',
};

interface Analysis {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: {
    title: string;
    description: string;
    priority: string;
    category: string;
  }[];
  allocation: {
    suggested: {
      equity: number;
      debt: number;
      gold: number;
      cash: number;
    };
  };
}

interface GoalPrediction {
  predictedDate: string;
  monthsRemaining: number;
  onTrack: boolean;
  confidence: string;
  currentPace: string;
  recommendations: {
    action: string;
    impact: string;
    priority: string;
  }[];
  scenarios: {
    current: { months: number; date: string };
    increase20: { months: number; date: string };
    increase50: { months: number; date: string };
  };
}

interface TaxOptimization {
  oldRegime: {
    totalDeductions: number;
    estimatedTax: number;
    savings: number;
  };
  newRegime: {
    estimatedTax: number;
    standardDeduction: number;
  };
  recommendedRegime: string;
  recommendations: {
    section: string;
    action: string;
    currentInvestment: number;
    maxAllowed: number;
    potentialSaving: number;
    priority: string;
    description: string;
  }[];
  elssSuggestions: {
    name: string;
    category: string;
    returns3y: string;
    risk: string;
  }[];
  monthlyPlan: {
    ppf: number;
    elss: number;
    nps: number;
    insurance: number;
    total: number;
  };
}

interface RebalanceData {
  currentAllocation: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
  targetAllocation: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
  needsRebalancing: boolean;
  rebalancingActions: {
    action: string;
    fund: string;
    currentValue: number;
    targetValue: number;
    difference: number;
    reason: string;
  }[];
  riskAssessment: string;
  suggestions: {
    title: string;
    description: string;
    impact: string;
    priority: string;
  }[];
}

export default function AIAdvisor() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [taxData, setTaxData] = useState<TaxOptimization | null>(null);
  const [rebalanceData, setRebalanceData] = useState<RebalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/ai/portfolio-analysis');
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI analysis');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxOptimization = async () => {
    try {
      const data = await apiRequest('/ai/tax-optimize');
      setTaxData(data);
    } catch (err: any) {
      console.error('Tax optimization error:', err);
    }
  };

  const fetchRebalanceData = async () => {
    try {
      const data = await apiRequest('/ai/rebalance');
      setRebalanceData(data);
    } catch (err: any) {
      console.error('Rebalance error:', err);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  useEffect(() => {
    if (activeTab === 'tax') {
      fetchTaxOptimization();
    } else if (activeTab === 'rebalance') {
      fetchRebalanceData();
    }
  }, [activeTab]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Financial Advisor
          </h1>
          <p className="text-muted-foreground mt-1">Personalized insights powered by AI</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Analyzing your financial profile...</p>
            <p className="text-xs text-muted-foreground">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Financial Advisor
          </h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-warning mb-4" />
            <p className="text-lg font-medium mb-2">Unable to load analysis</p>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{error}</p>
            <Button onClick={fetchAnalysis} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) return null;

  const allocationData = analysis.allocation?.suggested
    ? [
        { name: 'Equity', value: analysis.allocation.suggested.equity },
        { name: 'Debt', value: analysis.allocation.suggested.debt },
        { name: 'Gold', value: analysis.allocation.suggested.gold },
        { name: 'Cash', value: analysis.allocation.suggested.cash },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Financial Advisor
          </h1>
          <p className="text-muted-foreground mt-1">Personalized insights powered by AI</p>
        </div>
        <Button onClick={fetchAnalysis} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goal Predictor
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Tax Optimizer
          </TabsTrigger>
          <TabsTrigger value="rebalance" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Rebalance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          {/* Score & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className={`text-5xl font-black ${getScoreColor(analysis.score)}`}>
                  {analysis.score}
                </div>
                <p className="text-sm text-muted-foreground mt-1">out of 100</p>
                <Badge className="mt-2" variant={analysis.score >= 60 ? 'default' : 'destructive'}>
                  {getScoreLabel(analysis.score)}
                </Badge>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardContent className="py-6">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
              </CardContent>
            </Card>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                  {(!analysis.strengths || analysis.strengths.length === 0) && (
                    <li className="text-sm text-muted-foreground">No strengths identified yet</li>
                  )}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.weaknesses?.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                  {(!analysis.weaknesses || analysis.weaknesses.length === 0) && (
                    <li className="text-sm text-muted-foreground">No areas to improve identified</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Recommendations
              </CardTitle>
              <CardDescription>AI-generated action items for your financial goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.recommendations?.map((rec, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        {rec.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{rec.category}</Badge>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[rec.priority] || ''}`}>
                          {rec.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                ))}
                {(!analysis.recommendations || analysis.recommendations.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recommendations available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Allocation */}
          {allocationData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Suggested Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-50">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {allocationData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, '']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {allocationData.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ALLOCATION_COLORS[i] }} />
                        <span className="text-sm flex-1">{item.name}</span>
                        <span className="text-sm font-semibold">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Goal Completion Predictor
              </CardTitle>
              <CardDescription>AI predicts when you'll achieve your financial goals</CardDescription>
            </CardHeader>
            <CardContent>
              <GoalPredictor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <TaxOptimizer data={taxData} loading={!taxData} />
        </TabsContent>

        <TabsContent value="rebalance" className="space-y-6">
          <RebalanceCard data={rebalanceData} loading={!rebalanceData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GoalPredictor() {
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [prediction, setPrediction] = useState<GoalPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await apiRequest('/goals');
        setGoals(data);
        if (data.length > 0) setSelectedGoal(data[0]._id);
      } catch (err) {
        console.error('Failed to fetch goals:', err);
      }
    };
    fetchGoals();
  }, []);

  const fetchPrediction = async () => {
    if (!selectedGoal) return;
    setLoading(true);
    try {
      const data = await apiRequest('/ai/predict-goal', {
        method: 'POST',
        body: JSON.stringify({ goalId: selectedGoal }),
        headers: { 'Content-Type': 'application/json' },
      });
      setPrediction(data);
    } catch (err) {
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select
          value={selectedGoal}
          onChange={(e) => setSelectedGoal(e.target.value)}
          className="flex-1 p-2 border rounded-md bg-background"
        >
          {goals.map((goal) => (
            <option key={goal._id} value={goal._id}>
              {goal.title} - {formatCurrency(goal.targetAmount)}
            </option>
          ))}
        </select>
        <Button onClick={fetchPrediction} disabled={loading || !selectedGoal}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
          Predict
        </Button>
      </div>

      {prediction && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Predicted Date</p>
                <p className="text-2xl font-bold">{prediction.predictedDate || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Months Remaining</p>
                <p className="text-2xl font-bold">{prediction.monthsRemaining || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={prediction.onTrack ? 'default' : 'destructive'}>
                  {prediction.onTrack ? 'On Track' : 'Behind Schedule'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {prediction.recommendations?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {prediction.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{rec.action} - {rec.impact}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function TaxOptimizer({ data, loading }: { data: TaxOptimization | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Old Regime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Deductions</span>
                <span className="font-medium">{formatCurrency(data.oldRegime.totalDeductions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated Tax</span>
                <span className="font-medium">{formatCurrency(data.oldRegime.estimatedTax)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New Regime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Standard Deduction</span>
                <span className="font-medium">{formatCurrency(data.newRegime.standardDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated Tax</span>
                <span className="font-medium">{formatCurrency(data.newRegime.estimatedTax)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="font-medium">Recommended: {data.recommendedRegime.toUpperCase()} Regime</span>
          </div>
        </CardContent>
      </Card>

      {data.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Tax Saving Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{rec.section}</h4>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Current: {formatCurrency(rec.currentInvestment)}</span>
                    <span>Max: {formatCurrency(rec.maxAllowed)}</span>
                    <span className="text-success">Save: {formatCurrency(rec.potentialSaving)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.monthlyPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              Monthly Investment Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">PPF</p>
                <p className="font-bold">{formatCurrency(data.monthlyPlan.ppf)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">ELSS</p>
                <p className="font-bold">{formatCurrency(data.monthlyPlan.elss)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">NPS</p>
                <p className="font-bold">{formatCurrency(data.monthlyPlan.nps)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Insurance</p>
                <p className="font-bold">{formatCurrency(data.monthlyPlan.insurance)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="font-bold text-primary">{formatCurrency(data.monthlyPlan.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RebalanceCard({ data, loading }: { data: RebalanceData | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const currentData = [
    { name: 'Equity', value: data.currentAllocation.equity },
    { name: 'Debt', value: data.currentAllocation.debt },
    { name: 'Gold', value: data.currentAllocation.gold },
    { name: 'Cash', value: data.currentAllocation.cash },
  ];

  const targetData = [
    { name: 'Equity', value: data.targetAllocation.equity },
    { name: 'Debt', value: data.targetAllocation.debt },
    { name: 'Gold', value: data.targetAllocation.gold },
    { name: 'Cash', value: data.targetAllocation.cash },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-37.5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {currentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ALLOCATION_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Target Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-37.5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={targetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {targetData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ALLOCATION_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            {data.needsRebalancing ? (
              <>
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="font-medium">Portfolio needs rebalancing</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-medium">Portfolio is well balanced</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {data.rebalancingActions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Rebalancing Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.rebalancingActions.map((action, i) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium">{action.fund}</p>
                    <p className="text-sm text-muted-foreground">{action.reason}</p>
                  </div>
                  <Badge variant={action.action === 'buy' ? 'default' : 'destructive'}>
                    {action.action.toUpperCase()} {formatCurrency(Math.abs(action.difference))}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
