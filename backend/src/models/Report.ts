import mongoose, { Schema, Document } from 'mongoose';
import { IReport } from '../types';

export interface IReportDocument extends Omit<IReport, '_id'>, Document {}

const ReportSchema = new Schema<IReportDocument>({
  title: String,
  description: String,
  category: String,
  date: { type: Date, default: Date.now }
});

export default mongoose.model<IReportDocument>('Report', ReportSchema);
