import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Client', 'Employee', 'Admin'], default: 'Client' },
  riskProfile: {
    score: { type: Number, default: 0 },
    category: { type: String, enum: ['Conservative', 'Moderate', 'Aggressive', 'Not Set'], default: 'Not Set' },
    lastUpdated: Date
  },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function(this: IUserDocument) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function(this: IUserDocument, candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUserDocument>('User', UserSchema);
