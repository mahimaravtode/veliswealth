import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import { validate } from '../middleware/validate';
import { chatSchema } from '../middleware/schemas';
import MarketMover from '../models/MarketMover';
import {
  getPortfolioAnalysis,
  chatWithAI,
  predictGoalCompletion,
  getTaxOptimization,
  getPortfolioRebalance,
  gatherFinancialContext,
} from '../services/aiService';
import { callLLMStream, type LLMMessage } from '../services/llmService';

const router = Router();

router.get('/sentiment', auth, async (req: Request, res: Response) => {
  try {
    const movers = await MarketMover.find();

    const bullishCount = movers.filter(m => (m.changePercent || 0) > 0).length;
    const totalCount = movers.length;
    const bullishScore = totalCount > 0 ? Math.round((bullishCount / totalCount) * 100) : 50;

    let summary = "";
    if (bullishScore > 60) {
      summary = "Market is showing strong bullish momentum. Institutional buying seen in large caps.";
    } else if (bullishScore < 40) {
      summary = "Bearish sentiment dominates. Investors are cautious due to global macro headwinds.";
    } else {
      summary = "Neutral market trend. Sideways movement expected in the short term.";
    }

    res.json({
      score: bullishScore,
      sentiment: bullishScore > 60 ? 'Bullish' : bullishScore < 40 ? 'Bearish' : 'Neutral',
      summary,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'AI processing error' });
  }
});

router.get('/portfolio-analysis', auth, async (req: Request, res: Response) => {
  try {
    const analysis = await getPortfolioAnalysis(req.userId!);
    res.json(analysis);
  } catch (error: any) {
    console.error('Portfolio analysis error:', error?.message);
    res.status(500).json({ message: 'Failed to generate portfolio analysis' });
  }
});

router.post('/chat', auth, validate(chatSchema), async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    const response = await chatWithAI(req.userId!, message, history || []);
    res.json({ response, timestamp: new Date() });
  } catch (error: any) {
    console.error('AI chat error:', error?.message, error?.stack);
    res.status(500).json({ message: 'Failed to process your message', error: error?.message });
  }
});

router.post('/chat/stream', auth, validate(chatSchema), async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    const ctx = await gatherFinancialContext(req.userId!);

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

Rules:
1. Always respond in the context of Indian financial planning (use ₹, mention Indian tax laws, SIP, ELSS, PPF, NPS etc.)
2. Be specific with numbers from their actual data
3. Keep responses concise but actionable
4. Format amounts in Indian number system (e.g., ₹1,50,000)`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((h: { role: string; content: string }) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ];

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await callLLMStream(messages, { temperature: 0.7, maxTokens: 1000 });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('AI stream chat error:', error?.message);
    res.write(`data: ${JSON.stringify({ error: 'Failed to process your message' })}\n\n`);
    res.end();
  }
});

router.get('/tax-optimize', auth, async (req: Request, res: Response) => {
  try {
    const taxData = await getTaxOptimization(req.userId!);
    res.json(taxData);
  } catch (error: any) {
    console.error('Tax optimization error:', error?.message);
    res.status(500).json({ message: 'Failed to generate tax optimization' });
  }
});

router.get('/rebalance', auth, async (req: Request, res: Response) => {
  try {
    const rebalanceData = await getPortfolioRebalance(req.userId!);
    res.json(rebalanceData);
  } catch (error: any) {
    console.error('Portfolio rebalance error:', error?.message);
    res.status(500).json({ message: 'Failed to generate rebalance suggestions' });
  }
});

router.post('/predict-goal', auth, async (req: Request, res: Response) => {
  try {
    const { goalId } = req.body;
    const prediction = await predictGoalCompletion(req.userId!, goalId);
    res.json(prediction);
  } catch (error: any) {
    console.error('Goal prediction error:', error?.message);
    res.status(500).json({ message: 'Failed to predict goal completion' });
  }
});

export default router;
