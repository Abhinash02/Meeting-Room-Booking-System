'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { createBooking, getAvailability } from '@/lib/api';
import { formatDisplayDate, todayString } from '@/lib/date';
import SlotGrid from '@/components/SlotGrid';
import BookingForm from '@/components/BookingForm';
import LoadingSpinner from '@/components/LoadingSpinner';

function parseMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function buildRangeFromSlots(slots) {
  if (!slots.length) return null;
  const sorted = [...slots].sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime));
  return {
    startTime: sorted[0].startTime,
    endTime: sorted[sorted.length - 1].endTime,
  };
}

export default function RoomPage() {
  const { id } = useParams();
  const [date, setDate] = useState(todayString());
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAvailability(id, date);
      setAvailability(data);
      setSelectedSlots([]);
    } catch {
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [id, date]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  function handleSlotClick(slot) {
    if (!slot.available) return;

    if (!selectedSlots.length) {
      setSelectedSlots([slot]);
      return;
    }

    const clickedStart = parseMinutes(slot.startTime);
    const range = buildRangeFromSlots(selectedSlots);
    const rangeStart = parseMinutes(range.startTime);
    const rangeEnd = parseMinutes(range.endTime);

    if (clickedStart === rangeStart && selectedSlots.length === 1) {
      setSelectedSlots([]);
      return;
    }

    if (clickedStart < rangeStart || clickedStart >= rangeEnd) {
      const newStart = Math.min(rangeStart, clickedStart);
      const newEnd = Math.max(rangeEnd, clickedStart + 30);
      const slotsInRange = availability.slots.filter((s) => {
        const start = parseMinutes(s.startTime);
        return start >= newStart && start < newEnd;
      });

      const allAvailable = slotsInRange.every((s) => s.available);
      if (!allAvailable) {
        toast.error('Selection must be consecutive and fully available');
        setSelectedSlots([slot]);
        return;
      }

      setSelectedSlots(slotsInRange);
      return;
    }

    setSelectedSlots([slot]);
  }

  async function handleBooking(formData) {
    const range = buildRangeFromSlots(selectedSlots);
    if (!range) {
      toast.error('Select at least one slot');
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        roomId: id,
        date,
        startTime: range.startTime,
        endTime: range.endTime,
        bookedBy: { name: formData.name, email: formData.email },
        title: formData.title,
      });
      toast.success('Booking confirmed');
      await fetchAvailability();
    } catch (error) {
      toast.error(error.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedRange = buildRangeFromSlots(selectedSlots);
  const room = availability?.room;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="text-sm text-brand-600 hover:underline">
            ← All rooms
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {room?.name || 'Room availability'}
          </h1>
          {room && (
            <p className="text-sm text-slate-500">
              {room.location} · {room.floor} · {room.capacity} seats · {room.bufferMinutes} min buffer
            </p>
          )}
        </div>

        <div className="card w-full max-w-xs p-3 sm:p-4">
          <label htmlFor="date" className="mb-1.5 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="input-field"
            value={date}
            min={todayString()}
            onChange={(e) => setDate(e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-500">{formatDisplayDate(date)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">30-minute slots</h2>
            <button
              type="button"
              onClick={fetchAvailability}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading slots..." />
          ) : (
            <SlotGrid
              slots={availability?.slots}
              selectedRange={selectedRange}
              onSelectSlot={handleSlotClick}
            />
          )}

          <p className="mt-4 text-xs text-slate-500">
            Click a slot to start, then click another to select a consecutive range.
            Unavailable slots include existing bookings and cleanup buffer time.
          </p>
        </div>

        <BookingForm
          selectedRange={selectedRange}
          onSubmit={handleBooking}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
