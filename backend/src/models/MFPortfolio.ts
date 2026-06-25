import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMFHolding {
  schemeCode: string;
  schemeName: string;
  category?: string;
  amc?: string;
  units: number;
  avgNav: number;
  investedAmount: number;
  purchaseDate: Date;
  currentValue?: number;
  currentNav?: number;
  returns?: number;
  returnsPercent?: number;
}

export interface IMFPortfolio {
  user: Types.ObjectId;
  holdings: IMFHolding[];
  totalInvested?: number;
  currentValue?: number;
  totalReturns?: number;
  totalReturnsPercent?: number;
  lastUpdated?: Date;
}

export interface IMFPortfolioDocument extends IMFPortfolio, Document {
  recalculate(): void;
}

const MFHoldingSchema = new Schema<IMFHolding>({
  schemeCode: { type: String, required: true },
  schemeName: { type: String, required: true },
  category: String,
  amc: String,
  units: { type: Number, required: true },
  avgNav: { type: Number, required: true },
  investedAmount: { type: Number, required: true },
  purchaseDate: { type: Date, required: true },
  currentValue: { type: Number, default: 0 },
  currentNav: { type: Number, default: 0 },
  returns: { type: Number, default: 0 },
  returnsPercent: { type: Number, default: 0 },
}, { timestamps: true });

const MFPortfolioSchema = new Schema<IMFPortfolioDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  holdings: [MFHoldingSchema],
  totalInvested: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  totalReturns: { type: Number, default: 0 },
  totalReturnsPercent: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

MFPortfolioSchema.methods.recalculate = function (this: IMFPortfolioDocument) {
  this.totalInvested = this.holdings.reduce((sum: number, h: IMFHolding) => sum + h.investedAmount, 0);
  this.currentValue = this.holdings.reduce((sum: number, h: IMFHolding) => sum + (h.currentValue || 0), 0);
  this.totalReturns = this.currentValue - this.totalInvested;
  this.totalReturnsPercent = this.totalInvested > 0 ? parseFloat(((this.totalReturns / this.totalInvested) * 100).toFixed(2)) : 0;
  this.lastUpdated = new Date();
};

export default mongoose.model<IMFPortfolioDocument>('MFPortfolio', MFPortfolioSchema);
