import { Router } from 'express';
import { asyncHandler } from '../utils/response.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  getMaterialConsumptions,
  recordConsumption,
  getMaterialAlerts,
  getPurchaseRequests,
  createPurchaseRequest,
  approvePurchaseRequest
} from '../controllers/materialController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getMaterials));
router.post('/', requireRoles('material_manager'), asyncHandler(createMaterial));
router.put('/:id', requireRoles('material_manager'), asyncHandler(updateMaterial));
router.get('/:id/consumptions', asyncHandler(getMaterialConsumptions));
router.post('/consume', requireRoles('material_manager', 'foreman'), asyncHandler(recordConsumption));
router.get('/alerts', asyncHandler(getMaterialAlerts));

router.get('/purchase-requests', asyncHandler(getPurchaseRequests));
router.post('/purchase-requests', requireRoles('material_manager'), asyncHandler(createPurchaseRequest));
router.put('/purchase-requests/:id/approve', requireRoles('project_manager'), asyncHandler(approvePurchaseRequest));

export default router;
