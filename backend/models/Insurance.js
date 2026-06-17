const mongoose = require('mongoose');

const InsuranceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  policyName: { type: String, required: true },
  policyNumber: String,
  type: { type: String, enum: ['Life', 'Health', 'General', 'Critical Illness'], required: true },
  provider: String,
  premiumAmount: Number,
  sumAssured: Number,
  expiryDate: Date,
  status: { type: String, enum: ['Active', 'Lapsed', 'Grace Period'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Insurance', InsuranceSchema);
