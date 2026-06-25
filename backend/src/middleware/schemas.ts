import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const createGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    targetAmount: z.number().positive('Target amount must be positive'),
    currentAmount: z.number().min(0).optional(),
    monthlyContribution: z.number().min(0).optional(),
    targetDate: z.string().datetime().optional(),
    category: z.enum(['Home', 'Education', 'Car', 'Retirement', 'Emergency Fund', 'Vacation', 'Wedding', 'Electronics', 'Health', 'Investment', 'Other']).optional(),
    priority: z.enum(['High', 'Medium', 'Low']).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const createLoanSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    loanAmount: z.number().positive('Loan amount must be positive'),
    interestRate: z.number().min(0.1).max(50),
    tenure: z.number().positive(),
    tenureType: z.enum(['years', 'months']).optional(),
    startDate: z.string().datetime(),
    loanType: z.enum(['Home', 'Car', 'Personal', 'Education', 'Business', 'Gold', 'Other']).optional(),
    bankName: z.string().max(100).optional(),
  }),
});

export const createTransactionSchema = z.object({
  body: z.object({
    type: z.enum(['income', 'expense', 'investment', 'insurance', 'transfer']),
    category: z.string().min(1, 'Category is required').max(50),
    amount: z.number().positive('Amount must be positive'),
    direction: z.enum(['in', 'out']),
    date: z.string().datetime().optional(),
    account: z.string().max(50).optional(),
    description: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['completed', 'pending', 'cancelled', 'failed']).optional(),
    isRecurring: z.boolean().optional(),
  }),
});

export const createInsuranceSchema = z.object({
  body: z.object({
    policyName: z.string().min(1, 'Policy name is required').max(100),
    policyNumber: z.string().max(50).optional(),
    type: z.enum(['Life', 'Health', 'General', 'Critical Illness']),
    provider: z.string().max(100).optional(),
    premiumAmount: z.number().min(0).optional(),
    sumAssured: z.number().min(0).optional(),
    expiryDate: z.string().datetime().optional(),
    status: z.enum(['Active', 'Lapsed', 'Grace Period']).optional(),
  }),
});

export const createAssetSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    type: z.enum(['Cash', 'Savings', 'FD', 'Mutual Fund', 'Stock', 'ETF', 'Bond', 'Gold', 'Real Estate', 'Crypto', 'Loan', 'Credit Card']),
    category: z.enum(['Asset', 'Liability']),
    currentValue: z.number().min(0, 'Value must be non-negative'),
  }),
});

export const riskCalculateSchema = z.object({
  body: z.object({
    answers: z.array(z.number().min(0).max(10)).min(1, 'At least one answer required'),
  }),
});

export const prepaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    date: z.string().datetime(),
    type: z.enum(['partial', 'full']).optional(),
    note: z.string().max(200).optional(),
  }),
});

export const simulateEmiSchema = z.object({
  body: z.object({
    newEmi: z.number().positive('EMI must be positive'),
  }),
});

export const earlyClosureSchema = z.object({
  body: z.object({
    monthsPaid: z.number().min(0).optional(),
  }),
});

export const syncPortfolioSchema = z.object({
  body: z.object({
    holdings: z.array(z.object({
      schemeCode: z.string().optional(),
      schemeName: z.string().optional(),
      units: z.number().min(0).optional(),
      avgNav: z.number().min(0).optional(),
      currentNav: z.number().min(0).optional(),
      category: z.string().optional(),
    })),
  }),
});

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(1000),
    history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).optional(),
  }),
});

export const predictGoalSchema = z.object({
  body: z.object({
    goalId: z.string().min(1, 'Goal ID is required'),
  }),
});

export const rebalanceSchema = z.object({
  body: z.object({
    targetAllocation: z.object({
      equity: z.number().min(0).max(100).optional(),
      debt: z.number().min(0).max(100).optional(),
      gold: z.number().min(0).max(100).optional(),
      cash: z.number().min(0).max(100).optional(),
    }).optional(),
  }).optional(),
});
