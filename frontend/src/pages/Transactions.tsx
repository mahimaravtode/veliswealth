import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Plus, Search, Filter, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
  Calendar, IndianRupee, Wallet, PiggyBank, Target, Loader2, Trash2, Edit2,
  Star, Download, Upload, X, ChevronLeft, ChevronRight, MoreHorizontal,
  ArrowLeftRight, Receipt, Shield, BarChart3, PieChart as PieChartIcon,
  DollarSign, CreditCard, Tag, Clock, CheckCircle2, AlertTriangle,
  RefreshCw, FileText, Heart, Settings2, TrendingDown as TrendingDownIcon,
  Copy
} from "lucide-react";
import { useTransactionStore, type Transaction } from '@/store/useTransactionStore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#a855f7', '#6366f1'];

const TYPE_OPTIONS = [
  { value: 'income', label: 'Income', color: 'text-success', bg: 'bg-success/10' },
  { value: 'expense', label: 'Expense', color: 'text-destructive', bg: 'bg-destructive/10' },
  { value: 'investment', label: 'Investment', color: 'text-primary', bg: 'bg-primary/10' },
  { value: 'insurance', label: 'Insurance', color: 'text-warning', bg: 'bg-warning/10' },
  { value: 'transfer', label: 'Transfer', color: 'text-muted-foreground', bg: 'bg-muted' },
];

const CATEGORY_MAP: Record<string, string[]> = {
  income: ['Salary', 'Business Income', 'Freelance Income', 'Rental Income', 'Dividends', 'Interest', 'Other Income'],
  expense: ['Food', 'Shopping', 'Travel', 'Entertainment', 'Utilities', 'Healthcare', 'Education', 'Insurance Premiums', 'EMI/Loans', 'Investments', 'Miscellaneous'],
  investment: ['Mutual Fund', 'SIP', 'Stock Buy', 'Stock Sell', 'Redemption', 'Dividend Credit', 'Bond', 'Gold', 'Real Estate', 'Cryptocurrency'],
  insurance: ['Premium Payment', 'Maturity Benefit', 'Claim Settlement', 'Renewal'],
  transfer: ['Self Transfer', 'Account Transfer'],
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

function formatCompact(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return formatCurrency(val);
}

function getTypeInfo(type: string) {
  return TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[1];
}

function TransactionForm({ open, onOpenChange, editTxn, onSaved }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editTxn?: Transaction | null;
  onSaved: () => void;
}) {
  const { addTransaction, updateTransaction } = useTransactionStore();
  const defaultForm: Partial<Transaction> = {
    type: 'expense',
    category: '',
    subcategory: '',
    amount: 0,
    direction: 'out',
    date: new Date().toISOString().split('T')[0],
    account: 'General',
    description: '',
    notes: '',
    tags: [],
    status: 'completed',
    isRecurring: false,
  };
  const [form, setForm] = useState<Partial<Transaction>>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (editTxn) {
      setForm({
        ...editTxn,
        date: editTxn.date ? new Date(editTxn.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setForm(defaultForm);
    }
    setError('');
  }, [editTxn, open]);

  const categories = CATEGORY_MAP[form.type || 'expense'] || [];

  const handleSave = async () => {
    setError('');
    if (!form.category) {
      setError('Please select a category');
      return;
    }
    if (!form.amount || form.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const direction: 'in' | 'out' = form.type === 'income' ? 'in' : 'out';
    const payload = {
      ...form,
      direction,
      date: form.date || new Date().toISOString().split('T')[0],
      account: form.account || 'General',
      status: form.status || 'completed',
    };

    setSaving(true);
    try {
      if (editTxn?._id) {
        await updateTransaction(editTxn._id, payload);
      } else {
        await addTransaction(payload);
      }
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction. Please try again.');
    }
    setSaving(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !(form.tags || []).includes(tagInput.trim())) {
      setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTxn ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as any, category: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                value={form.amount || ''}
                onChange={(e) => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={form.description || ''}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Transaction description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Account</Label>
              <Select value={form.account} onValueChange={(v) => setForm(f => ({ ...f, account: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['General', 'Savings', 'Current', 'Credit Card', 'Cash', 'UPI', 'Wallet'].map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['completed', 'pending', 'cancelled', 'failed'].map(s => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input
              value={form.notes || ''}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
              />
              <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
            </div>
            {(form.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {(form.tags || []).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() =>
                      setForm(f => ({ ...f, tags: (f.tags || []).filter(t => t !== tag) }))
                    } />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={form.isRecurring || false}
              onChange={(e) => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="recurring" className="text-sm font-normal cursor-pointer">Recurring transaction</Label>
          </div>

          {form.isRecurring && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Frequency</Label>
                <Select
                  value={form.recurrence?.frequency || 'monthly'}
                  onValueChange={(v) => setForm(f => ({
                    ...f,
                    recurrence: { ...f.recurrence, frequency: v as any }
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map(f => (
                      <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.recurrence?.endDate || ''}
                  onChange={(e) => setForm(f => ({
                    ...f,
                    recurrence: { ...f.recurrence, endDate: e.target.value }
                  }))}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editTxn ? 'Update' : 'Add Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BudgetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { budget, saveBudget, fetchBudget } = useTransactionStore();
  const [totalBudget, setTotalBudget] = useState(0);
  const [catBudgets, setCatBudgets] = useState<{ name: string; budget: number; spent: number }[]>([]);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  useEffect(() => {
    fetchBudget(month, year);
  }, [month, year]);

  useEffect(() => {
    if (budget) {
      setTotalBudget(budget.totalBudget || 0);
      setCatBudgets(budget.categories || []);
    }
  }, [budget]);

  const handleSave = async () => {
    await saveBudget({ month, year, totalBudget, categories: catBudgets });
    onOpenChange(false);
  };

  const totalSpent = catBudgets.reduce((s, c) => s + (c.spent || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Monthly Budget — {new Date(year, month - 1).toLocaleString('en-IN', { month: 'long' })} {year}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Total Monthly Budget (₹)</Label>
            <Input
              type="number"
              value={totalBudget || ''}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              placeholder="Enter total budget..."
            />
          </div>

          {totalBudget > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Overall Usage</span>
                <span className={totalSpent > totalBudget ? 'text-destructive' : 'text-success'}>
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                </span>
              </div>
              <Progress value={Math.min(100, (totalSpent / totalBudget) * 100)} className="h-2" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Category Budgets</Label>
            {catBudgets.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2">
                <span className="text-sm flex-1 truncate">{cat.name}</span>
                <span className="text-xs text-muted-foreground w-20 text-right">{formatCurrency(cat.spent)}</span>
                <Input
                  type="number"
                  className="w-28"
                  value={cat.budget || ''}
                  onChange={(e) => {
                    const updated = [...catBudgets];
                    updated[i] = { ...updated[i], budget: Number(e.target.value) };
                    setCatBudgets(updated);
                  }}
                  placeholder="Budget"
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Budget</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AnalyticsPanel() {
  const { analytics, fetchAnalytics } = useTransactionStore();
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    const now = new Date();
    let start = '';
    if (dateRange === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (dateRange === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else if (dateRange === 'quarter') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      start = d.toISOString().split('T')[0];
    } else if (dateRange === 'year') {
      start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }
    fetchAnalytics(start || undefined, now.toISOString().split('T')[0]);
  }, [dateRange]);

  if (!analytics) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const pieData = analytics.categoryBreakdown
    .filter(c => c.expense > 0)
    .map((c, i) => ({ name: c.name, value: c.expense, color: COLORS[i % COLORS.length] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {['week', 'month', 'quarter', 'year', 'all'].map(r => (
          <Button
            key={r}
            variant={dateRange === r ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(r)}
            className="capitalize"
          >
            {r}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Income', value: analytics.totalIncome, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Total Expense', value: analytics.totalExpense, icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Net Cash Flow', value: analytics.netCashFlow, icon: IndianRupee, color: analytics.netCashFlow >= 0 ? 'text-success' : 'text-destructive', bg: analytics.netCashFlow >= 0 ? 'bg-success/10' : 'bg-destructive/10' },
          { label: 'Savings Rate', value: analytics.savingsRate, icon: PiggyBank, color: 'text-primary', bg: 'bg-primary/10', suffix: '%' },
        ].map(card => (
          <Card key={card.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 ${card.bg} rounded-lg`}><card.icon className={`h-4 w-4 ${card.color}`} /></div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`text-lg font-bold ${card.color}`}>
                  {card.suffix ? `${card.value}${card.suffix}` : formatCompact(card.value)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Monthly Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => formatCompact(v)} />
                   <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} />
                   <Legend />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Income" />
                <Area type="monotone" dataKey="expense" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Expense" />
                <Area type="monotone" dataKey="investment" stackId="3" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} name="Investment" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Spending by Category</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                No expense data for this period
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Cash Flow</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.dailyCashFlow.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => formatCompact(v)} />
                <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Top Expense Categories</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topExpenseCategories.map((cat, i) => {
                const max = analytics.topExpenseCategories[0]?.expense || 1;
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(cat.expense)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(cat.expense / max) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
              {analytics.topExpenseCategories.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No expense data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Transactions() {
  const {
    transactions, total, page, pages, summary, analytics, budget,
    loading, filters,
    fetchTransactions, fetchSummary, fetchAnalytics, fetchBudget,
    deleteTransaction, toggleFavorite, setFilters,
  } = useTransactionStore();

  const [showForm, setShowForm] = useState(false);
  const [editTxn, setEditTxn] = useState<Transaction | null>(null);
  const [showBudget, setShowBudget] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    fetchBudget();
  }, []);

  const handleRefresh = () => {
    fetchTransactions(filters);
    fetchSummary();
    fetchAnalytics();
    fetchBudget();
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchTransactions({ ...filters, search: val, page: 1 });
  };

  const handleFilterType = (val: string) => {
    setFilterType(val);
    fetchTransactions({ ...filters, type: val === 'all' ? undefined : val, page: 1 });
  };

  const handleFilterStatus = (val: string) => {
    setFilterStatus(val);
    fetchTransactions({ ...filters, status: val === 'all' ? undefined : val, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    fetchTransactions({ ...filters, page: newPage });
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    fetchSummary();
  };

  const handleDuplicate = async (txn: Transaction) => {
    const { _id, ...rest } = txn;
    setEditTxn(null);
    setShowForm(true);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    params.set('format', 'csv');
    window.open(`/api/transactions/export?${params.toString()}`, '_blank');
  };

  const filteredTransactions = useMemo(() => {
    if (activeTab === 'all') return transactions;
    if (activeTab === 'favorites') return transactions.filter(t => t.isFavorite);
    return transactions.filter(t => t.type === activeTab);
  }, [transactions, activeTab]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: transactions.length, favorites: 0 };
    transactions.forEach(t => {
      counts[t.type] = (counts[t.type] || 0) + 1;
      if (t.isFavorite) counts.favorites++;
    });
    return counts;
  }, [transactions]);

  const budgetData = useMemo(() => {
    if (!budget?.categories) return [];
    return budget.categories.map((c: any) => ({
      ...c,
      percentage: c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0,
      remaining: Math.max(0, c.budget - c.spent),
      overspent: c.spent > c.budget ? c.spent - c.budget : 0,
    }));
  }, [budget]);

  const totalBudgetSpent = budgetData.reduce((s: number, c: any) => s + c.spent, 0);
  const totalBudgetAmount = budget?.totalBudget || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Track, categorize, and analyze all your financial activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBudget(true)}>
            <Target className="h-4 w-4 mr-1" /> Budget
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => { setEditTxn(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Transaction
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Month Income', value: formatCompact(summary.monthIncome), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Month Expense', value: formatCompact(summary.monthExpense), icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10' },
            { label: 'Month Investment', value: formatCompact(summary.monthInvestment), icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Month Savings', value: formatCompact(summary.monthSavings), icon: PiggyBank, color: summary.monthSavings >= 0 ? 'text-success' : 'text-destructive', bg: summary.monthSavings >= 0 ? 'bg-success/10' : 'bg-destructive/10' },
            { label: 'Savings Rate', value: `${summary.monthSavingsRate}%`, icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Today\'s Txns', value: summary.todayCount.toString(), icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
            { label: 'Month Txns', value: summary.monthCount.toString(), icon: Receipt, color: 'text-muted-foreground', bg: 'bg-muted' },
          ].map(card => (
            <Card key={card.label} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className={`p-1.5 ${card.bg} rounded-lg shrink-0`}><card.icon className={`h-3.5 w-3.5 ${card.color}`} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
                  <p className={`text-sm font-bold ${card.color} truncate`}>{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalBudgetAmount > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Monthly Budget</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(totalBudgetSpent)} / {formatCurrency(totalBudgetAmount)}
              </span>
            </div>
            <Progress
              value={Math.min(100, (totalBudgetSpent / totalBudgetAmount) * 100)}
              className="h-2"
            />
            <div className="flex justify-between mt-1.5">
              <span className={`text-xs ${totalBudgetSpent > totalBudgetAmount ? 'text-destructive' : 'text-success'}`}>
                {totalBudgetSpent > totalBudgetAmount
                  ? `Over budget by ${formatCurrency(totalBudgetSpent - totalBudgetAmount)}`
                  : `${formatCurrency(totalBudgetAmount - totalBudgetSpent)} remaining`
                }
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round((totalBudgetSpent / totalBudgetAmount) * 100)}% used
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all" className="text-xs">All ({typeCounts.all || 0})</TabsTrigger>
            <TabsTrigger value="income" className="text-xs">Income ({typeCounts.income || 0})</TabsTrigger>
            <TabsTrigger value="expense" className="text-xs">Expenses ({typeCounts.expense || 0})</TabsTrigger>
            <TabsTrigger value="investment" className="text-xs">Investments ({typeCounts.investment || 0})</TabsTrigger>
            <TabsTrigger value="insurance" className="text-xs">Insurance ({typeCounts.insurance || 0})</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs">
              <Star className="h-3 w-3 mr-1" /> Favorites ({typeCounts.favorites || 0})
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 w-48 h-8 text-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={handleFilterStatus}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {['completed', 'pending', 'cancelled', 'failed'].map(s => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Receipt className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No transactions found</p>
                  <p className="text-xs mt-1">Add your first transaction to get started</p>
                  <Button size="sm" className="mt-4" onClick={() => { setEditTxn(null); setShowForm(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Transaction
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((txn) => {
                        const typeInfo = getTypeInfo(txn.type);
                        return (
                          <TableRow key={txn._id} className="group">
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => txn._id && toggleFavorite(txn._id)}
                              >
                                <Star className={`h-3.5 w-3.5 ${txn.isFavorite ? 'fill-warning text-warning' : 'text-muted-foreground/40'}`} />
                              </Button>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${typeInfo.bg} ${typeInfo.color} border-0`}>
                                {typeInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-sm max-w-[200px] truncate">
                              {txn.description || txn.category}
                              {txn.isRecurring && (
                                <RefreshCw className="inline h-3 w-3 ml-1 text-muted-foreground" />
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {txn.category}
                              {txn.subcategory && <span className="text-xs opacity-60"> / {txn.subcategory}</span>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{txn.account}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] border-0 ${
                                  txn.status === 'completed' ? 'bg-success/10 text-success' :
                                  txn.status === 'pending' ? 'bg-warning/10 text-warning' :
                                  'bg-destructive/10 text-destructive'
                                }`}
                              >
                                {txn.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-semibold text-sm flex items-center justify-end gap-1 ${txn.direction === 'in' ? 'text-success' : 'text-destructive'}`}>
                                {txn.direction === 'in' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                {formatCurrency(txn.amount)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditTxn(txn); setShowForm(true); }}>
                                    <Edit2 className="h-3.5 w-3.5 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => txn._id && toggleFavorite(txn._id)}>
                                    <Star className="h-3.5 w-3.5 mr-2" /> {txn.isFavorite ? 'Unfavorite' : 'Favorite'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => txn._id && handleDelete(txn._id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {pages} ({total} transactions)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Monthly Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={analytics.monthlyTrend.slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
                      <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.15} name="Income" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} name="Expense" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.recentTransactions.slice(0, 6).map((txn: any) => {
                      const typeInfo = getTypeInfo(txn.type);
                      return (
                        <div key={txn._id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-1.5 ${typeInfo.bg} rounded-lg shrink-0`}>
                              {txn.direction === 'in'
                                ? <ArrowDownRight className={`h-3.5 w-3.5 ${typeInfo.color}`} />
                                : <ArrowUpRight className={`h-3.5 w-3.5 ${typeInfo.color}`} />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{txn.description || txn.category}</p>
                              <p className="text-xs text-muted-foreground">{new Date(txn.date).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold shrink-0 ${txn.direction === 'in' ? 'text-success' : 'text-destructive'}`}>
                            {txn.direction === 'in' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </span>
                        </div>
                      );
                    })}
                    {analytics.recentTransactions.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-6">No recent transactions</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <AnalyticsPanel />
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics && (
              <>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-primary/10 rounded-lg"><PiggyBank className="h-4 w-4 text-primary" /></div>
                      <h3 className="text-sm font-semibold">Savings Health</h3>
                    </div>
                    <p className="text-2xl font-bold text-primary">{analytics.savingsRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.savingsRate >= 30
                        ? 'Great job! You\'re saving well this period.'
                        : analytics.savingsRate >= 15
                          ? 'Good progress. Try to increase savings to 30%.'
                          : 'Consider reducing expenses to improve savings rate.'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-success/10 rounded-lg"><TrendingUp className="h-4 w-4 text-success" /></div>
                      <h3 className="text-sm font-semibold">Cash Position</h3>
                    </div>
                    <p className={`text-2xl font-bold ${analytics.netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCompact(analytics.netCashFlow)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.netCashFlow >= 0
                        ? 'Positive cash flow. You\'re earning more than spending.'
                        : 'Negative cash flow. Review your expenses.'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-warning/10 rounded-lg"><BarChart3 className="h-4 w-4 text-warning" /></div>
                      <h3 className="text-sm font-semibold">Investment Activity</h3>
                    </div>
                    <p className="text-2xl font-bold">{formatCompact(analytics.totalInvestment)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.totalInvestment > 0
                        ? `${Math.round((analytics.totalInvestment / analytics.totalIncome) * 100)}% of income invested.`
                        : 'No investments recorded this period.'}
                    </p>
                  </CardContent>
                </Card>

                {analytics.topExpenseCategories.length > 0 && (
                  <Card className="border-0 shadow-sm md:col-span-2 lg:col-span-3">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-destructive/10 rounded-lg"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
                        <h3 className="text-sm font-semibold">Spending Insights</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {analytics.topExpenseCategories.slice(0, 3).map((cat, i) => (
                          <div key={cat.name} className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium">{cat.name}</p>
                            <p className="text-lg font-bold">{formatCurrency(cat.expense)}</p>
                            <p className="text-xs text-muted-foreground">
                              {i === 0 ? 'Highest spending category' : `Top ${i + 1} expense`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {budget && budget.totalBudget > 0 && (
              <Card className="border-0 shadow-sm md:col-span-2 lg:col-span-3">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Target className="h-4 w-4 text-primary" /></div>
                    <h3 className="text-sm font-semibold">Budget Status</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {budgetData.filter((c: any) => c.budget > 0).map((cat: any) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium truncate">{cat.name}</span>
                          <span className={cat.percentage > 100 ? 'text-destructive' : 'text-muted-foreground'}>
                            {cat.percentage}%
                          </span>
                        </div>
                        <Progress
                          value={Math.min(100, cat.percentage)}
                          className="h-1.5"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <TransactionForm
        open={showForm}
        onOpenChange={setShowForm}
        editTxn={editTxn}
        onSaved={handleRefresh}
      />

      <BudgetDialog
        open={showBudget}
        onOpenChange={setShowBudget}
      />
    </div>
  );
}
