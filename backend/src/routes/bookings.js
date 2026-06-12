import { Router } from 'express';
import {
  createBooking,
  cancelBooking,
  getBookingsByEmail,
  getAllBookings,
} from '../services/bookingService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const booking = await createBooking(req.body);
    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
});

router.get('/all', async (req, res, next) => {
  try {
    const bookings = await getAllBookings();
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'email query param is required' });
    }

    const bookings = await getBookingsByEmail(email);
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const result = await cancelBooking(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
