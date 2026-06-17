const mongoose = require('mongoose');

const MarketMoverSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Stock', 'Index'], required: true },
  sector: String,
  lastPrice: { type: Number, required: true },
  change: Number,
  changePercent: Number,
  volume: { type: Number, default: 0 },
  marketCap: { type: Number, default: 0 },
  
  // Advanced Metrics
  openPrice: Number,
  highPrice: Number,
  lowPrice: Number,
  buyQuantity: Number,
  sellQuantity: Number,
  circuitHit: { type: String, enum: ['Upper', 'Lower', 'None'], default: 'None' },
  
  fundamentals: {
    peRatio: Number,
    pbRatio: Number,
    eps: Number,
    roe: Number,
    dividendYield: Number
  },
  
  history: [{
    price: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MarketMover', MarketMoverSchema);
