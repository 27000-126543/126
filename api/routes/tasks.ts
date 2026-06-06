import { Router } from 'express';
import { asyncHandler } from '../utils/response.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  createAdjustmentRequest,
  getAdjustmentRequests,
  approveAdjustmentRequest,
  rejectAdjustmentRequest
} from '../controllers/taskController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getTasks));
router.post('/', requireRoles('project_manager', 'foreman'), asyncHandler(createTask));
router.put('/:id', requireRoles('project_manager', 'foreman'), asyncHandler(updateTask));
router.patch('/:id/status', requireRoles('project_manager', 'foreman'), asyncHandler(updateTaskStatus));
router.post('/:id/adjustments', requireRoles('foreman'), asyncHandler(createAdjustmentRequest));

router.get('/adjustments', asyncHandler(getAdjustmentRequests));
router.put('/adjustments/:id/approve', requireRoles('project_manager'), asyncHandler(approveAdjustmentRequest));
router.put('/adjustments/:id/reject', requireRoles('project_manager'), asyncHandler(rejectAdjustmentRequest));

export default router;
