const express = require('express');
const { body } = require('express-validator');
const {
  createExpense,
  getTripExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getSettlements,
  recordSettlement,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All expense routes are protected
router.use(protect);

router
  .route('/')
  .post(
    [
      body('trip').notEmpty().withMessage('Trip ID is required'),
      body('description').trim().notEmpty().withMessage('Description is required'),
      body('amount').isNumeric().withMessage('Amount must be a numeric value'),
      body('currency').trim().notEmpty().withMessage('Currency code is required'),
    ],
    createExpense
  );

router.get('/trip/:tripId', getTripExpenses);
router.get('/trip/:tripId/settlements', getSettlements);
router.post('/trip/:tripId/settle', recordSettlement);

router
  .route('/:id')
  .get(getExpenseById)
  .put(
    [
      body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
      body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    ],
    updateExpense
  )
  .delete(deleteExpense);

module.exports = router;
