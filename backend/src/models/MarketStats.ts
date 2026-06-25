import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketStatsTurnover {
  product?: string;
  volume?: string;
  value?: string;
  openInterest?: string;
  lastUpdated?: string;
}

export interface IMarketStats {
  date?: Date;
  stockTraded?: number;
  advances?: number;
  declines?: number;
  unchanged?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  upperCircuitCount?: number;
  lowerCircuitCount?: number;
  marketCap?: string;
  latencyNanoseconds?: number;
  turnover?: IMarketStatsTurnover[];
}

export interface IMarketStatsDocument extends IMarketStats, Document {}

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
  turnover: [{
    product: String,
    volume: String,
    value: String,
    openInterest: String,
    lastUpdated: String
  }]
});

export default mongoose.model<IMarketStatsDocument>('MarketStats', MarketStatsSchema);
