const mongoose = require('mongoose');
const env = require('./env');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/eventsapp';

async function connectDB() {
  if (!env.mongoUri) {
    console.warn('MONGO_URI not set in backend/.env, falling back to local MongoDB');
  }
  await mongoose.connect(env.mongoUri || LOCAL_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
