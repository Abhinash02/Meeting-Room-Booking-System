import mongoose from 'mongoose';

const bookingSlotSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    bookedByEmail: { type: String, required: true, lowercase: true },
  },
  { timestamps: true }
);

bookingSlotSchema.index(
  { room: 1, date: 1, startTime: 1 },
  { unique: true, name: 'unique_room_date_slot' }
);

bookingSlotSchema.index({ booking: 1 });
bookingSlotSchema.index({ bookedByEmail: 1, date: 1 });

export default mongoose.models.BookingSlot ||
  mongoose.model('BookingSlot', bookingSlotSchema);
