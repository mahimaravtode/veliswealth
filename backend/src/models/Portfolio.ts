import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPortfolioHolding {
  schemeCode?: string;
  schemeName?: string;
  units?: number;
  avgNav?: number;
  currentNav?: number;
  category?: string;
  lastUpdated?: Date;
}

export interface IPortfolioSummary {
  totalInvested?: number;
  currentValue?: number;
  totalGain?: number;
  xirr?: number;
}

export interface IPortfolio {
  userId: Types.ObjectId;
  holdings?: IPortfolioHolding[];
  summary?: IPortfolioSummary;
}

export interface IPortfolioDocument extends IPortfolio, Document {}

const PortfolioSchema = new Schema<IPortfolioDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  holdings: [{
    schemeCode: String,
    schemeName: String,
    units: Number,
    avgNav: Number,
    currentNav: Number,
    category: String,
    lastUpdated: { type: Date, default: Date.now }
  }],
  summary: {
    totalInvested: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    totalGain: { type: Number, default: 0 },
    xirr: { type: Number, default: 0 }
  }
});

export default mongoose.model<IPortfolioDocument>('Portfolio', PortfolioSchema);
