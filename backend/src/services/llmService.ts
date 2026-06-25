export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

function buildLocalResponse(userMessage: string, systemPrompt: string): string {
  const msg = userMessage.toLowerCase();

  const ctxMatch = systemPrompt.match(/CURRENT FINANCIAL SNAPSHOT:\n([\s\S]*?)(?:\n\nRules:|$)/);
  const ctx = ctxMatch ? ctxMatch[1] : '';

  const netWorthMatch = ctx.match(/Net Worth: ₹([\d,]+)/);
  const incomeMatch = ctx.match(/Monthly Income: ₹([\d,]+)/);
  const savingsRateMatch = ctx.match(/Savings Rate: ([\d.]+)%/);
  const riskMatch = ctx.match(/Risk Profile: (\w+)/);
  const goalsMatch = ctx.match(/Goals: (\d+)/);
  const loansMatch = ctx.match(/Loans: (\d+)/);
  const insuranceMatch = ctx.match(/Insurance: (\d+)/);
  const mfMatch = ctx.match(/MF Holdings: (\d+)/);

  const netWorth = netWorthMatch ? netWorthMatch[1] : '0';
  const income = incomeMatch ? incomeMatch[1] : '0';
  const savingsRate = savingsRateMatch ? parseFloat(savingsRateMatch[1]) : 0;
  const risk = riskMatch ? riskMatch[1] : 'Not Set';
  const goals = goalsMatch ? parseInt(goalsMatch[1]) : 0;
  const loans = loansMatch ? parseInt(loansMatch[1]) : 0;
  const insurance = insuranceMatch ? parseInt(insuranceMatch[1]) : 0;
  const mfHoldings = mfMatch ? parseInt(mfMatch[1]) : 0;

  if (msg.includes('diversif') || msg.includes('portfolio') || msg.includes('allocat')) {
    let response = `Based on your financial profile, here's my diversification advice:\n\n`;
    response += `📊 **Your Current Snapshot:**\n`;
    response += `• Net Worth: ₹${netWorth}\n`;
    response += `• Risk Profile: ${risk}\n`;
    response += `• MF Holdings: ${mfHoldings} fund(s)\n\n`;

    if (risk === 'Conservative') {
      response += `**Recommended Allocation (Conservative):**\n`;
      response += `• 30-40% Equity (Large Cap Index Funds)\n`;
      response += `• 40-50% Debt (PPF, Debt Funds, FDs)\n`;
      response += `• 10% Gold (Gold ETF/SGB)\n`;
      response += `• 5-10% Cash (Liquid Funds)\n\n`;
      response += `Consider: SBI Nifty 50 Index Fund, PPF, and a Liquid Fund for emergency corpus.`;
    } else if (risk === 'Aggressive') {
      response += `**Recommended Allocation (Aggressive):**\n`;
      response += `• 60-70% Equity (Multi-cap, Mid-cap, Small-cap)\n`;
      response += `• 15-20% Debt (Short duration funds)\n`;
      response += `• 10% Gold (Gold ETF/SGB)\n`;
      response += `• 5% Cash\n\n`;
      response += `Consider: Flexi Cap funds, Mid Cap Index Fund, and Small Cap funds for wealth creation.`;
    } else {
      response += `**Recommended Allocation (Moderate):**\n`;
      response += `• 50-60% Equity (Balanced Advantage, Large & Mid Cap)\n`;
      response += `• 25-30% Debt (PPF, Corporate Bond Funds)\n`;
      response += `• 10% Gold (Gold ETF/SGB)\n`;
      response += `• 5% Cash (Liquid Fund)\n\n`;
      response += `Consider: Balanced Advantage Fund, Nifty 50 Index Fund, and PPF for stable growth.`;
    }
    return response;
  }

  if (msg.includes('health') || msg.includes('score') || msg.includes('how am i doing')) {
    let score = 50;
    const feedback: string[] = [];

    if (savingsRate > 30) { score += 20; feedback.push(`Excellent savings rate of ${savingsRate.toFixed(1)}%`); }
    else if (savingsRate > 20) { score += 10; feedback.push(`Good savings rate of ${savingsRate.toFixed(1)}%`); }
    else if (savingsRate > 0) { feedback.push(`Savings rate is ${savingsRate.toFixed(1)}% — aim for 20%+`); }

    if (insurance > 0) { score += 10; feedback.push(`Good — you have ${insurance} insurance policy(ies)`); }
    else { feedback.push(`⚠️ No insurance found. Consider health insurance (min ₹5L cover)`); }

    if (goals > 0) { score += 10; feedback.push(`You have ${goals} active goal(s) — great planning!`); }
    else { feedback.push(`No financial goals set. Create goals to stay motivated.`); }

    if (loans > 0) { feedback.push(`Active loan(s) — focus on prepayment if rates are high (>10%)`); }

    return `🏥 **Financial Health Score: ${Math.min(score, 100)}/100**\n\n${feedback.map(f => `• ${f}`).join('\n')}\n\n💡 **Tip:** ${savingsRate < 20 ? 'Try to increase your savings rate to at least 20% of income.' : 'Your savings habits look solid. Consider investing surplus in diversified funds.'}`;
  }

  if (msg.includes('loan') || msg.includes('emi') || msg.includes('prepay')) {
    let response = `💰 **Loan Advisory:**\n\n`;
    if (loans === 0) {
      response += `You currently have no active loans. Great financial health!\n\n`;
      response += `If you're planning to take a loan, remember:\n`;
      response += `• Home loan: Keep EMI under 40% of income\n`;
      response += `• Personal loan: Avoid if possible (high interest)\n`;
      response += `• Car loan: Max 5-year tenure`;
    } else {
      response += `You have ${loans} active loan(s). Key tips:\n\n`;
      response += `• **Prepay aggressively** if interest rate > 10% p.a.\n`;
      response += `• **Use windfalls** (bonus, tax refund) for lumpsum prepayment\n`;
      response += `• **Increase EMI by 10%** annually — saves years of interest\n`;
      response += `• **Tax benefit:** Home loan interest up to ₹2L under Section 24\n\n`;
      response += `Use the Loan Tracker page to simulate EMI changes and early closure savings.`;
    }
    return response;
  }

  if (msg.includes('goal') || msg.includes('saving') || msg.includes('target')) {
    let response = `🎯 **Goal Planning:**\n\n`;
    if (goals === 0) {
      response += `You don't have any goals set yet. Creating goals helps you stay focused!\n\n`;
      response += `**Popular goals to consider:**\n`;
      response += `• Emergency Fund: 6-12 months of expenses\n`;
      response += `• Retirement: Start SIP early, aim for ₹5-10Cr corpus\n`;
      response += `• Home Purchase: Start saving 20% of property value\n`;
      response += `• Child's Education: ₹20-50L depending on timeline`;
    } else {
      response += `You have ${goals} active goal(s). Keep contributing regularly!\n\n`;
      response += `**Pro tips:**\n`;
      response += `• Automate monthly contributions via SIP\n`;
      response += `• Review goals quarterly and adjust amounts\n`;
      response += `• Use step-up SIP: Increase by 10% each year`;
    }
    return response;
  }

  if (msg.includes('insur')) {
    let response = `🛡️ **Insurance Advisory:**\n\n`;
    if (insurance === 0) {
      response += `⚠️ **No insurance policies found!** This is critical.\n\n`;
      response += `**Must-have insurance:**\n`;
      response += `• **Health Insurance:** ₹5-10L cover (family floater)\n`;
      response += `• **Term Life Insurance:** 10-15x annual income\n`;
      response += `• **Personal Accident:** ₹25-50L cover\n\n`;
      response += `**Estimated annual cost:** ₹15,000-25,000 for health + ₹8,000-12,000 for term life (30-year-old).`;
    } else {
      response += `You have ${insurance} policy(ies). Ensure:\n`;
      response += `• Health cover is at least ₹5L (₹10L recommended)\n`;
      response += `• Term cover is 10-15x your annual income\n`;
      response += `• Review and increase sum assured every 3-5 years`;
    }
    return response;
  }

  if (msg.includes('tax') || msg.includes('save tax') || msg.includes('80c')) {
    return `🧾 **Tax Saving Guide (FY 2025-26):**\n\n` +
      `**Old Regime Deductions:**\n` +
      `• Section 80C: ₹1.5L (PPF, ELSS, EPF, Life Insurance)\n` +
      `• Section 80D: ₹25K (Health) + ₹50K (Parents)\n` +
      `• NPS: Additional ₹50K under 80CCD(1B)\n` +
      `• Home Loan Interest: Up to ₹2L under Section 24\n\n` +
      `**Best ELSS Funds:**\n` +
      `• Mirae Asset ELSS Tax Saver\n` +
      `• Quant ELSS Tax Saver\n` +
      `• Canara Robeco ELSS Tax Saver\n\n` +
      `💡 **Tip:** If total deductions < ₹75,000, New Regime may be better.`;
  }

  if (msg.includes('sip') || msg.includes('invest') || msg.includes('fund') || msg.includes('mutual')) {
    return `📈 **Investment Guide:**\n\n` +
      `**SIP Strategy:**\n` +
      `• Start with ₹5,000-10,000/month in index funds\n` +
      `• Step-up SIP: Increase 10% every year\n` +
      `• Stay invested for 7+ years for wealth creation\n\n` +
      `**Recommended Funds by Category:**\n` +
      `• **Index:** Nifty 50 Index Fund (low cost, passive)\n` +
      `• **Flexi Cap:** Parag Parikh Flexi Cap\n` +
      `• **Mid Cap:** Motilal Oswal Midcap Fund\n` +
      `• **ELSS:** Mirae Asset ELSS Tax Saver\n` +
      `• **Debt:** HDFC Corporate Bond Fund\n\n` +
      `⚠️ **Rule of 115:** Divide 115 by your expected return rate to find doubling time. At 12%, money doubles in ~9.5 years.`;
  }

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.length < 10) {
    return `Hello! I'm your FinLeap AI assistant. I can help you with:\n\n` +
      `• **Portfolio Diversification** — Asset allocation advice\n` +
      `• **Financial Health** — Score and improvement tips\n` +
      `• **Loan Management** — Prepayment and EMI advice\n` +
      `• **Goal Planning** — Savings strategy\n` +
      `• **Insurance** — Coverage recommendations\n` +
      `• **Tax Saving** — 80C, ELSS, and regime comparison\n` +
      `• **Investment** — SIP and mutual fund suggestions\n\n` +
      `Ask me anything about your finances!`;
  }

  return `Based on your financial data:\n\n` +
    `• Net Worth: ₹${netWorth}\n` +
    `• Monthly Savings Rate: ${savingsRate.toFixed(1)}%\n` +
    `• Risk Profile: ${risk}\n\n` +
    `I can help you with portfolio diversification, loan management, tax saving, insurance review, and goal planning. ` +
    `Try asking me something specific like "How should I diversify my portfolio?" or "Should I prepay my loan?"`;
}

function buildAnalysisLocalResponse(systemPrompt: string): object {
  let netWorth = 0, savingsRate = 0, goals = 0, loans = 0, insurance = 0, mfHoldings = 0, risk = 'Moderate';
  let totalAssets = 0, totalLiabilities = 0;

  const nwMatch = systemPrompt.match(/Net Worth: ₹([\d,]+)/);
  if (nwMatch) netWorth = parseInt(nwMatch[1].replace(/,/g, ''));
  const srMatch = systemPrompt.match(/Savings Rate: ([\d.]+)%/);
  if (srMatch) savingsRate = parseFloat(srMatch[1]);
  const gMatch = systemPrompt.match(/Goals: (\d+)/);
  if (gMatch) goals = parseInt(gMatch[1]);
  const lMatch = systemPrompt.match(/Loans: (\d+)/);
  if (lMatch) loans = parseInt(lMatch[1]);
  const iMatch = systemPrompt.match(/Insurance: (\d+)/);
  if (iMatch) insurance = parseInt(iMatch[1]);
  const mfMatch = systemPrompt.match(/MF Holdings: (\d+)/);
  if (mfMatch) mfHoldings = parseInt(mfMatch[1]);
  const rMatch = systemPrompt.match(/Risk Profile: (\w+)/);
  if (rMatch) risk = rMatch[1];
  const taMatch = systemPrompt.match(/Total Assets: ₹([\d,]+)/);
  if (taMatch) totalAssets = parseInt(taMatch[1].replace(/,/g, ''));
  const tlMatch = systemPrompt.match(/Total Liabilities: ₹([\d,]+)/);
  if (tlMatch) totalLiabilities = parseInt(tlMatch[1].replace(/,/g, ''));

  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: any[] = [];

  if (savingsRate > 30) { score += 15; strengths.push(`Excellent savings rate of ${savingsRate.toFixed(1)}%`); }
  else if (savingsRate > 20) { score += 10; strengths.push(`Good savings rate of ${savingsRate.toFixed(1)}%`); }
  else if (savingsRate > 0) { weaknesses.push(`Savings rate is only ${savingsRate.toFixed(1)}% — aim for 20%+`); }
  else { weaknesses.push('No income data found — add transactions to track savings'); }

  if (insurance > 0) { score += 10; strengths.push(`${insurance} insurance policy(ies) active`); }
  else { weaknesses.push('No insurance found — critical gap'); recommendations.push({ title: 'Get Health Insurance', description: 'Purchase health insurance with minimum ₹5L cover.', priority: 'high', category: 'insurance' }); }

  if (goals > 0) { score += 10; strengths.push(`${goals} financial goal(s) set`); }
  else { weaknesses.push('No financial goals defined'); recommendations.push({ title: 'Set Financial Goals', description: 'Create goals for emergency fund, retirement, and milestones.', priority: 'high', category: 'goals' }); }

  if (mfHoldings > 3) { score += 5; strengths.push(`Diversified MF portfolio with ${mfHoldings} holdings`); }
  else if (mfHoldings > 0) { strengths.push(`${mfHoldings} MF holding(s)`); recommendations.push({ title: 'Diversify MF Portfolio', description: 'Add more fund categories for better diversification.', priority: 'medium', category: 'portfolio' }); }
  else { weaknesses.push('No mutual fund investments found'); recommendations.push({ title: 'Start SIP in Index Fund', description: 'Begin with ₹5,000/month in Nifty 50 Index Fund.', priority: 'high', category: 'portfolio' }); }

  if (loans > 0) { recommendations.push({ title: 'Review Loan Prepayment', description: 'If loan interest rate > 10%, consider prepaying.', priority: 'medium', category: 'debt' }); }

  if (risk === 'Not Set') { recommendations.push({ title: 'Complete Risk Profiling', description: 'Take the risk assessment quiz for personalized recommendations.', priority: 'medium', category: 'portfolio' }); }

  recommendations.push(
    { title: 'Build Emergency Fund', description: 'Keep 6-12 months expenses in liquid fund.', priority: 'high', category: 'savings' },
    { title: 'Start PPF Contribution', description: 'Invest ₹12,500/month in PPF for tax-free returns.', priority: 'medium', category: 'tax' }
  );

  score = Math.min(Math.max(score, 0), 100);

  let allocation;
  if (risk === 'Conservative') allocation = { equity: 35, debt: 50, gold: 10, cash: 5 };
  else if (risk === 'Aggressive') allocation = { equity: 70, debt: 15, gold: 10, cash: 5 };
  else allocation = { equity: 55, debt: 30, gold: 10, cash: 5 };

  return {
    score,
    summary: score >= 70 ? `Strong financial health at ${score}/100. Keep it up!` : score >= 50 ? `Moderate health at ${score}/100. Focus on recommendations below.` : `Needs attention at ${score}/100. Start with high-priority items.`,
    strengths,
    weaknesses,
    recommendations: recommendations.slice(0, 5),
    allocation: { suggested: allocation },
  };
}

export async function callLLM(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<LLMResponse> {
  const userMsg = messages.find(m => m.role === 'user')?.content || '';
  const sysMsg = messages.find(m => m.role === 'system')?.content || '';

  const isAnalysis = sysMsg.includes('Provide your analysis in the following JSON format');

  if (isAnalysis) {
    return {
      content: JSON.stringify(buildAnalysisLocalResponse(sysMsg)),
      model: 'finleap-local-v1',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
  const GROQ_KEY = process.env.GROQ_API_KEY;
  const GOOGLE_KEY = process.env.GOOGLE_AI_API_KEY;

  if (OPENROUTER_KEY || GROQ_KEY || GOOGLE_KEY) {
    try {
      let response: string = '';
      let model = '';

      if (OPENROUTER_KEY) {
        model = options.model || 'openrouter/free';
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1000,
          }),
        });
        if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
        const data = await res.json() as any;
        response = data.choices?.[0]?.message?.content || '';
      } else if (GROQ_KEY) {
        model = options.model || 'llama-3.3-70b-versatile';
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1000,
          }),
        });
        if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
        const data = await res.json() as any;
        response = data.choices?.[0]?.message?.content || '';
      } else if (GOOGLE_KEY) {
        model = options.model || 'gemini-2.0-flash';
        const contents = messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          }));
        const systemInstruction = messages.find(m => m.role === 'system');
        const body: any = { contents };
        if (systemInstruction) {
          body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
        }
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...body,
              generationConfig: {
                temperature: options.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? 1000,
              },
            }),
          }
        );
        if (!res.ok) throw new Error(`Google AI API error: ${res.status}`);
        const data = await res.json() as any;
        response = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      if (response) {
        return {
          content: response,
          model,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        };
      }
    } catch (err: any) {
      console.error('External LLM API failed, falling back to local:', err?.message);
    }
  }

  const content = buildLocalResponse(userMsg, sysMsg);
  return {
    content,
    model: 'finleap-local-v1',
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };
}

export async function callLLMStream(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<ReadableStream<string>> {
  const result = await callLLM(messages, options);

  return new ReadableStream({
    start(controller) {
      const words = result.content.split(' ');
      for (const word of words) {
        controller.enqueue(word + ' ');
      }
      controller.close();
    },
  });
}

export function parseJSONResponse<T>(content: string, fallback: T): T {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}
