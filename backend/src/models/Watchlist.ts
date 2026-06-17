import mongoose, { Schema, Document } from 'mongoose';

export interface IWatchlistDocument extends Document {
  userId: mongoose.Types.ObjectId;
  stocks: {
    symbol: string;
    name: string;
    exchange: 'NSE' | 'BSE';
    addedAt: Date;
  }[];
  createdAt: Date;
}

const WatchlistSchema = new Schema<IWatchlistDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  stocks: [{
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    exchange: { type: String, enum: ['NSE', 'BSE'], default: 'NSE' },
    addedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IWatchlistDocument>('Watchlist', WatchlistSchema);
