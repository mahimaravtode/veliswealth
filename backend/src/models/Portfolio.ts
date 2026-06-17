import mongoose, { Schema, Document } from 'mongoose';

export interface IHoldingDocument extends Document {
  userId: mongoose.Types.ObjectId;
  holdings: {
    symbol: string;
    name: string;
    exchange: 'NSE' | 'BSE';
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
    investedAmount: number;
    currentValue: number;
    addedAt: Date;
  }[];
  summary: {
    totalInvested: number;
    currentValue: number;
    totalPnl: number;
    totalPnlPercent: number;
  };
  createdAt: Date;
}

const HoldingSchema = new Schema({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  exchange: { type: String, enum: ['NSE', 'BSE'], default: 'NSE' },
  quantity: { type: Number, required: true },
  avgBuyPrice: { type: Number, required: true },
  currentPrice: { type: Number, default: 0 },
  pnl: { type: Number, default: 0 },
  pnlPercent: { type: Number, default: 0 },
  investedAmount: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now }
});

const PortfolioSchema = new Schema<IHoldingDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  holdings: [HoldingSchema],
  summary: {
    totalInvested: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    totalPnl: { type: Number, default: 0 },
    totalPnlPercent: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IHoldingDocument>('Portfolio', PortfolioSchema);
