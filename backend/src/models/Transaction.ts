import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITransactionRecurrence {
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  endDate?: Date;
  nextDate?: Date;
}

export interface ITransactionAttachment {
  name?: string;
  url?: string;
  type?: string;
}

export interface ITransaction {
  userId: Types.ObjectId;
  type: 'income' | 'expense' | 'investment' | 'insurance' | 'transfer';
  category: string;
  subcategory?: string;
  amount: number;
  direction: 'in' | 'out';
  date?: Date;
  account?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  status?: 'completed' | 'pending' | 'cancelled' | 'failed';
  isRecurring?: boolean;
  recurrence?: ITransactionRecurrence;
  relatedId?: Types.ObjectId;
  relatedType?: 'portfolio' | 'loan' | 'goal' | 'insurance' | '';
  attachments?: ITransactionAttachment[];
  isFavorite?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITransactionDocument extends ITransaction, Document {}

const TransactionSchema = new Schema<ITransactionDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['income', 'expense', 'investment', 'insurance', 'transfer'],
    required: true,
  },
  category: { type: String, required: true },
  subcategory: { type: String, default: '' },
  amount: { type: Number, required: true },
  direction: { type: String, enum: ['in', 'out'], required: true },
  date: { type: Date, required: true, default: Date.now },
  account: { type: String, default: 'General' },
  description: { type: String, default: '' },
  notes: { type: String, default: '' },
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'failed'],
    default: 'completed',
  },
  isRecurring: { type: Boolean, default: false },
  recurrence: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] },
    endDate: Date,
    nextDate: Date,
  },
  relatedId: { type: Schema.Types.ObjectId },
  relatedType: { type: String, enum: ['portfolio', 'loan', 'goal', 'insurance', ''] },
  attachments: [{
    name: String,
    url: String,
    type: String,
  }],
  isFavorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TransactionSchema.pre('save', function () {
  this.updatedAt = new Date();
});

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, category: 1 });

export default mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);
