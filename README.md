# RoomIt — Meeting Room Booking System

Internal tool for booking meeting rooms with database-level conflict prevention, server-side refund rules, buffer time, and per-user daily quotas.

## Live deployment

| Service  | URL |
|----------|-----|
| Frontend | _Add your Vercel frontend URL after deploy_ |
| Backend  | _Add your Vercel backend URL after deploy_ |

## Section 4 items implemented

- **4.3 Buffer time between bookings** — Each room has a configurable `bufferMinutes` field. Availability and booking validation treat post-booking buffer as unavailable at the API/DB layer.
- **4.5 Per-user daily booking quota** — Max 4 hours/day per email, enforced with atomic `DailyQuota` updates inside MongoDB transactions. Cancelling frees quota.

## Concurrency approach (Section 3.1)

Double-booking is prevented with a **unique compound index** on `BookingSlot`:

```
{ room, date, startTime } — unique
```

Each 30-minute slot is stored as its own document. Multi-slot bookings insert all slot documents inside a **MongoDB transaction**. If two requests race for the same slot, one insert hits the unique index (`E11000`) and the entire transaction rolls back → **409 Conflict**.

This is not read-then-write alone — the unique index is the final authority even when two requests pass an availability pre-check simultaneously.

### Demo concurrent booking test

```bash
# Terminal 1 — start API
cd backend && npm run dev

# Terminal 2 — seed + run race demo
cd backend && npm run seed
npm run test:concurrency
```

Expected output: exactly **1 success (201)** and **1 conflict (409)**.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, react-hot-toast, JSX
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas (or local MongoDB)

## Project structure

```
Meeting Room Booking System/
├── frontend/          # Next.js app (deploy to Vercel)
├── backend/           # Express API (deploy to Vercel)
└── README.md
```

## Local setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (free tier works). **Replica set is required** for multi-document transactions used in booking creation.

### 1. Backend

```bash
cd backend
cp .env.example .env
# Set MONGODB_URI in .env

npm install
npm run seed
npm run dev
```

API runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api

npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Environment variables

### Backend (`backend/.env`)

| Variable      | Description                          |
|---------------|--------------------------------------|
| `MONGODB_URI` | MongoDB connection string            |
| `PORT`        | Server port (default 5000)           |
| `CORS_ORIGIN` | Allowed frontend origin(s)           |

### Frontend (`frontend/.env.local`)

| Variable               | Description        |
|------------------------|--------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base   |

## API endpoints

| Method | Endpoint                              | Description                    |
|--------|---------------------------------------|--------------------------------|
| GET    | `/api/rooms`                          | List all rooms                 |
| GET    | `/api/rooms/:id/availability?date=`   | 30-min slot grid               |
| POST   | `/api/bookings`                       | Create booking (multi-slot)    |
| GET    | `/api/bookings?email=`                | User's bookings                |
| PATCH  | `/api/bookings/:id/cancel`            | Cancel with refund status      |

### Create booking body

```json
{
  "roomId": "...",
  "date": "2026-06-15",
  "startTime": "10:00",
  "endTime": "11:30",
  "bookedBy": { "name": "Jane Doe", "email": "jane@company.com" },
  "title": "Sprint planning"
}
```

## Deploy to Vercel

Deploy **frontend** and **backend** as two separate Vercel projects.

### Backend

1. Import the repo, set root directory to `backend`
2. Add env vars: `MONGODB_URI`, `CORS_ORIGIN` (your frontend URL)
3. Deploy — Vercel uses `api/index.js` via `vercel.json`

### Frontend

1. Import the repo, set root directory to `frontend`
2. Add env var: `NEXT_PUBLIC_API_URL` = `https://your-backend.vercel.app/api`
3. Deploy

After both are live, update the deployment URLs at the top of this README.

## Refund window (Section 3.2)

Cancellation uses **server clock** at request time:

- ≥ 2 hours before `date + startTime` → `cancelled-refundable`
- < 2 hours → `cancelled-non-refundable`

Cancelled slots are deleted immediately, freeing the room (and buffer window) for new bookings.

## Seed data

The seed script creates 4 rooms and mixed bookings, including some starting within ~90–100 minutes for refund-window testing.

## Assumptions noted

- Operating hours: **08:00–20:00**, 30-minute slots
- No authentication — bookings identified by email only
- "Refund" is a status flag only (no payment integration)
- Quota is 4 hours per email per calendar day across all rooms

