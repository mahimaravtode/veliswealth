import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiRequest } from '@/lib/api';

const questions = [
  { id: 1, text: "What is your primary investment goal?", options: [{ text: "Capital Preservation", score: 2 }, { text: "Wealth Creation", score: 5 }, { text: "Speculation", score: 8 }] },
  { id: 2, text: "How long do you plan to stay invested?", options: [{ text: "0-2 Years", score: 2 }, { text: "3-5 Years", score: 5 }, { text: "5+ Years", score: 8 }] },
  { id: 3, text: "How would you react to a 20% drop in your portfolio?", options: [{ text: "Sell everything", score: 1 }, { text: "Wait and see", score: 5 }, { text: "Buy more", score: 10 }] },
];

export default function RiskProfiling() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    if (currentStep < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = async (finalAnswers: number[]) => {
    setLoading(true);
    try {
      const data = await apiRequest('/risk/calculate', {
        method: 'POST',
        body: JSON.stringify({ answers: finalAnswers }),
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="text-center">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Your Risk Profile: {result.category}</CardTitle>
            <CardDescription>Based on your answers, we have analyzed your risk appetite.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-card rounded-lg border">
              <span className="font-medium text-muted-foreground">Risk Score</span>
              <span className="text-2xl font-bold text-primary">{result.score}</span>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" /> Recommended Allocation
              </h4>
              <p className="text-sm text-muted-foreground">
                {result.category === 'Aggressive' 
                  ? "80% Equity, 15% Debt, 5% Gold" 
                  : result.category === 'Moderate' 
                  ? "50% Equity, 40% Debt, 10% Gold" 
                  : "20% Equity, 70% Debt, 10% Cash"}
              </p>
            </div>
            <Button className="w-full" onClick={() => {setResult(null); setCurrentStep(0); setAnswers([]);}}>
              Retake Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Risk Profiling</h1>
        <p className="text-muted-foreground">Understanding your risk appetite is the first step to successful investing.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-2 text-xs font-bold text-primary uppercase tracking-wider">
            <span>Question {currentStep + 1} of {questions.length}</span>
            <span>{Math.round(((currentStep + 1) / questions.length) * 100)}% Complete</span>
          </div>
          <CardTitle className="text-xl">{questions[currentStep].text}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {questions[currentStep].options.map((opt, idx) => (
            <Button 
              key={idx} 
              variant="outline" 
              className="h-14 justify-start text-left hover:border-primary hover:bg-primary/5 px-6"
              onClick={() => handleAnswer(opt.score)}
              disabled={loading}
            >
              {opt.text}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
