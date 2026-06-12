import mongoose from 'mongoose';

const roomDateLockSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: String, required: true },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

roomDateLockSchema.index({ room: 1, date: 1 }, { unique: true });

export default mongoose.models.RoomDateLock ||
  mongoose.model('RoomDateLock', roomDateLockSchema);
