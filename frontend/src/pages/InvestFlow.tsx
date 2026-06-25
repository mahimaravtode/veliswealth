import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, CreditCard, Landmark, ShieldCheck } from "lucide-react";

export default function InvestFlow() {
  const [step, setStep] = useState(1);
  const [amount, setMonthly] = useState(5000);
  
  const fund = { name: "Quant Small Cap Fund", category: "Equity", risk: "Very High" };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invest in {fund.name}</h1>
        <p className="text-muted-foreground">Follow 3 easy steps to complete your paperless investment.</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex justify-between items-center mb-8 relative">
        <StepNode active={step >= 1} current={step === 1} label="Amount" number={1} />
        <div className={`h-1 flex-1 mx-4 rounded ${step > 1 ? 'bg-primary' : 'bg-border'}`} />
        <StepNode active={step >= 2} current={step === 2} label="Payment" number={2} />
        <div className={`h-1 flex-1 mx-4 rounded ${step > 2 ? 'bg-primary' : 'bg-border'}`} />
        <StepNode active={step >= 3} current={step === 3} label="Confirm" number={3} />
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Investment Details</CardTitle>
            <CardDescription>Choose your monthly SIP amount.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly SIP Amount (₹)</label>
              <Input type="number" value={amount} onChange={(e) => setMonthly(Number(e.target.value))} className="text-2xl font-bold h-16" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1000, 5000, 10000].map(val => (
                <Button key={val} variant="outline" onClick={() => setMonthly(val)}>+ ₹{val.toLocaleString()}</Button>
              ))}
            </div>
            <Button className="w-full h-12" onClick={() => setStep(2)}>Continue to Payment <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
            <CardDescription>Secure paperless mandate via UPI or Net Banking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <PaymentOption icon={<CreditCard className="h-5 w-5" />} title="UPI Autopay" desc="Instant setup via GPay, PhonePe" />
             <PaymentOption icon={<Landmark className="h-5 w-5" />} title="Net Banking" desc="Secure authentication via Bank" />
             <Button className="w-full h-12 mt-6" onClick={() => setStep(3)}>Verify & Pay ₹{amount.toLocaleString()}</Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="pt-10 pb-10 text-center space-y-6">
            <div className="h-20 w-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-success">Investment Successful!</h2>
              <p className="text-success/80">Your SIP of ₹{amount.toLocaleString()} has been scheduled.</p>
            </div>
            <div className="text-sm text-muted-foreground max-w-sm mx-auto">
              Folio number will be generated within 2-3 business days. You can track this in your portfolio dashboard.
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepNode({ active, current, label, number }: any) {
  return (
    <div className="flex flex-col items-center gap-2 z-10">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition-colors ${active ? 'bg-primary text-white' : 'bg-border text-muted-foreground'} ${current ? 'ring-4 ring-primary/20' : ''}`}>
        {number}
      </div>
      <span className={`text-xs font-bold ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}

function PaymentOption({ icon, title, desc }: any) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors group">
      <div className="p-2 bg-muted rounded group-hover:bg-primary/10 group-hover:text-primary">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="h-4 w-4 rounded-full border border-border group-hover:border-primary group-hover:bg-primary" />
    </div>
  );
}
