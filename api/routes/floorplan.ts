import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/response.js';
import * as floorPlanController from '../controllers/floorPlanController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRoles('project_manager', 'safety_officer'), asyncHandler(floorPlanController.getFloorPlans));
router.post('/', requireRoles('project_manager'), asyncHandler(floorPlanController.createFloorPlan));
router.put('/:id', requireRoles('project_manager'), asyncHandler(floorPlanController.updateFloorPlan));
router.delete('/:id', requireRoles('project_manager'), asyncHandler(floorPlanController.deleteFloorPlan));

router.get('/:projectId', requireRoles('project_manager', 'safety_officer'), asyncHandler(floorPlanController.getFloorPlan));
router.get('/:projectId/heatmap', requireRoles('project_manager', 'safety_officer'), asyncHandler(floorPlanController.getHeatmap));
router.get('/:projectId/locations', requireRoles('project_manager', 'safety_officer'), asyncHandler(floorPlanController.getLocations));

router.put('/locations/:entityType/:entityId', requireRoles('project_manager', 'foreman'), asyncHandler(floorPlanController.updateLocation));

export default router;
