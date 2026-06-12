'use client';

function parseMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function SlotGrid({ slots, selectedRange, onSelectSlot }) {
  if (!slots?.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">No slots available for this date.</p>
    );
  }

  const selectedStart = selectedRange?.startTime ? parseMinutes(selectedRange.startTime) : null;
  const selectedEnd = selectedRange?.endTime ? parseMinutes(selectedRange.endTime) : null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {slots.map((slot) => {
        const start = parseMinutes(slot.startTime);
        const end = parseMinutes(slot.endTime);
        const inRange =
          selectedStart !== null &&
          selectedEnd !== null &&
          start >= selectedStart &&
          end <= selectedEnd;

        let stateClass = 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50';

        if (!slot.available) {
          stateClass = 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400';
        } else if (inRange) {
          stateClass = 'border-brand-500 bg-brand-600 text-white shadow-sm';
        }

        return (
          <button
            key={slot.startTime}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelectSlot(slot)}
            className={`rounded-lg border px-2 py-3 text-center text-xs font-medium transition sm:text-sm ${stateClass}`}
          >
            <span className="block">{slot.startTime}</span>
            <span className="mt-0.5 block text-[10px] opacity-80 sm:text-xs">
              {slot.available ? 'Available' : 'Booked'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
