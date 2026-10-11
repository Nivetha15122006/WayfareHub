const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const { getExchangeRate } = require('./fxController');
const { simplifyDebts, roundTwoDecimals } = require('../utils/debtSimplifier');

// Helper to check user membership
const isTripMemberOrOwner = (trip, userId) => {
  if (!trip || !userId) return false;
  const uId = userId.toString();
  const ownerId = trip.owner?._id ? trip.owner._id.toString() : trip.owner?.toString();
  const isOwner = ownerId === uId;
  const isMember = Array.isArray(trip.members) && trip.members.some((m) => {
    const mId = m?._id ? m._id.toString() : m?.toString();
    return mId === uId;
  });
  return isOwner || isMember;
};

/**
 * Validates and calculates participant allocations
 */
const calculateAllocations = (splitType, participants, convertedAmount, originalAmount, exchangeRate) => {
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    throw new Error('Expense must have at least one participant');
  }

  const allocatedParticipants = [];

  if (splitType === 'equal') {
    const count = participants.length;
    const baseShare = Math.floor((convertedAmount / count) * 100) / 100;
    let remainder = roundTwoDecimals(convertedAmount - baseShare * count);

    participants.forEach((p, idx) => {
      const uId = p.user?._id || p.user || p;
      let share = baseShare;
      if (remainder > 0.009) {
        share = roundTwoDecimals(share + 0.01);
        remainder = roundTwoDecimals(remainder - 0.01);
      }
      allocatedParticipants.push({
        user: uId,
        allocatedAmount: share,
      });
    });
  } else if (splitType === 'percentage') {
    let totalPercentage = 0;
    participants.forEach((p) => {
      const pct = Number(p.percentage || 0);
      totalPercentage += pct;
    });

    if (Math.abs(totalPercentage - 100) > 0.1) {
      throw new Error(`Participant percentages must total 100%. Current sum: ${totalPercentage}%`);
    }

    let runningTotal = 0;
    participants.forEach((p, idx) => {
      const uId = p.user?._id || p.user;
      const pct = Number(p.percentage || 0);
      let share = roundTwoDecimals((convertedAmount * pct) / 100);
      runningTotal = roundTwoDecimals(runningTotal + share);

      // Adjust minor penny rounding on the last participant
      if (idx === participants.length - 1 && Math.abs(runningTotal - convertedAmount) > 0.009) {
        share = roundTwoDecimals(share + (convertedAmount - runningTotal));
      }

      allocatedParticipants.push({
        user: uId,
        percentage: pct,
        allocatedAmount: share,
      });
    });
  } else if (splitType === 'custom') {
    let customSum = 0;
    participants.forEach((p) => {
      const customVal = Number(p.customAmount || 0);
      if (customVal < 0) {
        throw new Error('Custom allocation amounts cannot be negative');
      }
      customSum = roundTwoDecimals(customSum + customVal);
    });

    // Check if custom amounts were given in original currency or already converted
    // If sum matches originalAmount, convert to baseCurrency
    const isOriginalCurrency = Math.abs(customSum - originalAmount) < 0.05;
    const isConvertedCurrency = Math.abs(customSum - convertedAmount) < 0.05;

    if (!isOriginalCurrency && !isConvertedCurrency) {
      throw new Error(
        `Custom amounts total (${customSum}) must equal the expense total (${originalAmount} ${exchangeRate !== 1 ? 'or ' + convertedAmount : ''})`
      );
    }

    participants.forEach((p) => {
      const uId = p.user?._id || p.user;
      const customVal = Number(p.customAmount || 0);
      const allocated = isOriginalCurrency
        ? roundTwoDecimals(customVal * exchangeRate)
        : roundTwoDecimals(customVal);

      allocatedParticipants.push({
        user: uId,
        customAmount: customVal,
        allocatedAmount: allocated,
      });
    });
  } else {
    throw new Error(`Invalid splitType "${splitType}". Must be equal, percentage, or custom`);
  }

  return allocatedParticipants;
};

// @desc    Create a new expense
// @route   POST /api/v1/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const {
      trip: tripId,
      description,
      amount,
      currency,
      paidBy,
      splitType,
      participants,
      category,
      date,
      notes,
      receiptImage,
    } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be a positive number',
      });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add expenses to this trip',
      });
    }

    const expCurrency = (currency || trip.baseCurrency).toUpperCase();
    const baseCurrency = trip.baseCurrency.toUpperCase();

    // Fetch exchange rate via Frankfurter
    let exchangeRate = 1.0;
    if (expCurrency !== baseCurrency) {
      exchangeRate = await getExchangeRate(expCurrency, baseCurrency);
    }

    const convertedAmount = roundTwoDecimals(numAmount * exchangeRate);

    // Compute participant allocations
    let allocatedParticipants;
    try {
      allocatedParticipants = calculateAllocations(
        splitType || 'equal',
        participants,
        convertedAmount,
        numAmount,
        exchangeRate
      );
    } catch (allocError) {
      return res.status(400).json({
        success: false,
        message: allocError.message,
      });
    }

    const expense = await Expense.create({
      trip: trip._id,
      description,
      amount: numAmount,
      currency: expCurrency,
      paidBy: paidBy || req.user._id,
      splitType: splitType || 'equal',
      participants: allocatedParticipants,
      exchangeRate,
      convertedAmount,
      baseCurrency,
      category: category || 'Miscellaneous',
      date: date || new Date(),
      notes: notes || '',
      receiptImage: receiptImage || null,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('participants.user', 'name email');

    res.status(201).json({
      success: true,
      data: populatedExpense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expenses for a trip with financial aggregations
// @route   GET /api/v1/expenses/trip/:tripId
// @access  Private
const getTripExpenses = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view expenses for this trip',
      });
    }

    const expenses = await Expense.find({ trip: tripId })
      .populate('paidBy', 'name email')
      .populate('participants.user', 'name email')
      .sort({ date: -1, createdAt: -1 });

    // Mongoose Aggregations for Financial Analytics
    const tripObjectId = new mongoose.Types.ObjectId(tripId);

    const [categoryAggregation, payerAggregation, totalAggregation] = await Promise.all([
      // Spending by category
      Expense.aggregate([
        { $match: { trip: tripObjectId } },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$convertedAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Spending by member
      Expense.aggregate([
        { $match: { trip: tripObjectId } },
        {
          $group: {
            _id: '$paidBy',
            total: { $sum: '$convertedAmount' },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            name: '$user.name',
            email: '$user.email',
            total: 1,
            count: 1,
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Overall total
      Expense.aggregate([
        { $match: { trip: tripObjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: '$convertedAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalSpending = totalAggregation[0]?.total ? roundTwoDecimals(totalAggregation[0].total) : 0;

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: {
        expenses,
        analytics: {
          totalSpending,
          baseCurrency: trip.baseCurrency,
          byCategory: categoryAggregation.map((c) => ({
            category: c._id,
            total: roundTwoDecimals(c.total),
            count: c.count,
          })),
          byPayer: payerAggregation.map((p) => ({
            userId: p._id,
            name: p.name,
            email: p.email,
            total: roundTwoDecimals(p.total),
            count: p.count,
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense by ID
// @route   GET /api/v1/expenses/:id
// @access  Private
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('participants.user', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    const trip = await Trip.findById(expense.trip);
    if (!trip || !isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this expense',
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an expense
// @route   PUT /api/v1/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    let expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    const trip = await Trip.findById(expense.trip);
    if (!trip || !isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense',
      });
    }

    const {
      description,
      amount,
      currency,
      paidBy,
      splitType,
      participants,
      category,
      date,
      notes,
      receiptImage,
    } = req.body;

    const numAmount = amount != null ? Number(amount) : expense.amount;
    const expCurrency = (currency || expense.currency).toUpperCase();
    const baseCurrency = trip.baseCurrency.toUpperCase();
    const currentSplitType = splitType || expense.splitType;
    const currentParticipants = participants || expense.participants;

    let exchangeRate = expense.exchangeRate;
    if (currency && expCurrency !== expense.currency) {
      exchangeRate = await getExchangeRate(expCurrency, baseCurrency);
    }

    const convertedAmount = roundTwoDecimals(numAmount * exchangeRate);

    let allocatedParticipants;
    try {
      allocatedParticipants = calculateAllocations(
        currentSplitType,
        currentParticipants,
        convertedAmount,
        numAmount,
        exchangeRate
      );
    } catch (allocError) {
      return res.status(400).json({
        success: false,
        message: allocError.message,
      });
    }

    expense.description = description || expense.description;
    expense.amount = numAmount;
    expense.currency = expCurrency;
    expense.paidBy = paidBy || expense.paidBy;
    expense.splitType = currentSplitType;
    expense.participants = allocatedParticipants;
    expense.exchangeRate = exchangeRate;
    expense.convertedAmount = convertedAmount;
    expense.baseCurrency = baseCurrency;
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (notes !== undefined) expense.notes = notes;
    if (receiptImage !== undefined) expense.receiptImage = receiptImage;

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('participants.user', 'name email');

    res.status(200).json({
      success: true,
      data: populatedExpense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/v1/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    const trip = await Trip.findById(expense.trip);
    if (!trip || !isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense',
      });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get simplified debt settlements for a trip
// @route   GET /api/v1/expenses/trip/:tripId/settlements
// @access  Private
const getSettlements = async (req, res, next) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId).populate('members', 'name email');
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access settlements for this trip',
      });
    }

    const expenses = await Expense.find({ trip: tripId })
      .populate('paidBy', 'name email')
      .populate('participants.user', 'name email');

    const result = simplifyDebts(expenses, trip.members, trip.baseCurrency, trip.settledPayments || []);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record or tick a settlement payment as paid / settled
// @route   POST /api/v1/expenses/trip/:tripId/settle
// @access  Private
const recordSettlement = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { from, fromId, to, toId, amount, currency } = req.body;

    const trip = await Trip.findById(tripId).populate('members', 'name email');
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to record settlements on this trip',
      });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Settlement amount must be a positive number',
      });
    }

    if (!trip.settledPayments) {
      trip.settledPayments = [];
    }

    trip.settledPayments.push({
      from: from || 'Member',
      fromId: fromId || null,
      to: to || 'Member',
      toId: toId || null,
      amount: numAmount,
      currency: currency || trip.baseCurrency,
      settledAt: new Date(),
      settledBy: req.user._id,
    });

    await trip.save();

    const expenses = await Expense.find({ trip: tripId })
      .populate('paidBy', 'name email')
      .populate('participants.user', 'name email');

    const result = simplifyDebts(expenses, trip.members, trip.baseCurrency, trip.settledPayments);

    res.status(200).json({
      success: true,
      message: `Payment of ${numAmount} ${currency || trip.baseCurrency} marked as settled!`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getTripExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getSettlements,
  recordSettlement,
};
