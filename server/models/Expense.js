const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    allocatedAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Allocated amount cannot be negative'],
    },
    percentage: {
      type: Number,
      default: null,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    customAmount: {
      type: Number,
      default: null,
      min: [0, 'Custom amount cannot be negative'],
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide an expense description'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      required: [true, 'Please provide a currency'],
      uppercase: true,
      trim: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    splitType: {
      type: String,
      enum: ['equal', 'percentage', 'custom'],
      default: 'equal',
      required: true,
    },
    participants: [participantSchema],
    exchangeRate: {
      type: Number,
      required: true,
      default: 1.0,
    },
    convertedAmount: {
      type: Number,
      required: true,
      min: [0.01, 'Converted amount must be greater than zero'],
    },
    baseCurrency: {
      type: String,
      required: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: [
        'Accommodation',
        'Food',
        'Transportation',
        'Activities',
        'Shopping',
        'Flights',
        'Miscellaneous',
      ],
      default: 'Miscellaneous',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    receiptImage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for high-performance query on trip expenses
expenseSchema.index({ trip: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
