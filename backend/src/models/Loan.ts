import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILoanPrepayment {
  amount: number;
  date: Date;
  type?: 'partial' | 'full';
  note?: string;
}

export interface ILoanEmiHistory {
  month?: number;
  year?: number;
  emi?: number;
  principal?: number;
  interest?: number;
  balance?: number;
  date?: Date;
}

export interface ILoan {
  userId: Types.ObjectId;
  title: string;
  loanAmount: number;
  interestRate: number;
  tenure: number;
  tenureType?: 'years' | 'months';
  startDate: Date;
  loanType?: 'Home' | 'Car' | 'Personal' | 'Education' | 'Business' | 'Gold' | 'Other';
  bankName?: string;
  emiPaid?: number;
  prepayments?: ILoanPrepayment[];
  emiHistory?: ILoanEmiHistory[];
  createdAt?: Date;
}

export interface ILoanDocument extends ILoan, Document {}

const LoanSchema = new Schema<ILoanDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  loanAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  tenure: { type: Number, required: true },
  tenureType: { type: String, enum: ['years', 'months'], default: 'years' },
  startDate: { type: Date, required: true },
  loanType: { type: String, enum: ['Home', 'Car', 'Personal', 'Education', 'Business', 'Gold', 'Other'], default: 'Home' },
  bankName: { type: String, default: '' },
  emiPaid: { type: Number, default: 0 },
  prepayments: [{
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['partial', 'full'], default: 'partial' },
    note: { type: String, default: '' },
  }],
  emiHistory: [{
    month: Number,
    year: Number,
    emi: Number,
    principal: Number,
    interest: Number,
    balance: Number,
    date: Date,
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ILoanDocument>('Loan', LoanSchema);
