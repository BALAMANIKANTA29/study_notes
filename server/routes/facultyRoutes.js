import express from 'express';
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailableSlots
} from '../controllers/facultyController.js';

const router = express.Router();

router.get('/:id/availability', getAvailability);
router.post('/availability', createAvailability);
router.put('/availability/:id', updateAvailability);
router.delete('/availability/:id', deleteAvailability);
router.get('/:id/available-slots', getAvailableSlots);

export default router;
