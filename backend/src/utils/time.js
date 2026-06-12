const DAY_START = 8 * 60;
const DAY_END = 20 * 60;
const SLOT_MINUTES = 30;

export function parseTimeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function generateDaySlots() {
  const slots = [];
  for (let start = DAY_START; start < DAY_END; start += SLOT_MINUTES) {
    slots.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(start + SLOT_MINUTES),
    });
  }
  return slots;
}

export function buildSlotRange(startTime, endTime) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  if (start >= end) {
    throw new Error('endTime must be after startTime');
  }

  if (start < DAY_START || end > DAY_END) {
    throw new Error('Bookings must be between 08:00 and 20:00');
  }

  if ((end - start) % SLOT_MINUTES !== 0) {
    throw new Error('Booking duration must be in 30-minute increments');
  }

  const slots = [];
  for (let cursor = start; cursor < end; cursor += SLOT_MINUTES) {
    slots.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(cursor + SLOT_MINUTES),
    });
  }

  return slots;
}

export function getBookingStartDateTime(date, startTime) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = startTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function getDurationMinutes(startTime, endTime) {
  return parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
}

export { DAY_START, DAY_END, SLOT_MINUTES };
