const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // 1. Demote any non-Preetham users to 'user' so Hasni and other travelers don't have admin access
    await User.updateMany(
      {
        $and: [
          { email: { $ne: 'preetham@wayfarehub.com' } },
          { name: { $ne: 'Preetham' } },
        ],
      },
      { $set: { role: 'user' } }
    );

    // 2. Look for Preetham
    let admin = await User.findOne({
      $or: [
        { email: 'preetham@wayfarehub.com' },
        { name: 'Preetham' },
      ],
    }).select('+password');

    if (!admin) {
      admin = await User.create({
        name: 'Preetham',
        email: 'preetham@wayfarehub.com',
        password: 'Preetham123',
        role: 'admin',
      });
      console.log('[Seed] Dedicated Admin user "Preetham" created successfully with role "admin".');
    } else {
      admin.name = 'Preetham';
      admin.email = 'preetham@wayfarehub.com';
      admin.password = 'Preetham123';
      admin.role = 'admin';
      await admin.save();
      console.log('[Seed] Admin user "Preetham" verified and credentials synchronized.');
    }
  } catch (error) {
    console.error('[Seed] Error seeding admin account:', error.message);
  }
};

module.exports = seedAdmin;
