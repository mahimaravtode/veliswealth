import mongoose, { Document, Schema } from 'mongoose';

export interface IScheme {
  schemeCode: string;
  schemeName: string;
  category?: string;
  currentNav?: number;
  threeYearReturns?: number;
}

export interface ISchemeDocument extends IScheme, Document {}

const SchemeSchema = new Schema<ISchemeDocument>({
  schemeCode: { type: String, required: true, unique: true },
  schemeName: { type: String, required: true },
  category: String,
  currentNav: Number,
  threeYearReturns: Number
});

export default mongoose.model<ISchemeDocument>('Scheme', SchemeSchema);
