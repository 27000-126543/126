import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/response.js';
import * as statisticsController from '../controllers/statisticsController.js';

const router = Router();

router.use(authMiddleware);

router.get('/progress', requireRoles('project_manager', 'executive'), asyncHandler(statisticsController.getProgressStatistics));
router.get('/materials', requireRoles('project_manager', 'material_manager', 'executive'), asyncHandler(statisticsController.getMaterialStatistics));
router.get('/safety', requireRoles('project_manager', 'safety_officer', 'executive'), asyncHandler(statisticsController.getSafetyStatistics));
router.get('/workhours', requireRoles('project_manager', 'foreman', 'executive'), asyncHandler(statisticsController.getWorkHoursStatistics));
router.get('/equipment', requireRoles('project_manager', 'equipment_manager', 'executive'), asyncHandler(statisticsController.getEquipmentStatistics));

router.post('/reports/generate', requireRoles('project_manager', 'executive'), asyncHandler(statisticsController.generateReport));
router.get('/reports/:id/download', requireRoles('project_manager', 'executive'), asyncHandler(statisticsController.downloadReport));

export default router;
