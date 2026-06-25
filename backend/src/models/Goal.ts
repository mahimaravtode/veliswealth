import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGoalContribution {
  amount: number;
  date: Date;
  note?: string;
}

export interface IGoalMilestone {
  title?: string;
  amount?: number;
  achieved?: boolean;
  achievedAt?: Date;
}

export interface IGoal {
  userId: Types.ObjectId;
  title: string;
  targetAmount: number;
  currentAmount?: number;
  monthlyContribution?: number;
  targetDate?: Date;
  category?: 'Home' | 'Education' | 'Car' | 'Retirement' | 'Emergency Fund' | 'Vacation' | 'Wedding' | 'Electronics' | 'Health' | 'Investment' | 'Other';
  priority?: 'High' | 'Medium' | 'Low';
  status?: 'Active' | 'Paused' | 'Achieved';
  icon?: string;
  color?: string;
  contributions?: IGoalContribution[];
  milestones?: IGoalMilestone[];
  notes?: string;
  createdAt?: Date;
}

export interface IGoalDocument extends IGoal, Document {}

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
  contributions: [{
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
  }],
  milestones: [{
    title: String,
    amount: Number,
    achieved: { type: Boolean, default: false },
    achievedAt: Date,
  }],
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IGoalDocument>('Goal', GoalSchema);
