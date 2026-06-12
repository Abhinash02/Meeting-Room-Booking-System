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
  // Pick a random day between 30 and 300 days in the future to avoid conflicts with previous test runs
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

  const roomId = rooms[0]._id || rooms[0].id;
  const date = randomFutureDate();

  const payload = {
    roomId,
    date,
    startTime: '16:00',
    endTime: '16:30',
    bookedBy: { name: 'Concurrency Tester', email: 'concurrency@test.local' },
    title: 'Race Condition Test',
  };

  console.log('Firing two simultaneous booking requests for the same slot...\n');

  const [first, second] = await Promise.all([
    postBooking({ ...payload, bookedBy: { ...payload.bookedBy, email: 'user-a@test.local' } }),
    postBooking({ ...payload, bookedBy: { ...payload.bookedBy, email: 'user-b@test.local' } }),
  ]);

  console.log('Request A:', first.status, first.data.error || 'success');
  console.log('Request B:', second.status, second.data.error || 'success');

  const successes = [first, second].filter((r) => r.status === 201).length;
  const conflicts = [first, second].filter((r) => r.status === 409).length;

  console.log('\nResult:');
  console.log(`  Successes: ${successes}`);
  console.log(`  Conflicts (409): ${conflicts}`);

  if (successes === 1 && conflicts === 1) {
    console.log('\nPASS — exactly one booking succeeded.');
    process.exit(0);
  }

  console.log('\nFAIL — expected exactly one success and one 409 conflict.');
  process.exit(1);
}

run().catch((error) => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
