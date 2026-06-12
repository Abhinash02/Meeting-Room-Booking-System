import app from '../src/app.js';
import connectDB from '../src/config/db.js';

let isConnected = false;

async function ensureDb() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}

export default async function handler(req, res) {
  await ensureDb();
  return app(req, res);
}
