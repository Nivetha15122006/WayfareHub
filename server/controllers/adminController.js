const User = require('../models/User');
const Trip = require('../models/Trip');
const Expense = require('../models/Expense');

// @desc    Get system-wide platform statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTrips, totalExpenses, expenseAgg, popularDestinations] = await Promise.all([
      User.countDocuments(),
      Trip.countDocuments(),
      Expense.countDocuments(),
      Expense.aggregate([
        {
          $group: {
            _id: '$baseCurrency',
            totalAmount: { $sum: '$convertedAmount' },
            count: { $sum: 1 },
          },
        },
      ]),
      Trip.aggregate([
        {
          $group: {
            _id: '$destination',
            tripCount: { $sum: 1 },
          },
        },
        { $sort: { tripCount: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const activeCurrencies = await Trip.distinct('baseCurrency');

    // Calculate approximate total spending volume
    const totalVolume = expenseAgg.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTrips,
          totalExpenses,
          totalVolume: Math.round(totalVolume * 100) / 100,
          activeCurrenciesCount: activeCurrencies.length,
          activeCurrencies,
        },
        spendingByCurrency: expenseAgg,
        popularDestinations: popularDestinations.map((d) => ({
          destination: d._id,
          count: d.tripCount,
        })),
        systemHealth: {
          database: 'Connected (MongoDB)',
          fxEngine: 'Active (Frankfurter ECB API)',
          uptime: Math.round(process.uptime()),
          nodeVersion: process.version,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin view)
// @route   GET /api/v1/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Populate user trip counts
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const tripCount = await Trip.countDocuments({
          $or: [{ owner: u._id }, { members: u._id }],
        });
        return {
          ...u.toObject(),
          tripCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: usersWithCounts.length,
      data: usersWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trips system-wide (Admin view)
// @route   GET /api/v1/admin/trips
// @access  Private/Admin
const getAllTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find()
      .populate('owner', 'name email role')
      .populate('members', 'name email role')
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

// @desc    Toggle user role (user <-> admin)
// @route   PUT /api/v1/admin/users/:id/role
// @access  Private/Admin
const toggleUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Must be "user" or "admin"',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} role updated to ${role}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user by admin
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
const deleteUserByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot delete their own account',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Remove user from all trips
    await Trip.updateMany({ members: id }, { $pull: { members: id } });
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User ${user.name} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  getAllTrips,
  toggleUserRole,
  deleteUserByAdmin,
};
