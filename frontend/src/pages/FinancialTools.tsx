import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator, TrendingUp, Landmark, PiggyBank, Target,
  ArrowRight, IndianRupee, Clock, Percent, BadgeCheck
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#14b8a6', '#f59e0b', '#ef4444'];

export default function FinancialTools() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Tools</h1>
        <p className="text-muted-foreground">Calculators and planners to help you make informed decisions.</p>
      </div>

      <Tabs defaultValue="sip" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="sip" className="gap-2 text-xs"><Calculator className="h-4 w-4" /> SIP</TabsTrigger>
          <TabsTrigger value="lumpsum" className="gap-2 text-xs"><Landmark className="h-4 w-4" /> Lumpsum</TabsTrigger>
          <TabsTrigger value="retirement" className="gap-2 text-xs"><PiggyBank className="h-4 w-4" /> Retirement</TabsTrigger>
          <TabsTrigger value="emi" className="gap-2 text-xs"><IndianRupee className="h-4 w-4" /> EMI</TabsTrigger>
          <TabsTrigger value="ppf" className="gap-2 text-xs"><Target className="h-4 w-4" /> PPF/FD</TabsTrigger>
        </TabsList>

        <TabsContent value="sip"><SIPCalculator /></TabsContent>
        <TabsContent value="lumpsum"><LumpsumCalculator /></TabsContent>
        <TabsContent value="retirement"><RetirementPlanner /></TabsContent>
        <TabsContent value="emi"><EMICalculator /></TabsContent>
        <TabsContent value="ppf"><PPFCalculator /></TabsContent>
      </Tabs>
    </div>
  );
}

function SIPCalculator() {
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(10);
  const [returns, setReturns] = useState(12);

  const result = useMemo(() => {
    const r = returns / 12 / 100;
    const n = years * 12;
    const invested = monthly * n;
    const total = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const gains = total - invested;
    return { total: Math.round(total), invested: Math.round(invested), gains: Math.round(gains) };
  }, [monthly, years, returns]);

  const pieData = [
    { name: 'Invested', value: result.invested },
    { name: 'Returns', value: result.gains },
  ];

  const yearlyData = useMemo(() => {
    const r = returns / 12 / 100;
    return Array.from({ length: years }, (_, i) => {
      const n = (i + 1) * 12;
      const total = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      return { year: `Yr ${i + 1}`, invested: monthly * n, value: Math.round(total) };
    });
  }, [monthly, years, returns]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">SIP Investment</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <NumberInput label="Monthly Investment" value={monthly} onChange={setMonthly} min={500} max={500000} step={500} prefix="₹" />
            <NumberInput label="Expected Return" value={returns} onChange={setReturns} min={1} max={30} step={0.5} suffix="%" />
            <NumberInput label="Time Period" value={years} onChange={setYears} min={1} max={40} step={1} suffix=" years" />
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground border-0 shadow-md">
          <CardHeader><CardTitle className="text-primary-foreground">Projected Returns</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
              <span className="text-primary-foreground/70">Total Invested</span>
              <span className="font-bold">{formatCurrency(result.invested)}</span>
            </div>
            <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
              <span className="text-primary-foreground/70">Wealth Gained</span>
              <span className="font-bold text-success">{formatCurrency(result.gains)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-primary-foreground/70 text-lg">Maturity Value</span>
              <span className="text-2xl font-black">{formatCurrency(result.total)}</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Growth Over Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={yearlyData}>
              <defs>
                <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Legend />
              <Area type="monotone" dataKey="invested" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Invested" />
              <Area type="monotone" dataKey="value" stroke="#14b8a6" fill="url(#sipGrad)" strokeWidth={2} name="Value" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function LumpsumCalculator() {
  const [amount, setAmount] = useState(100000);
  const [years, setYears] = useState(10);
  const [returns, setReturns] = useState(12);

  const result = useMemo(() => {
    const total = amount * Math.pow(1 + returns / 100, years);
    const gains = total - amount;
    return { total: Math.round(total), invested: amount, gains: Math.round(gains) };
  }, [amount, years, returns]);

  const pieData = [
    { name: 'Invested', value: result.invested },
    { name: 'Returns', value: result.gains },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Lumpsum Investment</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <NumberInput label="Investment Amount" value={amount} onChange={setAmount} min={10000} max={10000000} step={10000} prefix="₹" />
          <NumberInput label="Expected Return" value={returns} onChange={setReturns} min={1} max={30} step={0.5} suffix="%" />
          <NumberInput label="Time Period" value={years} onChange={setYears} min={1} max={30} step={1} suffix=" years" />
        </CardContent>
      </Card>
      <Card className="bg-primary text-primary-foreground border-0 shadow-md">
        <CardHeader><CardTitle className="text-primary-foreground">Projected Returns</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
            <span className="text-primary-foreground/70">Invested Amount</span>
            <span className="font-bold">{formatCurrency(result.invested)}</span>
          </div>
          <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
            <span className="text-primary-foreground/70">Estimated Returns</span>
            <span className="font-bold text-success">{formatCurrency(result.gains)}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-primary-foreground/70 text-lg">Total Value</span>
            <span className="text-2xl font-black">{formatCurrency(result.total)}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function RetirementPlanner() {
  const [age, setAge] = useState(30);
  const [retireAge, setRetireAge] = useState(60);
  const [monthlyExpense, setMonthlyExpense] = useState(50000);
  const [returns, setReturns] = useState(8);
  const [inflation, setInflation] = useState(6);

  const result = useMemo(() => {
    const yearsToRetire = retireAge - age;
    const yearsAfterRetire = 25;
    const futureExpense = monthlyExpense * Math.pow(1 + inflation / 100, yearsToRetire);
    const corpusNeeded = futureExpense * 12 * yearsAfterRetire * ((1 - Math.pow(1 + inflation / 100, yearsAfterRetire) * Math.pow(1 + returns / 100, -yearsAfterRetire)) / (1 - (1 + inflation / 100) / (1 + returns / 100)));
    const monthlyNeeded = returns > 0 ? (corpusNeeded * (returns / 12 / 100)) / (Math.pow(1 + returns / 12 / 100, yearsToRetire * 12) - 1) : 0;
    return {
      corpusNeeded: Math.round(corpusNeeded),
      monthlyNeeded: Math.round(monthlyNeeded),
      futureExpense: Math.round(futureExpense),
      yearsToRetire,
    };
  }, [age, retireAge, monthlyExpense, returns, inflation]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Retirement Planning</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <NumberInput label="Current Age" value={age} onChange={setAge} min={18} max={60} step={1} suffix=" years" />
          <NumberInput label="Retirement Age" value={retireAge} onChange={setRetireAge} min={age + 1} max={80} step={1} suffix=" years" />
          <NumberInput label="Monthly Expenses" value={monthlyExpense} onChange={setMonthlyExpense} min={10000} max={500000} step={5000} prefix="₹" />
          <NumberInput label="Expected Returns" value={returns} onChange={setReturns} min={1} max={15} step={0.5} suffix="%" />
          <NumberInput label="Inflation Rate" value={inflation} onChange={setInflation} min={1} max={12} step={0.5} suffix="%" />
        </CardContent>
      </Card>
      <Card className="bg-primary text-primary-foreground border-0 shadow-md">
        <CardHeader><CardTitle className="text-primary-foreground">Retirement Plan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
            <span className="text-primary-foreground/70">Years to Retire</span>
            <span className="font-bold">{result.yearsToRetire} years</span>
          </div>
          <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
            <span className="text-primary-foreground/70">Future Monthly Expense</span>
            <span className="font-bold">{formatCurrency(result.futureExpense)}</span>
          </div>
          <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
            <span className="text-primary-foreground/70">Corpus Needed</span>
            <span className="font-bold">{formatCurrency(result.corpusNeeded)}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-primary-foreground/70 text-lg">Monthly SIP Needed</span>
            <span className="text-2xl font-black">{formatCurrency(result.monthlyNeeded)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EMICalculator() {
  const [principal, setPrincipal] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);

  const result = useMemo(() => {
    const r = rate / 12 / 100;
    const n = tenure * 12;
    const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - principal;
    return { emi: Math.round(emi), totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalInterest) };
  }, [principal, rate, tenure]);

  const pieData = [
    { name: 'Principal', value: principal },
    { name: 'Interest', value: result.totalInterest },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">EMI Calculator</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <NumberInput label="Loan Amount" value={principal} onChange={setPrincipal} min={100000} max={50000000} step={100000} prefix="₹" />
          <NumberInput label="Interest Rate" value={rate} onChange={setRate} min={1} max={20} step={0.1} suffix="%" />
          <NumberInput label="Loan Tenure" value={tenure} onChange={setTenure} min={1} max={30} step={1} suffix=" years" />
        </CardContent>
      </Card>
      <Card className="bg-primary text-primary-foreground border-0 shadow-md">
        <CardHeader><CardTitle className="text-primary-foreground">EMI Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
            <span className="text-primary-foreground/70">Loan Amount</span>
            <span className="font-bold">{formatCurrency(principal)}</span>
          </div>
          <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
            <span className="text-primary-foreground/70">Total Interest</span>
            <span className="font-bold text-warning">{formatCurrency(result.totalInterest)}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-primary-foreground/70 text-lg">Monthly EMI</span>
            <span className="text-2xl font-black">{formatCurrency(result.emi)}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function PPFCalculator() {
  const [annual, setAnnual] = useState(150000);
  const [rate, setRate] = useState(7.1);
  const [years, setYears] = useState(15);

  const result = useMemo(() => {
    const r = rate / 100;
    let balance = 0;
    const data = [];
    for (let i = 1; i <= years; i++) {
      balance = (balance + annual) * (1 + r);
      data.push({ year: `Yr ${i}`, balance: Math.round(balance), invested: annual * i });
    }
    return {
      maturity: Math.round(balance),
      invested: annual * years,
      interest: Math.round(balance - annual * years),
      data,
    };
  }, [annual, rate, years]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle className="text-base">PPF / FD Calculator</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <NumberInput label="Annual Investment" value={annual} onChange={setAnnual} min={500} max={150000} step={500} prefix="₹" />
            <NumberInput label="Interest Rate" value={rate} onChange={setRate} min={1} max={12} step={0.1} suffix="%" />
            <NumberInput label="Time Period" value={years} onChange={setYears} min={1} max={30} step={1} suffix=" years" />
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground border-0 shadow-md">
          <CardHeader><CardTitle className="text-primary-foreground">Maturity Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
              <span className="text-primary-foreground/70">Total Invested</span>
              <span className="font-bold">{formatCurrency(result.invested)}</span>
            </div>
            <div className="flex justify-between border-b border-primary-foreground/20 pb-3">
              <span className="text-primary-foreground/70">Interest Earned</span>
              <span className="font-bold text-success">{formatCurrency(result.interest)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-primary-foreground/70 text-lg">Maturity Value</span>
              <span className="text-2xl font-black">{formatCurrency(result.maturity)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-md">
        <CardHeader><CardTitle className="text-base">Growth Over Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={result.data}>
              <defs>
                <linearGradient id="ppfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Legend />
              <Area type="monotone" dataKey="invested" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Invested" />
              <Area type="monotone" dataKey="balance" stroke="#14b8a6" fill="url(#ppfGrad)" strokeWidth={2} name="Balance" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function SliderInput({ label, value, onChange, min, max, step, prefix = '', suffix = '' }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; prefix?: string; suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-bold text-primary">{prefix}{value.toLocaleString()}{suffix}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step, prefix = '', suffix = '' }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; prefix?: string; suffix?: string;
}) {
  const handleChange = (valueStr: string) => {
    const parsed = Number(valueStr.replace(/[^0-9.-]/g, ''));
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(Math.max(parsed, min), max);
    onChange(clamped);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-bold text-primary">{prefix}{value.toLocaleString()}{suffix}</span>
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}
