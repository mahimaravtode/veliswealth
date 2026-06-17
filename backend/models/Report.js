const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
