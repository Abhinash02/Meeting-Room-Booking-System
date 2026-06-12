'use client';

import { useEffect, useState } from 'react';
import { fetchAllBookings } from '@/lib/api';
import { formatDisplayDate } from '@/lib/date';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('confirmed'); // 'confirmed' or 'canceled'

  useEffect(() => {
    async function loadBookings() {
      try {
        const data = await fetchAllBookings();
        setBookings(data.bookings || []);
      } catch (err) {
        setError('Failed to load global bookings.');
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const canceledBookings = bookings.filter((b) => b.status.startsWith('cancelled'));

  const displayBookings = activeTab === 'confirmed' ? confirmedBookings : canceledBookings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Global Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          View all system bookings across all rooms and users.
        </p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'confirmed'
              ? 'border-b-2 border-indigo-500 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Confirmed ({confirmedBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('canceled')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'canceled'
              ? 'border-b-2 border-indigo-500 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Canceled ({canceledBookings.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading dashboard..." />
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : displayBookings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No {activeTab} bookings found in the system.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayBookings.map((booking) => (
            <div key={booking._id} className="card flex flex-col justify-between">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {booking.room?.name || 'Unknown Room'}
                  </span>
                  <span className="text-xs text-slate-500">{formatDisplayDate(booking.date)}</span>
                </div>
                <h3 className="font-semibold text-slate-900 line-clamp-1">{booking.title}</h3>
                <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                  Booked by: {booking.bookedBy.name} ({booking.bookedBy.email})
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-slate-700">
                  <svg className="mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {booking.startTime} - {booking.endTime}
                </div>
              </div>

              {activeTab === 'canceled' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    booking.status === 'cancelled-refundable'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {booking.status === 'cancelled-refundable' ? 'Refundable' : 'Non-Refundable'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
