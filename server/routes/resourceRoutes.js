import express from 'express';
import {
  uploadNote,
  getNotes,
  getTickets,
  getAppointments,
  getMessages,
  getUsers,
  getAnalytics
} from '../controllers/resourceController.js';

const router = express.Router();

router.get('/users', getUsers);
router.post('/notes', uploadNote);
router.get('/notes', getNotes);
router.get('/tickets', getTickets);
router.get('/appointments', getAppointments);
router.get('/chat/:userId', getMessages);
router.get('/admin/analytics', getAnalytics);

export default router;
