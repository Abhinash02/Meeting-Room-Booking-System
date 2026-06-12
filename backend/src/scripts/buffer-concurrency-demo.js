import 'dotenv/config';

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function postBooking(payload) {
  const response = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function getRooms() {
  const response = await fetch(`${API_BASE}/rooms`);
  const data = await response.json();
  return data.rooms;
}

function randomFutureDate() {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * 270) + 30);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function run() {
  const rooms = await getRooms();
  if (!rooms?.length) {
    console.error('No rooms found. Run npm run seed first.');
    process.exit(1);
  }

  // Find a room with a buffer
  const room = rooms.find(r => r.bufferMinutes > 0) || rooms[0];
  const roomId = room._id || room.id;
  const date = randomFutureDate();

  console.log(`Using room ${room.name} with buffer ${room.bufferMinutes}m`);

  const payloadA = {
    roomId,
    date,
    startTime: '10:00',
    endTime: '11:00', // Ends at 11:00. Buffer is 10 min, so blocks until 11:10
    bookedBy: { name: 'User A', email: `user-a-buffer-${Math.random()}@test.local` },
    title: 'Meeting A',
  };

  const payloadB = {
    roomId,
    date,
    startTime: '11:00', // Starts at 11:00. Overlaps with A's buffer!
    endTime: '12:00',
    bookedBy: { name: 'User B', email: `user-b-buffer-${Math.random()}@test.local` },
    title: 'Meeting B',
  };

  console.log('Firing two simultaneous booking requests that conflict on buffer time...\n');
  console.log(`Request A: 10:00 - 11:00`);
  console.log(`Request B: 11:00 - 12:00`);

  const [first, second] = await Promise.all([
    postBooking(payloadA),
    postBooking(payloadB),
  ]);

  console.log('Request A:', first.status, first.data.error || 'success');
  console.log('Request B:', second.status, second.data.error || 'success');

  const successes = [first, second].filter((r) => r.status === 201).length;
  const conflicts = [first, second].filter((r) => r.status === 409).length;

  console.log('\nResult:');
  console.log(`  Successes: ${successes}`);
  console.log(`  Conflicts (409): ${conflicts}`);

  if (successes === 1 && conflicts === 1) {
    console.log('\nPASS — exactly one booking succeeded, buffer was respected under concurrency.');
    process.exit(0);
  }

  console.log('\nFAIL — expected exactly one success and one 409 conflict.');
  process.exit(1);
}

run().catch((error) => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
