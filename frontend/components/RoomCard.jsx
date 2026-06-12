import Link from 'next/link';

export default function RoomCard({ room }) {
  const id = room._id || room.id;

  return (
    <Link
      href={`/rooms/${id}`}
      className="group card flex flex-col gap-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">
            {room.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {room.location} · {room.floor}
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
          {room.capacity} seats
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          {room.bufferMinutes} min cleanup buffer
        </span>
        <span className="font-medium text-brand-600 group-hover:underline">
          View slots →
        </span>
      </div>
    </Link>
  );
}
