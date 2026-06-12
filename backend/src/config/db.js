import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, indexesSynced: false };
}

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;

  if (!cached.indexesSynced) {
    const { default: BookingSlot } = await import('../models/BookingSlot.js');
    const { default: DailyQuota } = await import('../models/DailyQuota.js');
    await BookingSlot.syncIndexes();
    await DailyQuota.syncIndexes();
    cached.indexesSynced = true;
  }

  return cached.conn;
}
