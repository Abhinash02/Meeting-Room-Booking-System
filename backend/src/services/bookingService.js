import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import BookingSlot from '../models/BookingSlot.js';
import RoomDateLock from '../models/RoomDateLock.js';
import {
  buildSlotRange,
  getBookingStartDateTime,
  getDurationMinutes,
} from '../utils/time.js';
import { slotsAreBookable } from './availabilityService.js';
import { reserveDailyQuota, releaseDailyQuota } from './quotaService.js';

const REFUND_WINDOW_MS = 2 * 60 * 60 * 1000;

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

export async function createBooking(payload) {
  const { roomId, date, startTime, endTime, bookedBy, title } = payload;

  if (!roomId || !date || !startTime || !endTime || !bookedBy?.email || !bookedBy?.name || !title) {
    const err = new Error('Missing required booking fields');
    err.status = 400;
    throw err;
  }

  let requestedSlots;
  try {
    requestedSlots = buildSlotRange(startTime, endTime);
  } catch (error) {
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }

  const durationMinutes = getDurationMinutes(startTime, endTime);
  const email = bookedBy.email.toLowerCase();

  const session = await mongoose.startSession();

  try {
    let createdBooking = null;

    await session.withTransaction(async () => {
      // 1. Acquire Room+Date lock to serialize concurrent requests and make the buffer check race-safe
      await RoomDateLock.findOneAndUpdate(
        { room: roomId, date },
        { $inc: { version: 1 } },
        { upsert: true, new: true, session }
      );

      const availability = await slotsAreBookable(roomId, date, requestedSlots);
      if (!availability.ok) {
        const err = new Error(availability.reason);
        err.status = 409;
        throw err;
      }

      const quota = await reserveDailyQuota(email, date, durationMinutes, session);
      if (!quota.ok) {
        const err = new Error(quota.reason);
        err.status = 409;
        err.details = { date: quota.date, quota: quota };
        throw err;
      }

      const [booking] = await Booking.create(
        [
          {
            room: roomId,
            date,
            startTime,
            endTime,
            bookedBy: { name: bookedBy.name.trim(), email },
            title: title.trim(),
            status: 'confirmed',
            durationMinutes,
          },
        ],
        { session }
      );

      const slotDocs = requestedSlots.map((slot) => ({
        room: roomId,
        date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        booking: booking._id,
        bookedByEmail: email,
      }));

      await BookingSlot.insertMany(slotDocs, { session, ordered: true });
      createdBooking = booking;
    });

    return await Booking.findById(createdBooking._id).populate('room').lean();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const err = new Error('One or more slots are already booked');
      err.status = 409;
      throw err;
    }
    throw error;
  } finally {
    session.endSession();
  }
}

export async function cancelBooking(bookingId) {
  const session = await mongoose.startSession();

  try {
    let result = null;

    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        const err = new Error('Booking not found');
        err.status = 404;
        throw err;
      }

      if (booking.status !== 'confirmed') {
        const err = new Error('Booking is already cancelled');
        err.status = 400;
        throw err;
      }

      const startAt = getBookingStartDateTime(booking.date, booking.startTime);
      const now = new Date();
      const msUntilStart = startAt.getTime() - now.getTime();
      const refundable = msUntilStart >= REFUND_WINDOW_MS;

      booking.status = refundable ? 'cancelled-refundable' : 'cancelled-non-refundable';
      await booking.save({ session });

      await BookingSlot.deleteMany({ booking: booking._id }).session(session);
      await releaseDailyQuota(booking.bookedBy.email, booking.date, booking.durationMinutes, session);

      result = {
        booking: await Booking.findById(booking._id).populate('room').session(session).lean(),
        refundable,
        message: refundable
          ? 'Cancelled with refundable status (≥2 hours before start)'
          : 'Cancelled with non-refundable status (<2 hours before start)',
      };
    });

    return result;
  } finally {
    session.endSession();
  }
}

export async function getBookingsByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return Booking.find({ 'bookedBy.email': normalized })
    .populate('room')
    .sort({ date: -1, startTime: -1 })
    .lean();
}

export async function getAllBookings() {
  return Booking.find({})
    .populate('room')
    .sort({ date: -1, startTime: -1 })
    .lean();
}
