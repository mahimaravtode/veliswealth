import mongoose, { Schema, Document } from 'mongoose';
import { IGoal, IContribution, IMilestone } from '../types';

export interface IGoalDocument extends Omit<IGoal, '_id'>, Document {}

const ContributionSchema = new Schema<IContribution>({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  note: { type: String, default: '' },
});

const MilestoneSchema = new Schema<IMilestone>({
  title: String,
  amount: Number,
  achieved: { type: Boolean, default: false },
  achievedAt: Date,
});

const GoalSchema = new Schema<IGoalDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  monthlyContribution: { type: Number, default: 0 },
  targetDate: Date,
  category: { type: String, enum: ['Home', 'Education', 'Car', 'Retirement', 'Emergency Fund', 'Vacation', 'Wedding', 'Electronics', 'Health', 'Investment', 'Other'], default: 'Other' },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status: { type: String, enum: ['Active', 'Paused', 'Achieved'], default: 'Active' },
  icon: { type: String, default: 'Target' },
  color: { type: String, default: '#2563eb' },
  contributions: [ContributionSchema],
  milestones: [MilestoneSchema],
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IGoalDocument>('Goal', GoalSchema);
