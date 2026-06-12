const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    error.details = data.details;
    throw error;
  }

  return data;
}

export function getRooms() {
  return request('/rooms');
}

export function getAvailability(roomId, date) {
  return request(`/rooms/${roomId}/availability?date=${date}`);
}

export function createBooking(payload) {
  return request('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getBookings(email) {
  return request(`/bookings?email=${encodeURIComponent(email)}`);
}

export function cancelBooking(id) {
  return request(`/bookings/${id}/cancel`, { method: 'PATCH' });
}

export function fetchAllBookings() {
  return request('/bookings/all');
}
