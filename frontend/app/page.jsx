'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getRooms } from '@/lib/api';
import RoomCard from '@/components/RoomCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRooms()
      .then((data) => setRooms(data.rooms))
      .catch(() => toast.error('Could not load rooms'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <section className="card bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <p className="text-sm font-medium text-brand-100">RoomIt</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Book a meeting room</h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-100 sm:text-base">
          Pick a room, choose consecutive 30-minute slots, and book instantly.
          Conflicts are blocked at the database level — no double bookings.
        </p>
      </section>

      {loading ? (
        <LoadingSpinner label="Loading rooms..." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room._id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
