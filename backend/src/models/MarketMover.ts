import mongoose, { Schema, Document } from 'mongoose';
import { IMarketMover, IFundamentals, IPriceHistory } from '../types';

export interface IMarketMoverDocument extends Omit<IMarketMover, '_id'>, Document {}

const FundamentalsSchema = new Schema<IFundamentals>({
  peRatio: Number,
  pbRatio: Number,
  eps: Number,
  roe: Number,
  dividendYield: Number
});

const PriceHistorySchema = new Schema<IPriceHistory>({
  price: Number,
  timestamp: { type: Date, default: Date.now }
});

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
  fundamentals: FundamentalsSchema,
  history: [PriceHistorySchema],
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IMarketMoverDocument>('MarketMover', MarketMoverSchema);
