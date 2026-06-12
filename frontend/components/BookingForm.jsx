'use client';

import { useState } from 'react';

export default function BookingForm({ selectedRange, onSubmit, submitting }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({ name: name.trim(), email: email.trim(), title: title.trim() });
  }

  const hasSelection = selectedRange?.startTime && selectedRange?.endTime;

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Book selected slots</h3>
        <p className="mt-1 text-sm text-slate-500">
          {hasSelection
            ? `${selectedRange.startTime} – ${selectedRange.endTime}`
            : 'Select consecutive available slots on the grid'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Your name
          </label>
          <input
            id="name"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Work email
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@company.com"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-slate-700">
          Meeting title
        </label>
        <input
          id="title"
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Weekly standup"
          required
        />
      </div>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Daily limit: 4 hours per person across all rooms. Buffer time after each booking is enforced server-side.
      </p>

      <button type="submit" className="btn-primary w-full" disabled={!hasSelection || submitting}>
        {submitting ? 'Booking...' : 'Confirm booking'}
      </button>
    </form>
  );
}
