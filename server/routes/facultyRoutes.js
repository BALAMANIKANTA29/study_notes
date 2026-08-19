import express from 'express';
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getAvailableSlots
} from '../controllers/facultyController.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.get('/:id/availability', getAvailability);
router.post('/availability', authorize('faculty'), createAvailability);
router.put('/availability/:id', authorize('faculty'), updateAvailability);
router.delete('/availability/:id', authorize('faculty'), deleteAvailability);
router.get('/:id/available-slots', getAvailableSlots);

export default router;
