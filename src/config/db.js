const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dokaner_khata');
    console.log(`MongoDB Connected Successfully`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    // Don't kill process immediately in local dev so API can still respond or log
  }
};

module.exports = connectDB;
