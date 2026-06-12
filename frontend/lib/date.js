export function todayString() {
  const now = new Date();
  return formatDateInput(now);
}

export function formatDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimeRange(start, end) {
  return `${start} – ${end}`;
}

export function isPastBooking(date, endTime) {
  const [y, m, d] = date.split('-').map(Number);
  const [hours, minutes] = endTime.split(':').map(Number);
  const end = new Date(y, m - 1, d, hours, minutes);
  return end < new Date();
}
