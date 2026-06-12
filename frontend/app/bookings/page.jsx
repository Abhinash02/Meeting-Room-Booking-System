'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cancelBooking, getBookings } from '@/lib/api';
import BookingCard from '@/components/BookingCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function BookingsPage() {
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  async function handleSearch(event) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await getBookings(trimmed);
      setBookings(data.bookings);
    } catch {
      toast.error('Could not fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(booking) {
    const confirmed = window.confirm(
      `Cancel "${booking.title}" on ${booking.date} (${booking.startTime}–${booking.endTime})?`
    );
    if (!confirmed) return;

    setCancellingId(booking._id);
    try {
      const result = await cancelBooking(booking._id);
      toast.success(result.message);
      setBookings((prev) =>
        prev.map((item) => (item._id === booking._id ? result.booking : item))
      );
    } catch (error) {
      toast.error(error.message || 'Cancellation failed');
    } finally {
      setCancellingId(null);
    }
  }

  const upcoming = bookings.filter((b) => b.status === 'confirmed');
  const history = bookings.filter((b) => b.status !== 'confirmed');

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Look up bookings by email. Cancellation refund status is computed server-side
          (≥2 hours before start = refundable).
        </p>

        <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            className="input-field sm:flex-1"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Find bookings'}
          </button>
        </form>
      </section>

      {loading && <LoadingSpinner label="Fetching bookings..." />}

      {!loading && searched && bookings.length === 0 && (
        <div className="card text-center text-sm text-slate-500">
          No bookings found for this email.
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Upcoming
          </h2>
          {upcoming.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onCancel={handleCancel}
              cancellingId={cancellingId}
            />
          ))}
        </section>
      )}

      {!loading && history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Past & cancelled
          </h2>
          {history.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onCancel={handleCancel}
              cancellingId={cancellingId}
            />
          ))}
        </section>
      )}
    </div>
  );
}
