import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketMoverFundamentals {
  peRatio?: number;
  pbRatio?: number;
  eps?: number;
  roe?: number;
  dividendYield?: number;
}

export interface IMarketMoverHistory {
  price?: number;
  timestamp?: Date;
}

export interface IMarketMover {
  symbol: string;
  name: string;
  type: 'Stock' | 'Index';
  sector?: string;
  lastPrice: number;
  prevClose?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  buyQuantity?: number;
  sellQuantity?: number;
  circuitHit?: 'Upper' | 'Lower' | 'None';
  fundamentals?: IMarketMoverFundamentals;
  history?: IMarketMoverHistory[];
  timestamp?: Date;
}

export interface IMarketMoverDocument extends IMarketMover, Document {}

const MarketMoverSchema = new Schema<IMarketMoverDocument>({
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Stock', 'Index'], required: true },
  sector: String,
  lastPrice: { type: Number, required: true },
  change: Number,
  changePercent: Number,
  volume: { type: Number, default: 0 },
  marketCap: { type: Number, default: 0 },
  openPrice: Number,
  highPrice: Number,
  lowPrice: Number,
  buyQuantity: Number,
  sellQuantity: Number,
  circuitHit: { type: String, enum: ['Upper', 'Lower', 'None'], default: 'None' },
  fundamentals: {
    peRatio: Number,
    pbRatio: Number,
    eps: Number,
    roe: Number,
    dividendYield: Number
  },
  history: [{
    price: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IMarketMoverDocument>('MarketMover', MarketMoverSchema);
