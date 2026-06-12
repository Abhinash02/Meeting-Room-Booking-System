import BookingSlot from '../models/BookingSlot.js';
import Room from '../models/Room.js';
import {
  generateDaySlots,
  parseTimeToMinutes,
  minutesToTime,
} from '../utils/time.js';

function expandBlockedRanges(slots, bufferMinutes) {
  const blocked = new Set();

  for (const slot of slots) {
    const start = parseTimeToMinutes(slot.startTime);
    const end = parseTimeToMinutes(slot.endTime) + bufferMinutes;

    for (let cursor = start; cursor < end; cursor += 30) {
      blocked.add(minutesToTime(cursor));
    }
  }

  return blocked;
}

export async function getRoomAvailability(roomId, date) {
  const room = await Room.findById(roomId).lean();
  if (!room) {
    return null;
  }

  const occupiedSlots = await BookingSlot.find({ room: roomId, date }).lean();
  const blockedStarts = expandBlockedRanges(occupiedSlots, room.bufferMinutes);
  const daySlots = generateDaySlots();

  const slots = daySlots.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    available: !blockedStarts.has(slot.startTime),
  }));

  return {
    room: {
      id: room._id,
      name: room.name,
      location: room.location,
      floor: room.floor,
      capacity: room.capacity,
      bufferMinutes: room.bufferMinutes,
    },
    date,
    slots,
  };
}

export async function slotsAreBookable(roomId, date, requestedSlots) {
  const room = await Room.findById(roomId).lean();
  if (!room) {
    return { ok: false, reason: 'Room not found' };
  }

  const occupiedSlots = await BookingSlot.find({ room: roomId, date }).lean();
  const blockedStarts = expandBlockedRanges(occupiedSlots, room.bufferMinutes);

  for (const slot of requestedSlots) {
    if (blockedStarts.has(slot.startTime)) {
      return {
        ok: false,
        reason: `Slot ${slot.startTime} is not available (includes ${room.bufferMinutes}min buffer)`,
      };
    }
  }

  return { ok: true, room };
}
