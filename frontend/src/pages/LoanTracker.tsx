import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Plus, Trash2, Percent, IndianRupee, Landmark, HandCoins,
  ArrowDownCircle, Calculator, ChevronDown, ChevronUp, Wallet,
  PiggyBank, CheckCircle2, Clock, TrendingUp, Calendar, CreditCard,
  Target, AlertCircle, Coins, BarChart3, Loader2, CircleDollarSign,
  BadgeCheck, History, X, Timer, CircleDollarSign as DollarIcon, Badge
} from "lucide-react";
import { useLoanStore, type Loan } from '@/store/useLoanStore';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

function calculateEMI(principal: number, monthlyRate: number, months: number) {
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
}

function getLoanSchedule(loan: Loan) {
  const tenureMonths = loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure;
  const monthlyRate = loan.interestRate / 12 / 100;
  const emi = calculateEMI(loan.loanAmount, monthlyRate, tenureMonths);
  const startDate = new Date(loan.startDate);
  let balance = loan.loanAmount;
  const schedule: Array<{
    month: number; year: number; monthOfYear: number; emi: number;
    principal: number; interest: number; balance: number; date: Date;
  }> = [];
  const sortedPrepayments = [...(loan.prepayments || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let prepayIndex = 0;

  for (let i = 1; i <= tenureMonths && balance > 0; i++) {
    const interestPayment = balance * monthlyRate;
    let principalPayment = emi - interestPayment;
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + i);

    while (prepayIndex < sortedPrepayments.length) {
      const pp = sortedPrepayments[prepayIndex];
      if (new Date(pp.date) <= currentDate) {
        balance = Math.max(0, balance - pp.amount);
        prepayIndex++;
        if (balance <= 0) break;
      } else break;
    }
    if (balance <= 0) break;
    if (principalPayment > balance) principalPayment = balance;
    balance = Math.max(0, balance - principalPayment);

    schedule.push({
      month: i, year: currentDate.getFullYear(), monthOfYear: currentDate.getMonth() + 1,
      emi, principal: principalPayment, interest: interestPayment, balance, date: currentDate,
    });
  }
  return { emi, schedule, totalPayment: schedule.reduce((s, r) => s + r.emi, 0), totalInterest: schedule.reduce((s, r) => s + r.interest, 0) };
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

function formatCompact(val: number) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return formatCurrency(val);
}

function getMonthsElapsed(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
}

function getNextEmiDate(startDate: string): Date {
  const start = new Date(startDate);
  const now = new Date();
  const monthsElapsed = getMonthsElapsed(startDate);
  const next = new Date(start);
  next.setMonth(next.getMonth() + monthsElapsed + 1);
  return next;
}

function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function LoanTracker() {
  const { loans, loading, fetchLoans, addLoan, deleteLoan, updateLoan, addPrepayment } = useLoanStore();
  const [open, setOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [prepayOpen, setPrepayOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [closureOpen, setClosureOpen] = useState(false);
  const [simEmi, setSimEmi] = useState(0);
  const [simResult, setSimResult] = useState<{ newTenure: number; totalInterest: number; interestSaved: number } | null>(null);
  const [closureResult, setClosureResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '', loanAmount: '', interestRate: '', tenure: '',
    tenureType: 'years' as 'years' | 'months', startDate: '', loanType: 'Home', bankName: ''
  });
  const [prepayData, setPrepayData] = useState({ amount: '', date: '', type: 'partial' as 'partial' | 'full', note: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Loan name is required';
    if (!formData.loanAmount || Number(formData.loanAmount) <= 0) errors.loanAmount = 'Enter a valid amount';
    if (!formData.interestRate || Number(formData.interestRate) <= 0) errors.interestRate = 'Enter a valid rate';
    if (!formData.tenure || Number(formData.tenure) <= 0) errors.tenure = 'Enter a valid tenure';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddLoan = async () => {
    if (!validateForm()) return;
    setApiError(null);
    try {
      await addLoan({
        title: formData.title, loanAmount: Number(formData.loanAmount),
        interestRate: Number(formData.interestRate), tenure: Number(formData.tenure),
        tenureType: formData.tenureType, startDate: formData.startDate,
        loanType: formData.loanType, bankName: formData.bankName,
        emiPaid: 0, prepayments: [],
      });
      setOpen(false);
      setFormData({ title: '', loanAmount: '', interestRate: '', tenure: '', tenureType: 'years', startDate: '', loanType: 'Home', bankName: '' });
      setFormErrors({});
    } catch (err: any) {
      setApiError(err.message || 'Failed to save loan. Please try again.');
    }
  };

  const handleAddPrepayment = async () => {
    if (!selectedLoan || !prepayData.amount || !prepayData.date) return;
    setApiError(null);
    try {
      await addPrepayment(selectedLoan._id!, {
        amount: Number(prepayData.amount), date: prepayData.date,
        type: prepayData.type, note: prepayData.note,
      });
      setPrepayOpen(false);
      setPrepayData({ amount: '', date: '', type: 'partial', note: '' });
      await fetchLoans();
    } catch (err: any) {
      setApiError(err.message || 'Failed to record prepayment.');
    }
  };

  const handleSimulate = (loan: Loan) => {
    const tenureMonths = loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure;
    const monthlyRate = loan.interestRate / 12 / 100;
    const currentEmi = calculateEMI(loan.loanAmount, monthlyRate, tenureMonths);
    setSimEmi(Math.round(currentEmi));
    setSelectedLoan(loan);
    setSimResult(null);
    setSimOpen(true);
  };

  const runSimulation = () => {
    if (!selectedLoan || simEmi <= 0) return;
    const tenureMonths = selectedLoan.tenureType === 'years' ? selectedLoan.tenure * 12 : selectedLoan.tenure;
    const monthlyRate = selectedLoan.interestRate / 12 / 100;
    const currentEmi = calculateEMI(selectedLoan.loanAmount, monthlyRate, tenureMonths);
    let balance = selectedLoan.loanAmount;
    let months = 0;
    let totalInterest = 0;
    while (balance > 0 && months < 600) {
      const interest = balance * monthlyRate;
      totalInterest += interest;
      const principal = simEmi - interest;
      if (principal <= 0) break;
      balance = Math.max(0, balance - principal);
      months++;
    }
    const originalTotalInterest = currentEmi * tenureMonths - selectedLoan.loanAmount;
    setSimResult({
      newTenure: months, totalInterest,
      interestSaved: Math.max(0, originalTotalInterest - totalInterest),
    });
  };

  const handleEarlyClosure = (loan: Loan) => {
    setSelectedLoan(loan);
    setClosureResult(null);
    setClosureOpen(true);
  };

  const runClosureCalc = () => {
    if (!selectedLoan) return;
    const tenureMonths = selectedLoan.tenureType === 'years' ? selectedLoan.tenure * 12 : selectedLoan.tenure;
    const monthlyRate = selectedLoan.interestRate / 12 / 100;
    const emi = calculateEMI(selectedLoan.loanAmount, monthlyRate, tenureMonths);
    const monthsElapsed = getMonthsElapsed(selectedLoan.startDate);
    const monthsPaid = Math.min(monthsElapsed, tenureMonths);
    let balance = selectedLoan.loanAmount;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    for (let i = 0; i < monthsPaid; i++) {
      const interest = balance * monthlyRate;
      const principal = emi - interest;
      totalInterestPaid += interest;
      totalPrincipalPaid += principal;
      balance = Math.max(0, balance - principal);
    }
    const originalTotalInterest = emi * tenureMonths - selectedLoan.loanAmount;
    setClosureResult({
      outstandingBalance: Math.round(balance),
      totalPaid: Math.round(totalInterestPaid + totalPrincipalPaid),
      totalInterestPaid: Math.round(totalInterestPaid),
      totalPrincipalPaid: Math.round(totalPrincipalPaid),
      remainingEMIs: tenureMonths - monthsPaid,
      interestSaved: Math.max(0, Math.round(originalTotalInterest - totalInterestPaid)),
    });
  };

  const totalLoanAmount = useMemo(() => loans.reduce((s, l) => s + l.loanAmount, 0), [loans]);
  const totalPrepaid = useMemo(() => loans.reduce((s, l) => s + (l.prepayments || []).reduce((ps, pp) => ps + pp.amount, 0), 0), [loans]);

  const aggregateStats = useMemo(() => {
    let totalEmi = 0, totalPaid = 0, totalRemaining = 0, totalPrincipalPaid = 0, totalInterestPaid = 0;
    let totalOutstanding = 0, totalInterestRemaining = 0;
    loans.forEach(loan => {
      const tenureMonths = loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure;
      const monthlyRate = loan.interestRate / 12 / 100;
      const emi = calculateEMI(loan.loanAmount, monthlyRate, tenureMonths);
      const { schedule, totalPayment, totalInterest } = getLoanSchedule(loan);
      const monthsElapsed = getMonthsElapsed(loan.startDate);
      const monthsPaid = Math.min(monthsElapsed, schedule.length);
      let pPaid = 0, iPaid = 0;
      for (let i = 0; i < monthsPaid && i < schedule.length; i++) {
        pPaid += schedule[i].principal;
        iPaid += schedule[i].interest;
      }
      totalEmi += emi;
      totalPaid += pPaid + iPaid;
      totalRemaining += totalPayment - pPaid - iPaid;
      totalPrincipalPaid += pPaid;
      totalInterestPaid += iPaid;
      totalOutstanding += schedule[Math.min(monthsPaid, schedule.length - 1)]?.balance || loan.loanAmount;
      totalInterestRemaining += totalInterest - iPaid;
    });
    return { totalEmi, totalPaid, totalRemaining, totalPrincipalPaid, totalInterestPaid, totalOutstanding, totalInterestRemaining };
  }, [loans]);

  return (
    <div className="space-y-6">
      {apiError && (
        <div className="bg-destructive/10 border-destructive/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{apiError}</p>
          <button onClick={() => setApiError(null)} className="text-destructive hover:text-destructive"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loan Goal Tracker</h1>
          <p className="text-muted-foreground">Track, analyze, and optimize your loan repayment journey.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg"><Plus className="mr-2 h-5 w-5" /> Add Loan</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Loan</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Loan Name *</Label>
                <Input placeholder="e.g. Home Loan - HDFC" value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })} />
                {formErrors.title && <p className="text-xs text-destructive">{formErrors.title}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loan Amount *</Label>
                  <Input type="number" placeholder="50,00,000" value={formData.loanAmount}
                    onChange={e => setFormData({ ...formData, loanAmount: e.target.value })} />
                  {formErrors.loanAmount && <p className="text-xs text-destructive">{formErrors.loanAmount}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Interest Rate (% p.a.) *</Label>
                  <Input type="number" step="0.1" placeholder="8.5" value={formData.interestRate}
                    onChange={e => setFormData({ ...formData, interestRate: e.target.value })} />
                  {formErrors.interestRate && <p className="text-xs text-destructive">{formErrors.interestRate}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tenure *</Label>
                  <Input type="number" placeholder="20" value={formData.tenure}
                    onChange={e => setFormData({ ...formData, tenure: e.target.value })} />
                  {formErrors.tenure && <p className="text-xs text-destructive">{formErrors.tenure}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tenure Type</Label>
                  <Select value={formData.tenureType} onValueChange={(v: string) => setFormData({ ...formData, tenureType: v as 'years' | 'months' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Loan Type</Label>
                  <Select value={formData.loanType} onValueChange={(v) => setFormData({ ...formData, loanType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Home', 'Car', 'Personal', 'Education', 'Business', 'Gold', 'Other'].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                  {formErrors.startDate && <p className="text-xs text-destructive">{formErrors.startDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Bank / Lender Name</Label>
                  <Input placeholder="HDFC Bank" value={formData.bankName}
                    onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
                </div>
              </div>
            </div>
            {apiError && (
              <div className="bg-destructive/10 border-destructive/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{apiError}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); setApiError(null); }}>Cancel</Button>
              <Button onClick={handleAddLoan}>Save Loan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loans.length === 0 && !loading && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-muted dark:bg-card rounded-2xl mb-4">
              <HandCoins className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No loans tracked yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">Add your first loan to start tracking your repayment journey. All calculations are automatic.</p>
            <Button size="lg" onClick={() => setOpen(true)}><Plus className="mr-2 h-5 w-5" /> Add Your First Loan</Button>
          </CardContent>
        </Card>
      )}

      {loading && loans.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {loans.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AggregateCard icon={<Landmark className="h-5 w-5" />} label="Total Loans" value={`${loans.length}`} sub="Active" color="bg-primary text-primary-foreground" />
            <AggregateCard icon={<IndianRupee className="h-5 w-5" />} label="Total Outstanding" value={formatCompact(aggregateStats.totalOutstanding)} sub="Principal remaining" color="bg-warning text-warning-foreground" />
            <AggregateCard icon={<CheckCircle2 className="h-5 w-5" />} label="Total Paid" value={formatCompact(aggregateStats.totalPaid)} sub="Principal + Interest" color="bg-success text-success-foreground" />
            <AggregateCard icon={<Coins className="h-5 w-5" />} label="Interest Paid" value={formatCompact(aggregateStats.totalInterestPaid)} sub="Out of total interest" color="bg-accent text-accent-foreground" />
          </div>

          {loans.map((loan) => (
            <LoanCard
              key={loan._id} loan={loan}
              expanded={expandedLoan === loan._id}
              onToggle={() => setExpandedLoan(expandedLoan === loan._id ? null : loan._id!)}
              onDelete={() => loan._id && deleteLoan(loan._id)}
              onPrepay={() => { setSelectedLoan(loan); setPrepayOpen(true); }}
              onSimulate={() => handleSimulate(loan)}
              onEarlyClosure={() => handleEarlyClosure(loan)}
            />
          ))}
        </>
      )}

      <Dialog open={prepayOpen} onOpenChange={setPrepayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Prepayment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" placeholder="50,000" value={prepayData.amount}
                onChange={e => setPrepayData({ ...prepayData, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={prepayData.date}
                onChange={e => setPrepayData({ ...prepayData, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={prepayData.type} onValueChange={(v: string) => setPrepayData({ ...prepayData, type: v as 'partial' | 'full' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="partial">Partial Prepayment</SelectItem>
                  <SelectItem value="full">Full Prepayment (Close Loan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input placeholder="Bonus, tax refund, etc." value={prepayData.note}
                onChange={e => setPrepayData({ ...prepayData, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrepayOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPrepayment}>Save Prepayment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={simOpen} onOpenChange={setSimOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>EMI Simulation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Adjust your EMI to see how it affects tenure and interest.</p>
            <div className="space-y-2">
              <Label>New Monthly EMI</Label>
              <Input type="number" value={simEmi} onChange={e => setSimEmi(Number(e.target.value))} />
            </div>
            <Button onClick={runSimulation} className="w-full">Calculate Impact</Button>
            {simResult && (
              <div className="space-y-3 bg-muted dark:bg-card p-4 rounded-xl">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">New Tenure</span><span className="font-bold">{Math.floor(simResult.newTenure / 12)}y {simResult.newTenure % 12}m</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Interest</span><span className="font-bold">{formatCurrency(simResult.totalInterest)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-success font-medium">Interest Saved</span><span className="font-bold text-success">{formatCurrency(simResult.interestSaved)}</span></div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={closureOpen} onOpenChange={setClosureOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Early Loan Closure</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">See how much you save by closing your loan now.</p>
            <Button onClick={runClosureCalc} className="w-full">Calculate</Button>
            {closureResult && (
              <div className="space-y-3 bg-muted dark:bg-card p-4 rounded-xl">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Outstanding Balance</span><span className="font-bold">{formatCurrency(closureResult.outstandingBalance)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total Paid</span><span className="font-bold">{formatCurrency(closureResult.totalPaid)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Principal Paid</span><span className="font-bold text-primary">{formatCurrency(closureResult.totalPrincipalPaid)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Interest Paid</span><span className="font-bold text-destructive">{formatCurrency(closureResult.totalInterestPaid)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Remaining EMIs</span><span className="font-bold">{closureResult.remainingEMIs}</span></div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm text-success font-medium">Interest Saved</span>
                  <span className="font-bold text-success">{formatCurrency(closureResult.interestSaved)}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoanCard({ loan, expanded, onToggle, onDelete, onPrepay, onSimulate, onEarlyClosure }: {
  loan: Loan; expanded: boolean; onToggle: () => void; onDelete: () => void;
  onPrepay: () => void; onSimulate: () => void; onEarlyClosure: () => void;
}) {
  const tenureMonths = loan.tenureType === 'years' ? loan.tenure * 12 : loan.tenure;
  const monthlyRate = loan.interestRate / 12 / 100;
  const emi = calculateEMI(loan.loanAmount, monthlyRate, tenureMonths);
  const { schedule, totalPayment, totalInterest } = useMemo(() => getLoanSchedule(loan), [loan]);
  const monthsElapsed = getMonthsElapsed(loan.startDate);
  const monthsPaid = Math.min(monthsElapsed, schedule.length);
  const remainingMonths = Math.max(0, tenureMonths - monthsPaid);
  const completionPct = Math.min(100, (monthsPaid / tenureMonths) * 100);
  const startDate = new Date(loan.startDate);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + tenureMonths);

  let principalPaid = 0;
  let interestPaid = 0;
  for (let i = 0; i < monthsPaid && i < schedule.length; i++) {
    principalPaid += schedule[i].principal;
    interestPaid += schedule[i].interest;
  }
  const amountRepaid = principalPaid + interestPaid;
  const remainingAmount = totalPayment - amountRepaid;
  const outstandingBalance = schedule[Math.min(monthsPaid, schedule.length - 1)]?.balance || loan.loanAmount;
  const totalPrepaid = (loan.prepayments || []).reduce((s, pp) => s + pp.amount, 0);
  const interestSavedFromPrepayments = useMemo(() => {
    if (!loan.prepayments || loan.prepayments.length === 0) return 0;
    const withoutPrepay = getLoanSchedule({ ...loan, prepayments: [] });
    return Math.max(0, withoutPrepay.totalInterest - totalInterest);
  }, [loan, totalInterest]);

  const nextEmiDate = getNextEmiDate(loan.startDate);
  const daysRemaining = getDaysRemaining(endDate);
  const yearsCompleted = Math.floor(monthsElapsed / 12);
  const monthsCompleted = monthsElapsed % 12;
  const yearsLeft = Math.floor(remainingMonths / 12);
  const monthsLeft = remainingMonths % 12;

  const yearData = useMemo(() => {
    const years: Record<number, { principal: number; interest: number; balance: number; emis: number; totalPaid: number }> = {};
    schedule.forEach(s => {
      if (!years[s.year]) years[s.year] = { principal: 0, interest: 0, balance: s.balance, emis: 0, totalPaid: 0 };
      years[s.year].principal += s.principal;
      years[s.year].interest += s.interest;
      years[s.year].balance = s.balance;
      years[s.year].emis++;
      years[s.year].totalPaid += s.emi;
    });
    return Object.entries(years).map(([year, data]) => ({
      year: Number(year), ...data,
      principal: Math.round(data.principal), interest: Math.round(data.interest),
      balance: Math.round(data.balance), totalPaid: Math.round(data.totalPaid),
    }));
  }, [schedule]);

  const balanceTrend = useMemo(() => {
    return schedule.filter((_, i) => i % 3 === 0 || i === schedule.length - 1).map(s => ({
      month: s.month, label: `M${s.month}`,
      balance: Math.round(s.balance), principal: Math.round(s.principal), interest: Math.round(s.interest),
    }));
  }, [schedule]);

  const cumulativeData = useMemo(() => {
    let cumPrincipal = 0;
    let cumInterest = 0;
    return schedule.filter((_, i) => i % 6 === 0 || i === schedule.length - 1).map(s => {
      cumPrincipal += s.principal;
      cumInterest += s.interest;
      return { month: s.month, label: `M${s.month}`, cumPrincipal: Math.round(cumPrincipal), cumInterest: Math.round(cumInterest) };
    });
  }, [schedule]);

  const pieData = [
    { name: 'Principal', value: Math.round(loan.loanAmount) },
    { name: 'Interest', value: Math.round(totalInterest) },
  ];

  const paidPieData = [
    { name: 'Principal Paid', value: Math.round(principalPaid) },
    { name: 'Interest Paid', value: Math.round(interestPaid) },
    { name: 'Remaining', value: Math.round(remainingAmount) },
  ];

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="cursor-pointer hover:bg-accent transition-colors" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{loan.title}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {loan.bankName && <><Badge variant="secondary" className="text-xs">{loan.bankName}</Badge>·</>}
                <Badge variant="outline" className="text-xs">{loan.loanType}</Badge>
                · Started {startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Monthly EMI</p>
              <p className="text-xl font-bold text-primary">{formatCurrency(emi)}</p>
            </div>
            {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatMini icon={<CreditCard className="h-4 w-4" />} label="Current EMI" value={formatCurrency(emi)} color="text-primary" />
          <StatMini icon={<Percent className="h-4 w-4" />} label="Completion" value={`${completionPct.toFixed(1)}%`} color="text-success" />
          <StatMini icon={<IndianRupee className="h-4 w-4" />} label="Paid till Date" value={formatCompact(amountRepaid)} color="text-success" />
          <StatMini icon={<Wallet className="h-4 w-4" />} label="Remaining" value={formatCompact(remainingAmount)} color="text-warning" />
          <StatMini icon={<Clock className="h-4 w-4" />} label="Tenure Left" value={`${yearsLeft}y ${monthsLeft}m`} color="text-primary" />
          <StatMini icon={<PiggyBank className="h-4 w-4" />} label="Interest Saved" value={formatCurrency(interestSavedFromPrepayments)} color="text-success" />
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> {monthsPaid} EMIs paid</span>
            <span className="flex items-center gap-1">{remainingMonths} remaining <Clock className="h-3 w-3" /></span>
          </div>
          <Progress value={completionPct} className="h-3" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onPrepay(); }}>
            <ArrowDownCircle className="h-4 w-4 mr-1" /> Prepayment
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSimulate(); }}>
            <Calculator className="h-4 w-4 mr-1" /> Simulate EMI
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onEarlyClosure(); }}>
            <BadgeCheck className="h-4 w-4 mr-1" /> Early Closure
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive ml-auto" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>

        {loan.prepayments && loan.prepayments.length > 0 && (
          <div className="bg-success/5 border-success/30 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-success mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Prepayments ({loan.prepayments.length}) — Total: {formatCurrency(totalPrepaid)}
            </h4>
            <div className="space-y-1">
              {loan.prepayments.map((pp, i) => (
                <div key={i} className="flex justify-between text-xs text-success">
                  <span>{new Date(pp.date).toLocaleDateString('en-IN')} · {pp.type}{pp.note && ` · ${pp.note}`}</span>
                  <span className="font-bold">{formatCurrency(pp.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {expanded && (
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <AnalyticsCard title="Loan Overview" icon={<CircleDollarSign className="h-4 w-4 text-primary" />}>
                  <DetailRow label="Loan Amount" value={formatCurrency(loan.loanAmount)} />
                  <DetailRow label="Interest Rate" value={`${loan.interestRate}% p.a.`} />
                  <DetailRow label="Tenure" value={loan.tenureType === 'years' ? `${loan.tenure} years` : `${loan.tenure} months`} />
                  <DetailRow label="Monthly EMI" value={formatCurrency(emi)} />
                  <DetailRow label="Total Payment" value={formatCurrency(totalPayment)} />
                  <DetailRow label="Total Interest" value={formatCurrency(totalInterest)} highlight />
                  <DetailRow label="Start Date" value={startDate.toLocaleDateString('en-IN')} />
                  <DetailRow label="End Date" value={endDate.toLocaleDateString('en-IN')} />
                </AnalyticsCard>
                <AnalyticsCard title="Repayment Progress" icon={<TrendingUp className="h-4 w-4 text-success" />}>
                  <DetailRow label="Total EMIs" value={`${tenureMonths}`} />
                  <DetailRow label="EMIs Paid" value={`${monthsPaid}`} />
                  <DetailRow label="EMIs Remaining" value={`${remainingMonths}`} />
                  <DetailRow label="Completion" value={`${completionPct.toFixed(1)}%`} />
                  <DetailRow label="Amount Repaid" value={formatCurrency(amountRepaid)} />
                  <DetailRow label="Remaining Amount" value={formatCurrency(remainingAmount)} />
                  <DetailRow label="Principal Paid" value={formatCurrency(principalPaid)} />
                  <DetailRow label="Interest Paid" value={formatCurrency(interestPaid)} />
                  <DetailRow label="Outstanding Balance" value={formatCurrency(outstandingBalance)} highlight />
                </AnalyticsCard>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <AnalyticsCard title="Time Progress" icon={<Calendar className="h-4 w-4 text-primary" />}>
                  <DetailRow label="Completed" value={`${yearsCompleted} years ${monthsCompleted} months`} />
                  <DetailRow label="Remaining" value={`${yearsLeft} years ${monthsLeft} months`} />
                  <DetailRow label="Days Remaining" value={`${daysRemaining.toLocaleString()} days`} />
                  <DetailRow label="Loan End Date" value={endDate.toLocaleDateString('en-IN')} />
                </AnalyticsCard>
                <AnalyticsCard title="Interest Analysis" icon={<Coins className="h-4 w-4 text-warning" />}>
                  <DetailRow label="Total Interest" value={formatCurrency(totalInterest)} />
                  <DetailRow label="Interest Paid" value={formatCurrency(interestPaid)} />
                  <DetailRow label="Remaining Interest" value={formatCurrency(totalInterest - interestPaid)} highlight />
                  <DetailRow label="Interest Ratio" value={`${((totalInterest / loan.loanAmount) * 100).toFixed(1)}%`} />
                </AnalyticsCard>
                <AnalyticsCard title="Principal Breakdown" icon={<Target className="h-4 w-4 text-primary" />}>
                  <DetailRow label="Original Principal" value={formatCurrency(loan.loanAmount)} />
                  <DetailRow label="Principal Paid" value={formatCurrency(principalPaid)} />
                  <DetailRow label="Principal Remaining" value={formatCurrency(loan.loanAmount - principalPaid)} />
                  <DetailRow label="Prepayments" value={formatCurrency(totalPrepaid)} />
                  <DetailRow label="Interest Saved" value={formatCurrency(interestSavedFromPrepayments)} />
                </AnalyticsCard>
              </div>
              <AnalyticsCard title="Next EMI" icon={<Timer className="h-4 w-4 text-primary" />}>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Next EMI Due</p>
                    <p className="text-2xl font-bold">{formatCurrency(emi)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="text-lg font-semibold">{nextEmiDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </AnalyticsCard>
            </TabsContent>

            <TabsContent value="yearly" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Year-wise Payment Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Year</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">EMIs</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Total Paid</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Principal</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Interest</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearData.map((yd) => {
                          const isCurrentYear = yd.year === new Date().getFullYear();
                          return (
                            <tr key={yd.year} className={`border-b last:border-0 hover:bg-accent ${isCurrentYear ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                              <td className="py-2 px-3 font-medium">{yd.year} {isCurrentYear && <Badge variant="default" className="ml-1 text-[10px] py-0">NOW</Badge>}</td>
                              <td className="text-right py-2 px-3">{yd.emis}</td>
                              <td className="text-right py-2 px-3 font-medium">{formatCurrency(yd.totalPaid)}</td>
                              <td className="text-right py-2 px-3 text-primary font-medium">{formatCurrency(yd.principal)}</td>
                              <td className="text-right py-2 px-3 text-destructive font-medium">{formatCurrency(yd.interest)}</td>
                              <td className="text-right py-2 px-3 text-muted-foreground">{formatCurrency(yd.balance)}</td>
                            </tr>
                          );
                        })}
                        <tr className="border-t-2 font-bold bg-muted dark:bg-card">
                          <td className="py-2 px-3">Total</td>
                          <td className="text-right py-2 px-3">{tenureMonths}</td>
                          <td className="text-right py-2 px-3">{formatCurrency(totalPayment)}</td>
                          <td className="text-right py-2 px-3 text-primary">{formatCurrency(loan.loanAmount)}</td>
                          <td className="text-right py-2 px-3 text-destructive">{formatCurrency(totalInterest)}</td>
                          <td className="text-right py-2 px-3">₹0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monthly" className="pt-4">
              <MonthlyBreakdown schedule={schedule} monthsPaid={monthsPaid} />
            </TabsContent>

            <TabsContent value="charts" className="pt-4 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-md">
                  <CardHeader><CardTitle className="text-base">Remaining Balance Trend</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={balanceTrend}>
                        <defs>
                          <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
                        <Tooltip formatter={(v: number) => [`${formatCurrency(v)}`, '']} />
                        <Area type="monotone" dataKey="balance" stroke="#2563eb" fill="url(#balanceGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardHeader><CardTitle className="text-base">Principal vs Interest</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${formatCurrency(v)}`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-md">
                  <CardHeader><CardTitle className="text-base">Payment Progress</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={paidPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {paidPieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${formatCurrency(v)}`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardHeader><CardTitle className="text-base">Cumulative Payment</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={cumulativeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
                        <Tooltip formatter={(v: number) => [`${formatCurrency(v)}`, '']} />
                        <Legend />
                        <Area type="monotone" dataKey="cumPrincipal" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} name="Principal" />
                        <Area type="monotone" dataKey="cumInterest" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Interest" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle className="text-base">Year-wise Payment Analysis</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={yearData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
                      <Tooltip formatter={(v: number) => [`${formatCurrency(v)}`, '']} />
                      <Legend />
                      <Bar dataKey="principal" fill="#2563eb" name="Principal" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="interest" fill="#ef4444" name="Interest" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardHeader><CardTitle className="text-base">Balance Decline (Year-wise)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={yearData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCompact(v)} />
                      <Tooltip formatter={(v: number) => [`${formatCurrency(v)}`, '']} />
                      <Line type="monotone" dataKey="balance" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} name="Remaining Balance" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="pt-4">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" /> Full Amortization Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card z-10">
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">EMI</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Principal</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Interest</th>
                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((s) => {
                          const isPaid = s.month <= monthsPaid;
                          return (
                            <tr key={s.month} className={`border-b last:border-0 hover:bg-accent ${isPaid ? 'bg-success/10' : ''}`}>
                              <td className="py-2 px-3 text-muted-foreground">{s.month}</td>
                              <td className="py-2 px-3">{s.date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                              <td className="text-right py-2 px-3">{formatCurrency(s.emi)}</td>
                              <td className="text-right py-2 px-3 text-primary">{formatCurrency(s.principal)}</td>
                              <td className="text-right py-2 px-3 text-destructive">{formatCurrency(s.interest)}</td>
                              <td className="text-right py-2 px-3 font-medium">{formatCurrency(s.balance)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function MonthlyBreakdown({ schedule, monthsPaid }: { schedule: any[]; monthsPaid: number }) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const years = useMemo(() => [...new Set(schedule.map(s => s.year))].sort(), [schedule]);
  const monthlyData = useMemo(() => {
    return schedule
      .filter(s => s.year === selectedYear)
      .map(s => ({
        ...s, isPaid: s.month <= monthsPaid,
        monthName: new Date(s.year, s.monthOfYear - 1).toLocaleString('en-IN', { month: 'short' }),
      }));
  }, [schedule, selectedYear, monthsPaid]);

  const yearTotals = useMemo(() => {
    const data = schedule.filter(s => s.year === selectedYear);
    return {
      totalPaid: data.reduce((s, r) => s + r.emi, 0),
      totalPrincipal: data.reduce((s, r) => s + r.principal, 0),
      totalInterest: data.reduce((s, r) => s + r.interest, 0),
    };
  }, [schedule, selectedYear]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Monthly Breakdown
          </CardTitle>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-primary/10 rounded-xl p-3 text-center">
            <p className="text-xs text-primary font-medium">Total Paid</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(yearTotals.totalPaid)}</p>
          </div>
          <div className="bg-success/10 rounded-xl p-3 text-center">
            <p className="text-xs text-success font-medium">Principal</p>
            <p className="text-lg font-bold text-success">{formatCurrency(yearTotals.totalPrincipal)}</p>
          </div>
          <div className="bg-destructive/10 rounded-xl p-3 text-center">
            <p className="text-xs text-destructive font-medium">Interest</p>
            <p className="text-lg font-bold text-destructive">{formatCurrency(yearTotals.totalInterest)}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Month</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">EMI</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Principal</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Interest</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Balance</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => (
                <tr key={m.month} className={`border-b last:border-0 hover:bg-accent ${m.isPaid ? 'bg-success/10' : ''}`}>
                  <td className="py-2 px-3 font-medium">{m.monthName} {m.year}</td>
                  <td className="text-right py-2 px-3">{formatCurrency(m.emi)}</td>
                  <td className="text-right py-2 px-3 text-primary">{formatCurrency(m.principal)}</td>
                  <td className="text-right py-2 px-3 text-destructive">{formatCurrency(m.interest)}</td>
                  <td className="text-right py-2 px-3 font-medium">{formatCurrency(m.balance)}</td>
                  <td className="text-center py-2 px-3">
                    {m.isPaid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <BadgeCheck className="h-3 w-3" /> Paid
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Upcoming</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function AggregateCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <CardContent className="p-4">
        <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>{icon}</div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function StatMini({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-muted dark:bg-card rounded-xl p-3 border border-muted">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function AnalyticsCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-destructive' : ''}`}>{value}</span>
    </div>
  );
}
