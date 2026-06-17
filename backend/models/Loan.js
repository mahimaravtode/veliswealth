const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  loanAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  tenure: { type: Number, required: true },
  tenureType: { type: String, enum: ['years', 'months'], default: 'years' },
  startDate: { type: Date, required: true },
  loanType: { type: String, enum: ['Home', 'Car', 'Personal', 'Education', 'Business', 'Gold', 'Other'], default: 'Home' },
  bankName: { type: String, default: '' },
  emiPaid: { type: Number, default: 0 },
  prepayments: [{
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    type: { type: String, enum: ['partial', 'full'], default: 'partial' },
    note: { type: String, default: '' },
  }],
  emiHistory: [{
    month: Number,
    year: Number,
    emi: Number,
    principal: Number,
    interest: Number,
    balance: Number,
    date: Date,
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Loan', LoanSchema);
