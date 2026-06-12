import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import BookingSlot from '../models/BookingSlot.js';
import DailyQuota from '../models/DailyQuota.js';
import { buildSlotRange, getDurationMinutes } from '../utils/time.js';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base, days) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function roundToNextSlot(date) {
  const copy = new Date(date);
  const minutes = copy.getMinutes();
  const remainder = minutes % 30;
  if (remainder !== 0) {
    copy.setMinutes(minutes + (30 - remainder), 0, 0);
  } else {
    copy.setSeconds(0, 0);
  }
  return copy;
}

function timeFromDate(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function seedBookings(rooms) {
  const today = new Date();
  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(addDays(today, 1));

  const soonStart = roundToNextSlot(addMinutes(today, 90));
  const soonEnd = addMinutes(soonStart, 60);

  const nearRefundStart = roundToNextSlot(addMinutes(today, 100));
  const nearRefundEnd = addMinutes(nearRefundStart, 60);

  const seedData = [
    {
      room: rooms[0]._id,
      date: todayStr,
      startTime: '09:00',
      endTime: '10:30',
      bookedBy: { name: 'Priya Sharma', email: 'priya@roomit.local' },
      title: 'Sprint Planning',
    },
    {
      room: rooms[0]._id,
      date: todayStr,
      startTime: timeFromDate(soonStart),
      endTime: timeFromDate(soonEnd),
      bookedBy: { name: 'Rahul Mehta', email: 'rahul@roomit.local' },
      title: 'Client Demo (refund test)',
    },
    {
      room: rooms[1]._id,
      date: todayStr,
      startTime: timeFromDate(nearRefundStart),
      endTime: timeFromDate(nearRefundEnd),
      bookedBy: { name: 'Ananya Iyer', email: 'ananya@roomit.local' },
      title: 'Near refund window booking',
    },
    {
      room: rooms[1]._id,
      date: todayStr,
      startTime: '14:00',
      endTime: '15:30',
      bookedBy: { name: 'Vikram Patel', email: 'vikram@roomit.local' },
      title: 'Design Review',
    },
    {
      room: rooms[2]._id,
      date: tomorrowStr,
      startTime: '10:00',
      endTime: '12:00',
      bookedBy: { name: 'Sneha Rao', email: 'sneha@roomit.local' },
      title: 'Quarterly Review',
    },
    {
      room: rooms[3]._id,
      date: tomorrowStr,
      startTime: '11:00',
      endTime: '12:30',
      bookedBy: { name: 'Arjun Das', email: 'arjun@roomit.local' },
      title: 'Engineering Sync',
    },
    {
      room: rooms[2]._id,
      date: formatDate(addDays(today, 2)),
      startTime: '15:00',
      endTime: '16:00',
      bookedBy: { name: 'Priya Sharma', email: 'priya@roomit.local' },
      title: '1:1 Session',
    },
  ];

  for (const item of seedData) {
    const slots = buildSlotRange(item.startTime, item.endTime);
    const durationMinutes = getDurationMinutes(item.startTime, item.endTime);

    const booking = await Booking.create({
      room: item.room,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      bookedBy: item.bookedBy,
      title: item.title,
      status: 'confirmed',
      durationMinutes,
    });

    await BookingSlot.insertMany(
      slots.map((slot) => ({
        room: item.room,
        date: item.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        booking: booking._id,
        bookedByEmail: item.bookedBy.email.toLowerCase(),
      }))
    );

    await DailyQuota.findOneAndUpdate(
      { email: item.bookedBy.email.toLowerCase(), date: item.date },
      { $inc: { usedMinutes: durationMinutes } },
      { upsert: true }
    );
  }
}

async function seed() {
  await connectDB();

  await BookingSlot.deleteMany({});
  await Booking.deleteMany({});
  await DailyQuota.deleteMany({});
  await Room.deleteMany({});

  const rooms = await Room.create([
    {
      name: 'Aurora',
      location: 'East Wing',
      floor: '3rd Floor',
      capacity: 8,
      bufferMinutes: 10,
    },
    {
      name: 'Summit',
      location: 'West Wing',
      floor: '2nd Floor',
      capacity: 12,
      bufferMinutes: 10,
    },
    {
      name: 'Harbor',
      location: 'North Wing',
      floor: '4th Floor',
      capacity: 6,
      bufferMinutes: 15,
    },
    {
      name: 'Cedar',
      location: 'South Wing',
      floor: '1st Floor',
      capacity: 10,
      bufferMinutes: 10,
    },
  ]);

  await seedBookings(rooms);

  console.log('Seed complete:');
  console.log(`  Rooms: ${rooms.length}`);
  console.log(`  Bookings: ${await Booking.countDocuments()}`);
  console.log(`  Slots: ${await BookingSlot.countDocuments()}`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
