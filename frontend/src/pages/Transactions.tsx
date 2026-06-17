import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useLoanStore } from '@/store/useLoanStore';
import { useGoalStore } from '@/store/useGoalStore';

interface Transaction {
  id: string;
  date: string;
  type: 'investment' | 'loan' | 'goal' | 'dividend';
  title: string;
  amount: number;
  direction: 'in' | 'out';
  category: string;
}

export default function Transactions() {
  const { holdings } = usePortfolioStore();
  const { loans } = useLoanStore();
  const { goals } = useGoalStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const txns: Transaction[] = [];

    holdings.forEach((h, i) => {
      txns.push({
        id: `inv-${i}`, date: new Date().toISOString(),
        type: 'investment', title: h.schemeName,
        amount: h.units * h.avgNav, direction: 'out',
        category: h.category || 'Equity',
      });
    });

    loans.forEach((l, i) => {
      const tenureMonths = l.tenureType === 'years' ? l.tenure * 12 : l.tenure;
      const monthlyRate = l.interestRate / 12 / 100;
      const emi = monthlyRate === 0 ? l.loanAmount / tenureMonths :
        (l.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);
      txns.push({
        id: `loan-${i}`, date: l.startDate,
        type: 'loan', title: `${l.title} - EMI`,
        amount: Math.round(emi), direction: 'out',
        category: l.loanType,
      });
    });

    goals.forEach((g, i) => {
      (g.contributions || []).forEach((c, j) => {
        txns.push({
          id: `goal-${i}-${j}`, date: c.date,
          type: 'goal', title: `${g.title}${c.note ? ` - ${c.note}` : ''}`,
          amount: c.amount, direction: 'out',
          category: g.category,
        });
      });
    });

    txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(txns);
  }, [holdings, loans, goals]);

  const totalIn = transactions.filter(t => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.direction === 'out').reduce((s, t) => s + t.amount, 0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const typeColors: Record<string, string> = {
    investment: 'bg-primary/10 text-primary',
    loan: 'bg-destructive/10 text-destructive',
    goal: 'bg-success/10 text-success',
    dividend: 'bg-warning/10 text-warning',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">All your financial activities in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg"><TrendingUp className="h-4 w-4 text-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Inflow</p>
              <p className="text-lg font-bold text-success">{formatCurrency(totalIn)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg"><TrendingDown className="h-4 w-4 text-destructive" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Outflow</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(totalOut)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{new Date(t.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${typeColors[t.type]}`}>{t.type}</Badge></TableCell>
                      <TableCell className="font-medium text-sm">{t.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.category}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold flex items-center justify-end gap-1 ${t.direction === 'in' ? 'text-success' : 'text-destructive'}`}>
                          {t.direction === 'in' ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {formatCurrency(t.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
