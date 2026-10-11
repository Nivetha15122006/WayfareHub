const express = require('express');
const { body } = require('express-validator');
const { register, login, adminLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').trim().notEmpty().withMessage('Please provide your email or username'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post(
  '/admin-login',
  [
    body('email').trim().notEmpty().withMessage('Please provide your admin username or email'),
    body('password').notEmpty().withMessage('Admin password is required'),
  ],
  adminLogin
);

router.get('/me', protect, getMe);

module.exports = router;

