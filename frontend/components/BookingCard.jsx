'use client';

import { formatDisplayDate, formatTimeRange, isPastBooking } from '@/lib/date';

const statusStyles = {
  confirmed: 'bg-emerald-50 text-emerald-700',
  'cancelled-refundable': 'bg-sky-50 text-sky-700',
  'cancelled-non-refundable': 'bg-rose-50 text-rose-700',
};

const statusLabels = {
  confirmed: 'Confirmed',
  'cancelled-refundable': 'Cancelled · Refundable',
  'cancelled-non-refundable': 'Cancelled · Non-refundable',
};

export default function BookingCard({ booking, onCancel, cancellingId }) {
  const room = booking.room;
  const isConfirmed = booking.status === 'confirmed';
  const isPast = isPastBooking(booking.date, booking.endTime);
  const canCancel = isConfirmed && !isPast;
  const isCancelling = cancellingId === booking._id;

  return (
    <article className="card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{booking.title}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[booking.status]}`}>
              {statusLabels[booking.status]}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {room?.name} · {room?.location}
          </p>
          <p className="text-sm font-medium text-slate-800">
            {formatDisplayDate(booking.date)} · {formatTimeRange(booking.startTime, booking.endTime)}
          </p>
          <p className="text-xs text-slate-500">
            Booked by {booking.bookedBy.name} ({booking.bookedBy.email})
          </p>
        </div>

        {canCancel && (
          <button
            type="button"
            onClick={() => onCancel(booking)}
            disabled={isCancelling}
            className="btn-secondary shrink-0 text-rose-600 hover:border-rose-200 hover:bg-rose-50"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel booking'}
          </button>
        )}
      </div>
    </article>
  );
}
