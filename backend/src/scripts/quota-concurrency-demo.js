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

  const roomA = rooms[0]._id || rooms[0].id;
  const roomB = rooms[1]._id || rooms[1].id;
  const date = randomFutureDate();
  const email = `quota-race-${Math.random()}@test.local`;

  console.log('Step 1: Book 3.0 hours to approach the 4-hour daily limit...\n');

  const setup = await postBooking({
    roomId: roomA,
    date,
    startTime: '08:00',
    endTime: '11:00',
    bookedBy: { name: 'Quota Tester', email },
    title: 'Quota setup booking',
  });

  if (setup.status !== 201) {
    console.error('Setup booking failed:', setup.status, setup.data);
    process.exit(1);
  }

  console.log('Setup booking created (3.0 hours).\n');
  console.log('Step 2: Fire two simultaneous 1-hour requests (only one should succeed)...\n');

  const payload = {
    date,
    startTime: '12:00',
    endTime: '13:00',
    bookedBy: { name: 'Quota Tester', email },
    title: 'Quota race booking',
  };

  const [first, second] = await Promise.all([
    postBooking({ ...payload, roomId: roomA }),
    postBooking({ ...payload, roomId: roomB }),
  ]);

  console.log('Request A:', first.status, first.data.error || 'success');
  console.log('Request B:', second.status, second.data.error || 'success');

  const successes = [first, second].filter((r) => r.status === 201).length;
  const rejected = [first, second].filter((r) => r.status === 409).length;

  console.log('\nResult:');
  console.log(`  Successes: ${successes}`);
  console.log(`  Quota rejections (409): ${rejected}`);

  if (successes === 1 && rejected === 1) {
    console.log('\nPASS — daily quota held under concurrent requests.');
    process.exit(0);
  }

  console.log('\nFAIL — expected exactly one success and one 409 rejection.');
  process.exit(1);
}

run().catch((error) => {
  console.error('Demo failed:', error.message);
  process.exit(1);
});
