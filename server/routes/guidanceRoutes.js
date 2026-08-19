import express from 'express';
import {
  createGuidanceRequest,
  getGuidanceRequests,
  getGuidanceRequestById,
  acceptRequest,
  rejectRequest,
  scheduleRequest,
  startSession,
  completeRequest,
  cancelRequest,
  reassignRequest
} from '../controllers/guidanceController.js';

const router = express.Router();

router.post('/', createGuidanceRequest);
router.get('/', getGuidanceRequests);
router.get('/:id', getGuidanceRequestById);
router.put('/:id/accept', acceptRequest);
router.put('/:id/reject', rejectRequest);
router.put('/:id/schedule', scheduleRequest);
router.put('/:id/start', startSession);
router.put('/:id/complete', completeRequest);
router.put('/:id/cancel', cancelRequest);
router.put('/:id/reassign', reassignRequest);

export default router;
