import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import roomsRouter from './routes/rooms.js';
import bookingsRouter from './routes/bookings.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

const allowedOrigin = process.env.CORS_ORIGIN || '*';

app.use(
  cors({
    origin: allowedOrigin === '*' ? true : allowedOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/', (_req, res) => {
  res.json({ message: 'RoomIt API is running. Access endpoints via /api' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);

app.use(errorHandler);

export default app;
