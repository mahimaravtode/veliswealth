import Portfolio from '../models/Portfolio';
import MFPortfolio from '../models/MFPortfolio';
import Asset from '../models/Asset';
import Goal from '../models/Goal';
import Loan from '../models/Loan';
import Insurance from '../models/Insurance';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { callLLM, parseJSONResponse, type LLMMessage } from './llmService';
import { cache, getCacheKey, CACHE_TTL } from './cacheService';

interface FinancialContext {
  user: { name: string; email: string; riskProfile?: { category?: string; score?: number } };
  portfolio: any;
  mfPortfolio: any;
  assets: any[];
  goals: any[];
  loans: any[];
  insurance: any[];
  recentTransactions: any[];
  netWorth: { totalAssets: number; totalLiabilities: number; netWorth: number };
  transactionSummary: { monthIncome: number; monthExpense: number; monthSavings: number; monthSavingsRate: number };
}

export async function gatherFinancialContext(userId: string): Promise<FinancialContext> {
  const [user, portfolio, mfPortfolio, assets, goals, loans, insurance, transactions] = await Promise.all([
    User.findById(userId).select('-password'),
    Portfolio.findOne({ userId }),
    MFPortfolio.findOne({ user: userId }),
    Asset.find({ userId }),
    Goal.find({ userId }),
    Loan.find({ userId }),
    Insurance.find({ userId }),
    Transaction.find({ userId }).sort({ date: -1 }).limit(20),
  ]);

  let totalAssets = 0;
  let totalLiabilities = 0;
  assets.forEach((a: any) => {
    if (a.category === 'Asset') totalAssets += a.currentValue;
    else totalLiabilities += a.currentValue;
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTransactions = await Transaction.find({ userId, date: { $gte: startOfMonth } });

  let monthIncome = 0, monthExpense = 0, monthInvestment = 0;
  for (const t of monthTransactions) {
    if (t.direction === 'in') monthIncome += t.amount;
    else if (t.type === 'investment') monthInvestment += t.amount;
    else monthExpense += t.amount;
  }

  return {
    user: { name: user?.name || 'User', email: user?.email || '', riskProfile: user?.riskProfile },
    portfolio,
    mfPortfolio,
    assets,
    goals,
    loans,
    insurance,
    recentTransactions: transactions,
    netWorth: { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities },
    transactionSummary: {
      monthIncome,
      monthExpense,
      monthSavings: monthIncome - monthExpense - monthInvestment,
      monthSavingsRate: monthIncome > 0 ? ((monthIncome - monthExpense - monthInvestment) / monthIncome) * 100 : 0,
    },
  };
}

function buildPortfolioAnalysisPrompt(ctx: FinancialContext): string {
  return `You are an expert Indian financial advisor AI. Analyze the following user's complete financial profile and provide personalized, actionable investment recommendations. All amounts are in Indian Rupees (INR).

USER PROFILE:
- Name: ${ctx.user.name}
- Risk Profile: ${ctx.user.riskProfile?.category || 'Not assessed'} (Score: ${ctx.user.riskProfile?.score || 'N/A'})

NET WORTH:
- Total Assets: ₹${ctx.netWorth.totalAssets.toLocaleString('en-IN')}
- Total Liabilities: ₹${ctx.netWorth.totalLiabilities.toLocaleString('en-IN')}
- Net Worth: ₹${ctx.netWorth.netWorth.toLocaleString('en-IN')}

MF PORTFOLIO:
${ctx.mfPortfolio ? `Total Invested: ₹${ctx.mfPortfolio.totalInvested?.toLocaleString('en-IN') || 0}
Current Value: ₹${ctx.mfPortfolio.currentValue?.toLocaleString('en-IN') || 0}
Returns: ₹${ctx.mfPortfolio.totalReturns?.toLocaleString('en-IN') || 0} (${ctx.mfPortfolio.totalReturnsPercent?.toFixed(2) || 0}%)
Holdings: ${ctx.mfPortfolio.holdings?.map((h: any) => `${h.schemeName} (${h.category || 'Unknown'}) - ₹${h.currentValue?.toLocaleString('en-IN') || 0} (${h.returnsPercent?.toFixed(2) || 0}%)`).join(', ') || 'None'}` : 'No MF portfolio found'}

SIMPLE PORTFOLIO:
${ctx.portfolio ? `Total Invested: ₹${ctx.portfolio.summary?.totalInvested?.toLocaleString('en-IN') || 0}
Current Value: ₹${ctx.portfolio.summary?.currentValue?.toLocaleString('en-IN') || 0}` : 'No portfolio found'}

ASSETS & LIABILITIES:
${ctx.assets.map((a: any) => `- ${a.name} (${a.type}): ₹${a.currentValue.toLocaleString('en-IN')} [${a.category}]`).join('\n') || 'None listed'}

GOALS:
${ctx.goals.map((g: any) => `- ${g.title}: Target ₹${g.targetAmount.toLocaleString('en-IN')}, Current ₹${g.currentAmount?.toLocaleString('en-IN') || 0}, Monthly ₹${g.monthlyContribution?.toLocaleString('en-IN') || 0}, Status: ${g.status || 'Active'}`).join('\n') || 'No goals set'}

LOANS:
${ctx.loans.map((l: any) => `- ${l.title} (${l.loanType || 'Unknown'}): ₹${l.loanAmount.toLocaleString('en-IN')} @ ${l.interestRate}% for ${l.tenure}${l.tenureType || 'years'}, EMIs paid: ${l.emiPaid || 0}`).join('\n') || 'No loans'}

INSURANCE:
${ctx.insurance.map((i: any) => `- ${i.policyName} (${i.type}): Premium ₹${i.premiumAmount?.toLocaleString('en-IN') || 0}, Sum Assured ₹${i.sumAssured?.toLocaleString('en-IN') || 0}`).join('\n') || 'No insurance'}

MONTHLY FINANCES:
- Income: ₹${ctx.transactionSummary.monthIncome.toLocaleString('en-IN')}
- Expenses: ₹${ctx.transactionSummary.monthExpense.toLocaleString('en-IN')}
- Savings: ₹${ctx.transactionSummary.monthSavings.toLocaleString('en-IN')}
- Savings Rate: ${ctx.transactionSummary.monthSavingsRate.toFixed(1)}%

Provide your analysis in the following JSON format:
{
  "score": <0-100 financial health score>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendations": [
    {
      "title": "<recommendation title>",
      "description": "<detailed actionable recommendation>",
      "priority": "high|medium|low",
      "category": "portfolio|insurance|savings|goals|debt|tax"
    }
  ],
  "allocation": {
    "suggested": {
      "equity": <percentage>,
      "debt": <percentage>,
      "gold": <percentage>,
      "cash": <percentage>
    }
  }
}

Be specific with numbers. Reference their actual data. Give actionable advice suitable for the Indian market context.`;
}

export async function getPortfolioAnalysis(userId: string) {
  const cacheKey = getCacheKey('portfolio-analysis', userId);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const ctx = await gatherFinancialContext(userId);

  const messages: LLMMessage[] = [
    { role: 'system', content: 'You are FinLeap AI, an expert Indian financial advisor. Respond ONLY with valid JSON.' },
    { role: 'user', content: buildPortfolioAnalysisPrompt(ctx) },
  ];

  const response = await callLLM(messages, { temperature: 0.7, maxTokens: 2000 });

  const result = parseJSONResponse(response.content, {
    score: 50,
    summary: response.content,
    strengths: [],
    weaknesses: [],
    recommendations: [],
    allocation: { suggested: { equity: 60, debt: 30, gold: 5, cash: 5 } },
  });

  cache.set(cacheKey, result, CACHE_TTL.PORTFOLIO_ANALYSIS);
  return result;
}

export async function chatWithAI(userId: string, message: string, history: { role: 'user' | 'assistant'; content: string }[] = []) {
  const ctx = await gatherFinancialContext(userId);

  const systemPrompt = `You are FinLeap AI, an intelligent financial advisor chatbot for Indian users. You have access to the user's complete financial data and can answer questions about their finances, provide advice, and help with planning.

CURRENT FINANCIAL SNAPSHOT:
- Net Worth: ₹${ctx.netWorth.netWorth.toLocaleString('en-IN')}
- Monthly Income: ₹${ctx.transactionSummary.monthIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${ctx.transactionSummary.monthExpense.toLocaleString('en-IN')}
- Savings Rate: ${ctx.transactionSummary.monthSavingsRate.toFixed(1)}%
- Risk Profile: ${ctx.user.riskProfile?.category || 'Not assessed'}
- Goals: ${ctx.goals.length} active goal(s)
- Loans: ${ctx.loans.length} active loan(s)
- Insurance: ${ctx.insurance.length} policy(ies)
- MF Holdings: ${ctx.mfPortfolio?.holdings?.length || 0} fund(s)
- Portfolio Value: ₹${(ctx.mfPortfolio?.currentValue || ctx.portfolio?.summary?.currentValue || 0).toLocaleString('en-IN')}

DETAILED DATA:
Goals: ${JSON.stringify(ctx.goals.map((g: any) => ({ title: g.title, target: g.targetAmount, current: g.currentAmount, monthly: g.monthlyContribution })))}
Loans: ${JSON.stringify(ctx.loans.map((l: any) => ({ title: l.title, amount: l.loanAmount, rate: l.interestRate, tenure: l.tenure, type: l.loanType })))}
Insurance: ${JSON.stringify(ctx.insurance.map((i: any) => ({ name: i.policyName, type: i.type, premium: i.premiumAmount, sumAssured: i.sumAssured })))}
Assets: ${JSON.stringify(ctx.assets.map((a: any) => ({ name: a.name, type: a.type, value: a.currentValue, category: a.category })))}

Rules:
1. Always respond in the context of Indian financial planning (use ₹, mention Indian tax laws, SIP, ELSS, PPF, NPS etc.)
2. Be specific with numbers from their actual data
3. Keep responses concise but actionable
4. If you don't have enough data to answer, say so and suggest what they should add
5. Never make up financial data - only use what's provided above
6. Format amounts in Indian number system (e.g., ₹1,50,000)`;

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user', content: message },
  ];

  const response = await callLLM(messages, { temperature: 0.7, maxTokens: 1000 });
  return response.content || 'I apologize, but I could not process your request. Please try again.';
}

export async function predictGoalCompletion(userId: string, goalId: string) {
  const ctx = await gatherFinancialContext(userId);
  const goal = ctx.goals.find((g: any) => g._id.toString() === goalId);

  if (!goal) {
    throw new Error('Goal not found');
  }

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: 'You are a financial planning AI. Analyze goal data and predict completion timeline. Respond ONLY with valid JSON.'
    },
    {
      role: 'user',
      content: `Analyze this financial goal and predict when it will be completed based on the user's current financial situation.

GOAL DETAILS:
- Title: ${goal.title}
- Target Amount: ₹${goal.targetAmount.toLocaleString('en-IN')}
- Current Amount: ₹${goal.currentAmount?.toLocaleString('en-IN') || 0}
- Monthly Contribution: ₹${goal.monthlyContribution?.toLocaleString('en-IN') || 0}
- Target Date: ${goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-IN') : 'Not set'}
- Category: ${goal.category}
- Priority: ${goal.priority}

USER'S FINANCIAL CONTEXT:
- Monthly Income: ₹${ctx.transactionSummary.monthIncome.toLocaleString('en-IN')}
- Monthly Savings: ₹${ctx.transactionSummary.monthSavings.toLocaleString('en-IN')}
- Savings Rate: ${ctx.transactionSummary.monthSavingsRate.toFixed(1)}%
- Risk Profile: ${ctx.user.riskProfile?.category || 'Not assessed'}

Respond in this JSON format:
{
  "predictedDate": "<YYYY-MM-DD>",
  "monthsRemaining": <number>,
  "onTrack": <boolean>,
  "confidence": "high|medium|low",
  "currentPace": "<description of current savings pace>",
  "recommendations": [
    {
      "action": "<specific action>",
      "impact": "<how much faster it helps>",
      "priority": "high|medium|low"
    }
  ],
  "scenarios": {
    "current": { "months": <number>, "date": "<YYYY-MM-DD>" },
    "increase20": { "months": <number>, "date": "<YYYY-MM-DD>" },
    "increase50": { "months": <number>, "date": "<YYYY-MM-DD>" }
  }
}`
    }
  ];

  const response = await callLLM(messages, { temperature: 0.5, maxTokens: 1500 });

  return parseJSONResponse(response.content, {
    predictedDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : 'Not calculated',
    monthsRemaining: 0,
    onTrack: false,
    confidence: 'low',
    currentPace: 'Insufficient data',
    recommendations: [],
    scenarios: { current: { months: 0, date: '' }, increase20: { months: 0, date: '' }, increase50: { months: 0, date: '' } }
  });
}

export async function getTaxOptimization(userId: string) {
  const cacheKey = getCacheKey('tax-optimize', userId);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const ctx = await gatherFinancialContext(userId);

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: 'You are an expert Indian tax advisor specializing in income tax optimization. Respond ONLY with valid JSON.'
    },
    {
      role: 'user',
      content: `Analyze the user's financial situation and provide tax optimization suggestions for the Indian financial year 2025-26.

USER FINANCIAL DATA:
- Monthly Income: ₹${ctx.transactionSummary.monthIncome.toLocaleString('en-IN')}
- Annual Income (estimated): ₹${(ctx.transactionSummary.monthIncome * 12).toLocaleString('en-IN')}
- Monthly Expenses: ₹${ctx.transactionSummary.monthExpense.toLocaleString('en-IN')}
- Risk Profile: ${ctx.user.riskProfile?.category || 'Not assessed'}

MF HOLDINGS:
${ctx.mfPortfolio?.holdings?.map((h: any) => `- ${h.schemeName} (${h.category}): ₹${h.currentValue?.toLocaleString('en-IN') || 0}`).join('\n') || 'No MF holdings'}

INSURANCE:
${ctx.insurance.map((i: any) => `- ${i.policyName} (${i.type}): Premium ₹${i.premiumAmount?.toLocaleString('en-IN') || 0}, Sum Assured ₹${i.sumAssured?.toLocaleString('en-IN') || 0}`).join('\n') || 'No insurance'}

GOALS:
${ctx.goals.map((g: any) => `- ${g.title}: ₹${g.targetAmount.toLocaleString('en-IN')}`).join('\n') || 'No goals'}

Provide tax optimization advice in this JSON format:
{
  "oldRegime": {
    "totalDeductions": <number>,
    "estimatedTax": <number>,
    "savings": <number>
  },
  "newRegime": {
    "estimatedTax": <number>,
    "standardDeduction": 75000
  },
  "recommendedRegime": "old|new",
  "recommendations": [
    {
      "section": "80C|80D|80E|80G|NPS|ELSS|PPF|other",
      "action": "<specific action>",
      "currentInvestment": <number>,
      "maxAllowed": <number>,
      "potentialSaving": <number>,
      "priority": "high|medium|low",
      "description": "<detailed explanation>"
    }
  ],
  "elssSuggestions": [
    {
      "name": "<fund name>",
      "category": "<category>",
      "returns3y": "<percentage>",
      "risk": "low|moderate|high"
    }
  ],
  "monthlyPlan": {
    "ppf": <number>,
    "elss": <number>,
    "nps": <number>,
    "insurance": <number>,
    "total": <number>
  }
}`
    }
  ];

  const response = await callLLM(messages, { temperature: 0.5, maxTokens: 2000 });

  const result = parseJSONResponse(response.content, {
    oldRegime: { totalDeductions: 0, estimatedTax: 0, savings: 0 },
    newRegime: { estimatedTax: 0, standardDeduction: 75000 },
    recommendedRegime: 'new',
    recommendations: [],
    elssSuggestions: [],
    monthlyPlan: { ppf: 0, elss: 0, nps: 0, insurance: 0, total: 0 }
  });

  cache.set(cacheKey, result, CACHE_TTL.TAX_OPTIMIZATION);
  return result;
}

export async function getPortfolioRebalance(userId: string) {
  const cacheKey = getCacheKey('rebalance', userId);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const ctx = await gatherFinancialContext(userId);

  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: 'You are a portfolio management expert. Analyze the portfolio and suggest rebalancing. Respond ONLY with valid JSON.'
    },
    {
      role: 'user',
      content: `Analyze this user's portfolio allocation and suggest rebalancing based on their risk profile and goals.

RISK PROFILE: ${ctx.user.riskProfile?.category || 'Not assessed'} (Score: ${ctx.user.riskProfile?.score || 'N/A'})

CURRENT HOLDINGS:
${ctx.mfPortfolio?.holdings?.map((h: any) => `- ${h.schemeName}: ₹${h.currentValue?.toLocaleString('en-IN') || 0} (${h.category || 'Unknown'})`).join('\n') || 'No MF holdings'}

ASSET ALLOCATION:
${ctx.assets.map((a: any) => `- ${a.name} (${a.type}): ₹${a.currentValue.toLocaleString('en-IN')}`).join('\n') || 'No assets listed'}

GOALS: ${ctx.goals.map((g: any) => g.title).join(', ') || 'No goals'}
LOANS: ${ctx.loans.map((l: any) => `${l.title} (${l.loanType})`).join(', ') || 'No loans'}

Respond in this JSON format:
{
  "currentAllocation": {
    "equity": <percentage>,
    "debt": <percentage>,
    "gold": <percentage>,
    "cash": <percentage>
  },
  "targetAllocation": {
    "equity": <percentage>,
    "debt": <percentage>,
    "gold": <percentage>,
    "cash": <percentage>
  },
  "needsRebalancing": <boolean>,
  "rebalancingActions": [
    {
      "action": "buy|sell|hold",
      "fund": "<fund name>",
      "currentValue": <number>,
      "targetValue": <number>,
      "difference": <number>,
      "reason": "<explanation>"
    }
  ],
  "riskAssessment": "<overall risk assessment>",
  "suggestions": [
    {
      "title": "<suggestion title>",
      "description": "<detailed suggestion>",
      "impact": "<expected impact>",
      "priority": "high|medium|low"
    }
  ]
}`
    }
  ];

  const response = await callLLM(messages, { temperature: 0.5, maxTokens: 1500 });

  const result = parseJSONResponse(response.content, {
    currentAllocation: { equity: 0, debt: 0, gold: 0, cash: 0 },
    targetAllocation: { equity: 60, debt: 30, gold: 5, cash: 5 },
    needsRebalancing: false,
    rebalancingActions: [],
    riskAssessment: 'Insufficient data',
    suggestions: []
  });

  cache.set(cacheKey, result, CACHE_TTL.REBALANCE);
  return result;
}
