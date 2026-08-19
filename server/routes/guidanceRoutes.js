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
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.post('/', authorize('student'), createGuidanceRequest);
router.get('/', getGuidanceRequests); // All roles can GET (controller filters based on role)
router.get('/:id', getGuidanceRequestById);
router.put('/:id/accept', authorize('faculty'), acceptRequest);
router.put('/:id/reject', authorize('faculty'), rejectRequest);
router.put('/:id/schedule', authorize('faculty'), scheduleRequest);
router.put('/:id/start', authorize('faculty'), startSession);
router.put('/:id/complete', authorize('faculty'), completeRequest);
router.put('/:id/cancel', authorize('student', 'admin'), cancelRequest);
router.put('/:id/reassign', authorize('admin'), reassignRequest);

export default router;
