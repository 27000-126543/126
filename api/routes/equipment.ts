import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import {
  getEquipment, createEquipment, updateEquipment,
  startEquipmentUsage, endEquipmentUsage,
  getWorkOrders, createWorkOrder, updateWorkOrder, completeWorkOrder,
  getSpareParts, createSparePart, updateSparePart
} from '../controllers/equipmentController.js';

const router = Router();

router.get('/equipment', authMiddleware, getEquipment);
router.post('/equipment', authMiddleware, requireRoles('equipment_manager', 'project_manager'), createEquipment);
router.put('/equipment/:id', authMiddleware, requireRoles('equipment_manager', 'project_manager'), updateEquipment);

router.post('/equipment/:id/usage/start', authMiddleware, requireRoles('equipment_manager', 'project_manager', 'foreman'), startEquipmentUsage);
router.post('/equipment/:id/usage/end', authMiddleware, requireRoles('equipment_manager', 'project_manager', 'foreman'), endEquipmentUsage);

router.get('/maintenance/workorders', authMiddleware, getWorkOrders);
router.post('/maintenance/workorders', authMiddleware, requireRoles('equipment_manager', 'project_manager'), createWorkOrder);
router.put('/maintenance/workorders/:id', authMiddleware, requireRoles('equipment_manager', 'project_manager'), updateWorkOrder);
router.post('/maintenance/workorders/:id/complete', authMiddleware, requireRoles('equipment_manager', 'project_manager'), completeWorkOrder);

router.get('/spare-parts', authMiddleware, getSpareParts);
router.post('/spare-parts', authMiddleware, requireRoles('equipment_manager', 'project_manager'), createSparePart);
router.put('/spare-parts/:id', authMiddleware, requireRoles('equipment_manager', 'project_manager'), updateSparePart);

export default router;
