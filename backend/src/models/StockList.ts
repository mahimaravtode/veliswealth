import mongoose, { Schema, Document } from 'mongoose';

export interface IStockListDocument extends Document {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  isin?: string;
  series?: string;
  status: 'Active' | 'Suspended';
  lastPrice?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: Date;
}

const StockListSchema = new Schema<IStockListDocument>({
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  exchange: { type: String, enum: ['NSE', 'BSE'], required: true },
  isin: String,
  series: { type: String, default: 'EQ' },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  lastPrice: Number,
  change: Number,
  changePercent: Number,
  volume: { type: Number, default: 0 },
  marketCap: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

StockListSchema.index({ symbol: 1, exchange: 1 }, { unique: true });
StockListSchema.index({ exchange: 1 });
StockListSchema.index({ name: 'text', symbol: 'text' });

export default mongoose.model<IStockListDocument>('StockList', StockListSchema);
