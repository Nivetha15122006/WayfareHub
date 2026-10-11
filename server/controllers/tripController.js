const { validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Expense = require('../models/Expense');

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

// @desc    Create a new trip
// @route   POST /api/v1/trips
// @access  Private
const createTrip = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { title, destination, startDate, endDate, baseCurrency } = req.body;

    const trip = await Trip.create({
      title,
      destination,
      startDate,
      endDate,
      baseCurrency: (baseCurrency || 'USD').toUpperCase(),
      owner: req.user._id,
      members: [req.user._id], // Owner is automatically a member
      itinerary: [],
    });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(201).json({
      success: true,
      data: populatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trips for the authenticated user
// @route   GET /api/v1/trips
// @access  Private
const getTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trip by ID
// @route   GET /api/v1/trips/:id
// @access  Private
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this trip',
      });
    }

    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip details
// @route   PUT /api/v1/trips/:id
// @access  Private
const updateTrip = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this trip',
      });
    }

    const {
      title,
      destination,
      startDate,
      endDate,
      baseCurrency,
      budget,
      categoryBudgets,
      packingList,
    } = req.body;

    if (title) trip.title = title;
    if (destination) trip.destination = destination;
    if (startDate) trip.startDate = startDate;
    if (endDate) trip.endDate = endDate;
    if (baseCurrency) trip.baseCurrency = baseCurrency.toUpperCase();
    if (budget !== undefined) trip.budget = Number(budget);
    if (categoryBudgets !== undefined) trip.categoryBudgets = categoryBudgets;
    if (packingList !== undefined) trip.packingList = packingList;

    await trip.save();

    const updatedTrip = await Trip.findById(trip._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      success: true,
      data: updatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a trip
// @route   DELETE /api/v1/trips/:id
// @access  Private (Owner only)
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the trip owner can delete this trip',
      });
    }

    // Delete all expenses associated with this trip
    await Expense.deleteMany({ trip: trip._id });
    await trip.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Trip and associated expenses deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to trip
// @route   POST /api/v1/trips/:id/members
// @access  Private
const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user email to invite',
      });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify members for this trip',
      });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: `No user found registered with email "${email}"`,
      });
    }

    const alreadyMember = trip.members.some(
      (m) => m.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this trip',
      });
    }

    trip.members.push(userToAdd._id);
    await trip.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      success: true,
      message: `${userToAdd.name} added to trip successfully`,
      data: populatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from trip
// @route   DELETE /api/v1/trips/:id/members/:userId
// @access  Private
const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Owner cannot be removed
    if (trip.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Trip owner cannot be removed from the trip',
      });
    }

    // Only owner or the member themselves can perform removal
    const isOwner = trip.owner.toString() === req.user._id.toString();
    const isSelf = req.user._id.toString() === userId;

    if (!isOwner && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this member',
      });
    }

    trip.members = trip.members.filter(
      (m) => m.toString() !== userId
    );

    await trip.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: populatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add itinerary stop
// @route   POST /api/v1/trips/:id/itinerary
// @access  Private
const addItineraryStop = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit itinerary',
      });
    }

    const {
      title,
      description,
      location,
      latitude,
      longitude,
      date,
      startTime,
      endTime,
      category,
      notes,
    } = req.body;

    const newStop = {
      title,
      description: description || '',
      location: location || '',
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      date,
      startTime: startTime || '09:00',
      endTime: endTime || '10:00',
      category: category || 'Activity',
      notes: notes || '',
    };

    trip.itinerary.push(newStop);
    await trip.save();

    const addedStop = trip.itinerary[trip.itinerary.length - 1];

    res.status(201).json({
      success: true,
      data: addedStop,
      itinerary: trip.itinerary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get itinerary stops for a trip
// @route   GET /api/v1/trips/:id/itinerary
// @access  Private
const getItinerary = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view itinerary',
      });
    }

    res.status(200).json({
      success: true,
      count: trip.itinerary.length,
      data: trip.itinerary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an itinerary stop
// @route   PUT /api/v1/trips/:id/itinerary/:stopId
// @access  Private
const updateItineraryStop = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { id, stopId } = req.params;
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit itinerary',
      });
    }

    const stop = trip.itinerary.id(stopId);
    if (!stop) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary stop not found',
      });
    }

    const {
      title,
      description,
      location,
      latitude,
      longitude,
      date,
      startTime,
      endTime,
      category,
      notes,
    } = req.body;

    if (title) stop.title = title;
    if (description !== undefined) stop.description = description;
    if (location !== undefined) stop.location = location;
    if (latitude !== undefined) stop.latitude = latitude != null ? Number(latitude) : null;
    if (longitude !== undefined) stop.longitude = longitude != null ? Number(longitude) : null;
    if (date) stop.date = date;
    if (startTime) stop.startTime = startTime;
    if (endTime) stop.endTime = endTime;
    if (category) stop.category = category;
    if (notes !== undefined) stop.notes = notes;

    await trip.save();

    res.status(200).json({
      success: true,
      data: stop,
      itinerary: trip.itinerary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an itinerary stop
// @route   DELETE /api/v1/trips/:id/itinerary/:stopId
// @access  Private
const deleteItineraryStop = async (req, res, next) => {
  try {
    const { id, stopId } = req.params;
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!isTripMemberOrOwner(trip, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit itinerary',
      });
    }

    const stop = trip.itinerary.id(stopId);
    if (!stop) {
      return res.status(404).json({
        success: false,
        message: 'Itinerary stop not found',
      });
    }

    trip.itinerary.pull(stopId);
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Itinerary stop deleted successfully',
      itinerary: trip.itinerary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  addMember,
  removeMember,
  addItineraryStop,
  getItinerary,
  updateItineraryStop,
  deleteItineraryStop,
};
