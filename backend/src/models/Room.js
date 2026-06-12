import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    floor: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    bufferMinutes: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Room || mongoose.model('Room', roomSchema);
