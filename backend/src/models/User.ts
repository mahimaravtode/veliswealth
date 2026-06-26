import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserRiskProfile {
  score?: number;
  category?: 'Conservative' | 'Moderate' | 'Aggressive' | 'Not Set';
  lastUpdated?: Date;
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  authProvider: 'local' | 'google';
  avatar?: string;
  role?: 'Client' | 'Employee' | 'Admin';
  riskProfile?: IUserRiskProfile;
  createdAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['Client', 'Employee', 'Admin'], default: 'Client' },
  riskProfile: {
    score: { type: Number, default: 0 },
    category: { type: String, enum: ['Conservative', 'Moderate', 'Aggressive', 'Not Set'], default: 'Not Set' },
    lastUpdated: Date
  },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  if (!this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUserDocument>('User', UserSchema);
