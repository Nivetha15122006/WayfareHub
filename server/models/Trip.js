const mongoose = require('mongoose');

const itineraryStopSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an itinerary stop title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    date: {
      type: String, // Store as YYYY-MM-DD or ISO string for intuitive day grouping
      required: [true, 'Please provide an itinerary stop date'],
    },
    startTime: {
      type: String,
      default: '09:00',
    },
    endTime: {
      type: String,
      default: '10:00',
    },
    category: {
      type: String,
      enum: ['Hotel', 'Attraction', 'Restaurant', 'Transport', 'Activity', 'Shopping', 'Other'],
      default: 'Activity',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a trip title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    destination: {
      type: String,
      required: [true, 'Please provide a destination'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide an end date'],
    },
    baseCurrency: {
      type: String,
      required: true,
      uppercase: true,
      default: 'USD',
      enum: ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'CHF', 'NZD', 'THB', 'AED'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    itinerary: [itineraryStopSchema],
    budget: {
      type: Number,
      default: 0,
    },
    categoryBudgets: {
      type: Object,
      default: {},
    },
    packingList: [
      {
        item: { type: String, required: true },
        category: { type: String, default: 'General' },
        assignedToName: { type: String, default: '' },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        completed: { type: Boolean, default: false },
      },
    ],
    settledPayments: [
      {
        from: { type: String, required: true },
        fromId: { type: String, default: null },
        to: { type: String, required: true },
        toId: { type: String, default: null },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
        settledAt: { type: Date, default: Date.now },
        settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trip', tripSchema);
