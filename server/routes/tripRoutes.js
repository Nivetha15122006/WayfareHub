const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All trip routes are protected
router.use(protect);

// Trip CRUD
router
  .route('/')
  .post(
    [
      body('title').trim().notEmpty().withMessage('Trip title is required'),
      body('destination').trim().notEmpty().withMessage('Destination is required'),
      body('startDate').notEmpty().withMessage('Start date is required'),
      body('endDate').notEmpty().withMessage('End date is required'),
    ],
    createTrip
  )
  .get(getTrips);

router
  .route('/:id')
  .get(getTripById)
  .put(
    [
      body('title').optional().trim().notEmpty().withMessage('Trip title cannot be empty'),
      body('destination').optional().trim().notEmpty().withMessage('Destination cannot be empty'),
    ],
    updateTrip
  )
  .delete(deleteTrip);

// Member Management
router.post(
  '/:id/members',
  [body('email').isEmail().normalizeEmail().withMessage('Valid user email is required to add member')],
  addMember
);
router.delete('/:id/members/:userId', removeMember);

// Itinerary Management
router
  .route('/:id/itinerary')
  .post(
    [
      body('title').trim().notEmpty().withMessage('Stop title is required'),
      body('date').notEmpty().withMessage('Stop date is required'),
    ],
    addItineraryStop
  )
  .get(getItinerary);

router
  .route('/:id/itinerary/:stopId')
  .put(
    [
      body('title').optional().trim().notEmpty().withMessage('Stop title cannot be empty'),
      body('date').optional().notEmpty().withMessage('Stop date cannot be empty'),
    ],
    updateItineraryStop
  )
  .delete(deleteItineraryStop);

module.exports = router;
