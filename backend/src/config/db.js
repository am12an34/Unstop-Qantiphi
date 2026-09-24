const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set in backend/.env, falling back to local MongoDB');
  }
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
