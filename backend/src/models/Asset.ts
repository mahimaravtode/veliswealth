import mongoose, { Schema, Document } from 'mongoose';
import { IAsset } from '../types';

export interface IAssetDocument extends Omit<IAsset, '_id'>, Document {}

const AssetSchema = new Schema<IAssetDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Cash', 'Savings', 'FD', 'Mutual Fund', 'Stock', 'ETF', 'Bond', 'Gold', 'Real Estate', 'Crypto', 'Loan', 'Credit Card'], 
    required: true 
  },
  category: { type: String, enum: ['Asset', 'Liability'], required: true },
  currentValue: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model<IAssetDocument>('Asset', AssetSchema);
