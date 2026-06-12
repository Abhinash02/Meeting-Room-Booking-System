import mongoose from 'mongoose';

const BOOKING_STATUSES = [
  'confirmed',
  'cancelled-refundable',
  'cancelled-non-refundable',
];

const bookingSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    bookedBy: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
    },
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'confirmed',
    },
    durationMinutes: { type: Number, required: true },
  },
  { timestamps: true }
);

bookingSchema.index({ 'bookedBy.email': 1, date: 1, status: 1 });
bookingSchema.index({ room: 1, date: 1, status: 1 });

export { BOOKING_STATUSES };
export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
