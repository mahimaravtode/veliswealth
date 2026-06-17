const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  holdings: [{
    schemeCode: String,
    schemeName: String,
    units: Number,
    avgNav: Number,
    currentNav: Number,
    category: String,
    lastUpdated: { type: Date, default: Date.now }
  }],
  summary: {
    totalInvested: { type: Number, default: 0 },
    currentValue: { type: Number, default: 0 },
    totalGain: { type: Number, default: 0 },
    xirr: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
