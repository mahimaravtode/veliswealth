import mongoose, { Schema, Document } from 'mongoose';
import { IInsurance } from '../types';

export interface IInsuranceDocument extends Omit<IInsurance, '_id'>, Document {}

const InsuranceSchema = new Schema<IInsuranceDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  policyName: { type: String, required: true },
  policyNumber: String,
  type: { type: String, enum: ['Life', 'Health', 'General', 'Critical Illness'], required: true },
  provider: String,
  premiumAmount: Number,
  sumAssured: Number,
  expiryDate: Date,
  status: { type: String, enum: ['Active', 'Lapsed', 'Grace Period'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IInsuranceDocument>('Insurance', InsuranceSchema);
