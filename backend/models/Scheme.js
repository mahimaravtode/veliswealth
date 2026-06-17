const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
  schemeCode: { type: String, required: true, unique: true },
  schemeName: { type: String, required: true },
  category: String,
  currentNav: Number,
  threeYearReturns: Number
});

module.exports = mongoose.model('Scheme', SchemeSchema);
