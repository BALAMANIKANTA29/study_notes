import express from 'express';
import {
  uploadNote,
  getNotes,
  createTicket,
  getTickets,
  updateTicketStatus,
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  getMessages,
  getUsers,
  getAnalytics
} from '../controllers/resourceController.js';

const router = express.Router();

router.get('/users', getUsers);
router.post('/notes', uploadNote);
router.get('/notes', getNotes);
router.post('/tickets', createTicket);
router.get('/tickets', getTickets);
router.put('/tickets/:id', updateTicketStatus);
router.post('/appointments', createAppointment);
router.get('/appointments', getAppointments);
router.put('/appointments/:id', updateAppointmentStatus);
router.get('/chat/:userId', getMessages);
router.get('/admin/analytics', getAnalytics);

export default router;
