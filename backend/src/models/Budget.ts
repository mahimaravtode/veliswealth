import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBudgetCategory {
  name: string;
  budget: number;
  spent?: number;
}

export interface IBudget {
  userId: Types.ObjectId;
  month: number;
  year: number;
  totalBudget: number;
  categories: IBudgetCategory[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBudgetDocument extends IBudget, Document {}

const BudgetSchema = new Schema<IBudgetDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  totalBudget: { type: Number, required: true },
  categories: [{
    name: { type: String, required: true },
    budget: { type: Number, required: true },
    spent: { type: Number, default: 0 },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

BudgetSchema.pre('save', function () {
  this.updatedAt = new Date();
});

BudgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IBudgetDocument>('Budget', BudgetSchema);
