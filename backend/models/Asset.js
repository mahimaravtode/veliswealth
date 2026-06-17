const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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

module.exports = mongoose.model('Asset', AssetSchema);
