import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, Target, Loader2, Calendar, TrendingUp, Clock,
  Home, GraduationCap, Car, Gem, Palmtree, Heart, Laptop,
  PiggyBank, Wallet, CheckCircle2, AlertCircle, BarChart3, Coins,
  CircleDollarSign, Star, ArrowUpRight
} from "lucide-react";
import { useGoalStore } from '@/store/useGoalStore';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const CATEGORY_OPTIONS = [
  { value: 'Home', label: 'Home', icon: Home, color: '#2563eb' },
  { value: 'Education', label: 'Education', icon: GraduationCap, color: '#8b5cf6' },
  { value: 'Car', label: 'Car', icon: Car, color: '#f59e0b' },
  { value: 'Retirement', label: 'Retirement', icon: PiggyBank, color: '#10b981' },
  { value: 'Emergency Fund', label: 'Emergency Fund', icon: AlertCircle, color: '#ef4444' },
  { value: 'Vacation', label: 'Vacation', icon: Palmtree, color: '#06b6d4' },
  { value: 'Wedding', label: 'Wedding', icon: Heart, color: '#ec4899' },
  { value: 'Electronics', label: 'Electronics', icon: Laptop, color: '#f97316' },
  { value: 'Health', label: 'Health', icon: Heart, color: '#ef4444' },
  { value: 'Investment', label: 'Investment', icon: TrendingUp, color: '#10b981' },
  { value: 'Other', label: 'Other', icon: Target, color: '#6b7280' },
];

function getProjectedDate(targetAmount: number, currentAmount: number, monthlyContribution: number, targetDate?: string): Date | null {
  if (monthlyContribution <= 0) return targetDate ? new Date(targetDate) : null;
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return new Date();
  const monthsNeeded = Math.ceil(remaining / monthlyContribution);
  const projected = new Date();
  projected.setMonth(projected.getMonth() + monthsNeeded);
  return projected;
}

function getMonthsRemaining(targetDate?: string): number | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

export default function Goals() {
  const { goals, loading, fetchGoals, addGoal, deleteGoal, updateGoal } = useGoalStore();
  const [open, setOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', targetAmount: '', currentAmount: '', monthlyContribution: '',
    targetDate: '', category: 'Other', priority: 'Medium', notes: ''
  });

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.targetAmount) return;
    await addGoal({
      title: formData.title,
      targetAmount: Number(formData.targetAmount),
      currentAmount: Number(formData.currentAmount) || 0,
      monthlyContribution: Number(formData.monthlyContribution) || 0,
      targetDate: formData.targetDate,
      category: formData.category,
      priority: formData.priority,
      notes: formData.notes,
      contributions: [],
      milestones: [],
    });
    setOpen(false);
    setFormData({ title: '', targetAmount: '', currentAmount: '', monthlyContribution: '', targetDate: '', category: 'Other', priority: 'Medium', notes: '' });
  };

  const handleAddContribution = async () => {
    if (!selectedGoal || !contribAmount) return;
    const amount = Number(contribAmount);
    const newCurrent = (selectedGoal.currentAmount || 0) + amount;
    const newContributions = [...(selectedGoal.contributions || []), {
      amount, date: new Date().toISOString(), note: contribNote,
    }];
    const newStatus = newCurrent >= selectedGoal.targetAmount ? 'Achieved' : selectedGoal.status;
    await updateGoal(selectedGoal._id, {
      currentAmount: newCurrent,
      contributions: newContributions,
      status: newStatus,
    });
    setContribOpen(false);
    setContribAmount('');
    setContribNote('');
    setSelectedGoal(null);
    await fetchGoals();
  };

  const stats = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);
    const totalSaved = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);
    const activeGoals = goals.filter(g => g.status === 'Active').length;
    const achievedGoals = goals.filter(g => g.status === 'Achieved').length;
    return { totalTarget, totalSaved, activeGoals, achievedGoals };
  }, [goals]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    goals.forEach(g => { cats[g.category || 'Other'] = (cats[g.category || 'Other'] || 0) + (g.currentAmount || 0); });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [goals]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goal Tracking</h1>
          <p className="text-muted-foreground">Track your savings goals and milestones.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg"><Plus className="mr-2 h-5 w-5" /> Add Goal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Goal</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Goal Name *</Label>
                <Input placeholder="e.g. Down Payment for House" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Amount *</Label>
                  <Input type="number" placeholder="20,00,000" value={formData.targetAmount}
                    onChange={e => setFormData({ ...formData, targetAmount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Already Saved</Label>
                  <Input type="number" placeholder="5,00,000" value={formData.currentAmount}
                    onChange={e => setFormData({ ...formData, currentAmount: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Contribution</Label>
                  <Input type="number" placeholder="25,000" value={formData.monthlyContribution}
                    onChange={e => setFormData({ ...formData, monthlyContribution: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input type="date" value={formData.targetDate}
                    onChange={e => setFormData({ ...formData, targetDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any notes about this goal..." value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 && !loading && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-muted dark:bg-card rounded-2xl mb-4">
              <Target className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">Create your first savings goal and start tracking your progress.</p>
            <Button size="lg" onClick={() => setOpen(true)}><Plus className="mr-2 h-5 w-5" /> Create Your First Goal</Button>
          </CardContent>
        </Card>
      )}

      {loading && goals.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {goals.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold">{goals.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Saved</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(stats.totalSaved)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total Target</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalTarget)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Achieved</p>
                <p className="text-2xl font-bold text-warning">{stats.achievedGoals} / {goals.length}</p>
              </CardContent>
            </Card>
          </div>

          {categoryData.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="md:col-span-2 border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Goal Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {goals.filter(g => g.status === 'Active').map((goal) => {
                      const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                      const catOpt = CATEGORY_OPTIONS.find(c => c.value === goal.category) || CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1];
                      return (
                        <div key={goal._id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium flex items-center gap-1.5">
                              <catOpt.icon className="h-3 w-3" style={{ color: catOpt.color }} /> {goal.title}
                            </span>
                            <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Savings by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal: any) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                expanded={expandedGoal === goal._id}
                onToggle={() => setExpandedGoal(expandedGoal === goal._id ? null : goal._id)}
                onDelete={() => deleteGoal(goal._id)}
                onContribute={() => { setSelectedGoal(goal); setContribOpen(true); }}
              />
            ))}
          </div>
        </>
      )}

      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contribution — {selectedGoal?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted dark:bg-card rounded-xl p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Current</span>
                <span className="font-bold">{formatCurrency(selectedGoal?.currentAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Target</span>
                <span className="font-bold">{formatCurrency(selectedGoal?.targetAmount || 0)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="10,000" value={contribAmount}
                onChange={e => setContribAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input placeholder="Salary savings, bonus, etc." value={contribNote}
                onChange={e => setContribNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContribOpen(false)}>Cancel</Button>
            <Button onClick={handleAddContribution}>Add Contribution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalCard({ goal, expanded, onToggle, onDelete, onContribute }: {
  goal: any; expanded: boolean; onToggle: () => void; onDelete: () => void; onContribute: () => void;
}) {
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - (goal.currentAmount || 0));
  const catOpt = CATEGORY_OPTIONS.find(c => c.value === goal.category) || CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1];
  const Icon = catOpt.icon;
  const monthsRemaining = getMonthsRemaining(goal.targetDate);
  const projectedDate = getProjectedDate(goal.targetAmount, goal.currentAmount || 0, goal.monthlyContribution || 0, goal.targetDate);
  const contributions = goal.contributions || [];
  const totalContributed = contributions.reduce((s: number, c: any) => s + (c.amount || 0), 0);

  const priorityColor = goal.priority === 'High' ? 'text-destructive bg-destructive/10' : goal.priority === 'Low' ? 'text-primary bg-primary/10' : 'text-warning bg-warning/10';
  const statusColor = goal.status === 'Achieved' ? 'text-success bg-success/10' : goal.status === 'Paused' ? 'text-muted-foreground bg-muted' : 'text-primary bg-primary/5';

  return (
    <Card className={`overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow ${goal.status === 'Achieved' ? 'ring-2 ring-green-200' : ''}`}>
      <CardHeader className="cursor-pointer pb-3" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${catOpt.color}15` }}>
              <Icon className="h-5 w-5" style={{ color: catOpt.color }} />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{goal.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-[10px] ${priorityColor}`}>{goal.priority}</Badge>
                <Badge variant="outline" className={`text-[10px] ${statusColor}`}>
                  {goal.status === 'Achieved' && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                  {goal.status}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">{catOpt.label}</Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{formatCurrency(goal.currentAmount || 0)}</p>
            <p className="text-xs text-muted-foreground">of {formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{progress.toFixed(1)}% completed</span>
            <span className="text-muted-foreground">{formatCurrency(remaining)} remaining</span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted dark:bg-card/80 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Monthly</p>
            <p className="text-sm font-bold">{formatCurrency(goal.monthlyContribution || 0)}</p>
          </div>
          <div className="bg-muted dark:bg-card/80 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Contributions</p>
            <p className="text-sm font-bold">{contributions.length}</p>
          </div>
          <div className="bg-muted dark:bg-card/80 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Months Left</p>
            <p className="text-sm font-bold">{monthsRemaining !== null ? monthsRemaining : 'N/A'}</p>
          </div>
        </div>

        {projectedDate && goal.status === 'Active' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted dark:bg-card/80 rounded-lg p-2.5">
            <Clock className="h-3.5 w-3.5" />
            {projectedDate <= new Date() ? (
              <span className="text-success font-medium">Goal can be achieved now!</span>
            ) : (
              <span>Projected completion: <span className="font-semibold text-foreground">{projectedDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span></span>
            )}
          </div>
        )}

        {goal.targetDate && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}

        <div className="flex gap-2">
          {goal.status === 'Active' && (
            <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onContribute(); }}>
              <Coins className="h-4 w-4 mr-1" /> Add Money
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {expanded && contributions.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Recent Contributions</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {[...contributions].reverse().slice(0, 10).map((c: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground">
                    {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {c.note && ` · ${c.note}`}
                  </span>
                  <span className="font-semibold text-success">+{formatCurrency(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expanded && goal.notes && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground">{goal.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
