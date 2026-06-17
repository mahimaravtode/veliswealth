import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'Client' | 'Employee' | 'Admin';
  riskProfile: {
    score: number;
    category: 'Conservative' | 'Moderate' | 'Aggressive' | 'Not Set';
    lastUpdated?: Date;
  };
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IHolding {
  schemeCode: string;
  schemeName: string;
  units: number;
  avgNav: number;
  currentNav: number;
  category: string;
  lastUpdated: Date;
}

export interface IPortfolio {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  holdings: IHolding[];
  summary: {
    totalInvested: number;
    currentValue: number;
    totalGain: number;
    xirr: number;
  };
}

export interface IContribution {
  amount: number;
  date: Date;
  note: string;
}

export interface IMilestone {
  title: string;
  amount: number;
  achieved: boolean;
  achievedAt?: Date;
}

export interface IGoal {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: Date;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Paused' | 'Achieved';
  icon: string;
  color: string;
  contributions: IContribution[];
  milestones: IMilestone[];
  notes: string;
  createdAt: Date;
}

export interface IPrepayment {
  amount: number;
  date: Date;
  type: 'partial' | 'full';
  note: string;
}

export interface IEMIHistory {
  month: number;
  year: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
  date: Date;
}

export interface ILoan {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  loanAmount: number;
  interestRate: number;
  tenure: number;
  tenureType: 'years' | 'months';
  startDate: Date;
  loanType: string;
  bankName: string;
  emiPaid: number;
  prepayments: IPrepayment[];
  emiHistory: IEMIHistory[];
  createdAt: Date;
}

export interface IInsurance {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  policyName: string;
  policyNumber?: string;
  type: 'Life' | 'Health' | 'General' | 'Critical Illness';
  provider?: string;
  premiumAmount?: number;
  sumAssured?: number;
  expiryDate?: Date;
  status: 'Active' | 'Lapsed' | 'Grace Period';
  createdAt: Date;
}

export interface IFundamentals {
  peRatio?: number;
  pbRatio?: number;
  eps?: number;
  roe?: number;
  dividendYield?: number;
}

export interface IPriceHistory {
  price: number;
  timestamp: Date;
}

export interface IMarketMover {
  _id?: Types.ObjectId;
  symbol: string;
  name: string;
  type: 'Stock' | 'Index';
  sector?: string;
  lastPrice: number;
  change?: number;
  changePercent?: number;
  volume: number;
  marketCap: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  buyQuantity?: number;
  sellQuantity?: number;
  circuitHit: 'Upper' | 'Lower' | 'None';
  fundamentals?: IFundamentals;
  history: IPriceHistory[];
  timestamp: Date;
}

export interface ITurnover {
  product: string;
  volume: string;
  value: string;
  openInterest: string;
  lastUpdated: string;
}

export interface IMarketStats {
  _id?: Types.ObjectId;
  date: Date;
  stockTraded?: number;
  advances?: number;
  declines?: number;
  unchanged?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  upperCircuitCount?: number;
  lowerCircuitCount?: number;
  marketCap?: string;
  latencyNanoseconds?: number;
  turnover: ITurnover[];
}

export interface IReport {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  date: Date;
}

export interface IScheme {
  _id?: Types.ObjectId;
  schemeCode: string;
  schemeName: string;
  category?: string;
  currentNav?: number;
  threeYearReturns?: number;
}

export interface IAsset {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: string;
  category: 'Asset' | 'Liability';
  currentValue: number;
  lastUpdated: Date;
}

export interface AmortizationResult {
  emi: number;
  schedule: Array<{
    month: number;
    year: number;
    monthOfYear: number;
    emi: number;
    principal: number;
    interest: number;
    balance: number;
    date: Date;
  }>;
  totalPayment: number;
  totalInterest: number;
}

export interface LoanAnalytics {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  monthsElapsed: number;
  monthsPaid: number;
  remainingMonths: number;
  principalPaid: number;
  interestPaid: number;
  remainingPrincipal: number;
  remainingInterest: number;
  completionPercentage: number;
  amountRepaid: number;
  remainingAmount: number;
  outstandingBalance: number;
  loanEndDate: Date;
  yearsLeft: number;
  monthsLeft: number;
  totalPrepaid: number;
  yearlyBreakdown: Array<{
    year: number;
    principal: number;
    interest: number;
    balance: number;
    emis: number;
    totalPaid: number;
  }>;
  schedule: AmortizationResult['schedule'];
}
