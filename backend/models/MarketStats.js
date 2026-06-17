const mongoose = require('mongoose');

const MarketStatsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  stockTraded: Number,
  advances: Number,
  declines: Number,
  unchanged: Number,
  fiftyTwoWeekHigh: Number,
  fiftyTwoWeekLow: Number,
  upperCircuitCount: Number,
  lowerCircuitCount: Number,
  marketCap: String,
  latencyNanoseconds: Number,
  turnover: [{
    product: String,
    volume: String,
    value: String,
    openInterest: String,
    lastUpdated: String
  }]
});

module.exports = mongoose.model('MarketStats', MarketStatsSchema);
