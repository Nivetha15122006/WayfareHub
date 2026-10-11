const mongoose = require('mongoose');
const seedAdmin = require('./seedAdmin');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wayfarehub');
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    await seedAdmin();
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
