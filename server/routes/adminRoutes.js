const express = require('express');
const {
  getAdminStats,
  getAllUsers,
  getAllTrips,
  toggleUserRole,
  deleteUserByAdmin,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all admin routes with JWT and Admin Guard
router.use(protect);
router.use(requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/trips', getAllTrips);
router.put('/users/:id/role', toggleUserRole);
router.delete('/users/:id', deleteUserByAdmin);

module.exports = router;
