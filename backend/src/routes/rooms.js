import { Router } from 'express';
import Room from '../models/Room.js';
import { getRoomAvailability } from '../services/availabilityService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const rooms = await Room.find().sort({ name: 1 }).lean();
    res.json({ rooms });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/availability', async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Valid date query param required (YYYY-MM-DD)' });
    }

    const availability = await getRoomAvailability(req.params.id, date);
    if (!availability) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(availability);
  } catch (error) {
    next(error);
  }
});

export default router;
