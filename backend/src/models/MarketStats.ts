import mongoose, { Schema, Document } from 'mongoose';
import { IMarketStats, ITurnover } from '../types';

export interface IMarketStatsDocument extends Omit<IMarketStats, '_id'>, Document {}

const TurnoverSchema = new Schema<ITurnover>({
  product: String,
  volume: String,
  value: String,
  openInterest: String,
  lastUpdated: String
});

const MarketStatsSchema = new Schema<IMarketStatsDocument>({
  date: { type: Date, default: Date.now },
  stockTraded: Number,
  advances: Number,
  declines: Number,
  unchanged: Number,
  fiftyTwoWeekHigh: Number,
  fiftyTwoWeekLow: Number,
  upperCircuitCount: Number,
  lowerCircuitCount: Number,
  marketCap: String,
  latencyNanoseconds: Number,
  turnover: [TurnoverSchema]
});

export default mongoose.model<IMarketStatsDocument>('MarketStats', MarketStatsSchema);
