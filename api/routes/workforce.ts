import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/response.js';
import * as workforceController from '../controllers/workforceController.js';

const router = Router();

router.use(authMiddleware);

router.get('/workers', asyncHandler(workforceController.getWorkers));
router.get('/workers/:id', asyncHandler(workforceController.getWorkerById));
router.post('/workers', requireRoles('project_manager', 'foreman'), asyncHandler(workforceController.createWorker));
router.put('/workers/:id', requireRoles('project_manager', 'foreman'), asyncHandler(workforceController.updateWorker));
router.delete('/workers/:id', requireRoles('project_manager'), asyncHandler(workforceController.deleteWorker));

router.get('/teams', asyncHandler(workforceController.getTeams));
router.get('/teams/:id', asyncHandler(workforceController.getTeamById));
router.post('/teams', requireRoles('project_manager'), asyncHandler(workforceController.createTeam));
router.put('/teams/:id', requireRoles('project_manager'), asyncHandler(workforceController.updateTeam));
router.delete('/teams/:id', requireRoles('project_manager'), asyncHandler(workforceController.deleteTeam));

router.post('/workhours', requireRoles('project_manager', 'foreman'), asyncHandler(workforceController.recordWorkHours));
router.get('/workhours/statistics', asyncHandler(workforceController.getWorkHoursStatistics));

export default router;
