import mongoose, { Document, Schema } from 'mongoose';

export interface IReport {
  title?: string;
  description?: string;
  category?: string;
  date?: Date;
}

export interface IReportDocument extends IReport, Document {}

const ReportSchema = new Schema<IReportDocument>({
  title: String,
  description: String,
  category: String,
  date: { type: Date, default: Date.now }
});

export default mongoose.model<IReportDocument>('Report', ReportSchema);
