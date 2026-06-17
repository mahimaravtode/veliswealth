import mongoose, { Schema, Document } from 'mongoose';
import { IScheme } from '../types';

export interface ISchemeDocument extends Omit<IScheme, '_id'>, Document {}

const SchemeSchema = new Schema<ISchemeDocument>({
  schemeCode: { type: String, required: true, unique: true },
  schemeName: { type: String, required: true },
  category: String,
  currentNav: Number,
  threeYearReturns: Number
});

export default mongoose.model<ISchemeDocument>('Scheme', SchemeSchema);
