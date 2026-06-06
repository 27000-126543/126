import { Router } from 'express';
import { asyncHandler } from '../utils/response.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import {
  generateSchedule,
  getScheduleByDate,
  confirmSchedule,
  publishSchedule
} from '../controllers/schedulingController.js';

const router = Router();

router.use(authMiddleware);

router.post('/generate', requireRoles('project_manager'), asyncHandler(generateSchedule));
router.get('/:date', asyncHandler(getScheduleByDate));
router.put('/:id/confirm', requireRoles('project_manager'), asyncHandler(confirmSchedule));
router.put('/:id/publish', requireRoles('project_manager'), asyncHandler(publishSchedule));

export default router;
