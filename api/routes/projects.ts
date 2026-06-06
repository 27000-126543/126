import { Router } from 'express'
import { authMiddleware, requireRoles } from '../middleware/auth.js'
import { asyncHandler } from '../utils/response.js'
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone
} from '../controllers/projectController.js'

const router = Router()

router.use(authMiddleware)

router.get('/', requireRoles('project_manager', 'executive'), asyncHandler(getProjects))
router.post('/', requireRoles('project_manager'), asyncHandler(createProject))
router.get('/:id', requireRoles('project_manager', 'executive'), asyncHandler(getProjectById))
router.put('/:id', requireRoles('project_manager'), asyncHandler(updateProject))
router.delete('/:id', requireRoles('project_manager'), asyncHandler(deleteProject))

router.get('/:id/milestones', requireRoles('project_manager', 'executive'), asyncHandler(getMilestones))
router.post('/:id/milestones', requireRoles('project_manager'), asyncHandler(createMilestone))
router.put('/:id/milestones/:mid', requireRoles('project_manager'), asyncHandler(updateMilestone))
router.delete('/:id/milestones/:mid', requireRoles('project_manager'), asyncHandler(deleteMilestone))

export default router
