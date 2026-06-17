import mongoose, { Schema, Document } from 'mongoose';
import { ILoan, IPrepayment, IEMIHistory } from '../types';

export interface ILoanDocument extends Omit<ILoan, '_id'>, Document {}

const PrepaymentSchema = new Schema<IPrepayment>({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['partial', 'full'], default: 'partial' },
  note: { type: String, default: '' },
});

const EMIHistorySchema = new Schema<IEMIHistory>({
  month: Number,
  year: Number,
  emi: Number,
  principal: Number,
  interest: Number,
  balance: Number,
  date: Date,
});

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
  prepayments: [PrepaymentSchema],
  emiHistory: [EMIHistorySchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ILoanDocument>('Loan', LoanSchema);
