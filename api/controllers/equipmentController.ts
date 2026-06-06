import type { Request, Response } from 'express';
import { db } from '../data/database.js';
import { successResponse, errorResponse, asyncHandler } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { Equipment, EquipmentUsage, MaintenanceWorkOrder, SparePart } from '../../shared/types.js';

export const getEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { status, type } = req.query;
  let equipment = db.getAll('equipment');
  if (status) equipment = equipment.filter(e => e.status === status);
  if (type) equipment = equipment.filter(e => e.type === type);
  successResponse(res, equipment, '获取设备列表成功');
});

export const createEquipment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, name, type, status, location, specifications, maintenanceThreshold } = req.body;
  if (!code || !name || !type) {
    errorResponse(res, '设备编号、名称、类型不能为空', 400);
    return;
  }
  const equipment = db.create('equipment', {
    code, name, type,
    status: status || 'available',
    location: location || '',
    totalRuntime: 0,
    lastMaintenanceDate: new Date().toISOString().split('T')[0],
    nextMaintenanceHours: maintenanceThreshold || 250,
    maintenanceThreshold: maintenanceThreshold || 250,
    specifications: specifications || {}
  } as Equipment);
  successResponse(res, equipment, '设备创建成功', 201);
});

export const updateEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const equipment = db.getById('equipment', id);
  if (!equipment) {
    errorResponse(res, '设备不存在', 404);
    return;
  }
  const updated = db.update('equipment', id, req.body);
  successResponse(res, updated, '设备更新成功');
});

export const startEquipmentUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { taskId, operatorId } = req.body;
  if (!taskId || !operatorId) {
    errorResponse(res, '任务ID和操作员ID不能为空', 400);
    return;
  }
  const equipment = db.getById('equipment', id);
  if (!equipment) {
    errorResponse(res, '设备不存在', 404);
    return;
  }
  if (equipment.status === 'in_use') {
    errorResponse(res, '设备正在使用中', 400);
    return;
  }
  const activeUsage = db.query('equipmentUsage', u => u.equipmentId === id && !u.endTime)[0];
  if (activeUsage) {
    errorResponse(res, '设备存在未结束的使用记录', 400);
    return;
  }
  const usage = db.create('equipmentUsage', {
    equipmentId: id, taskId, operatorId,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0
  } as EquipmentUsage);
  db.update('equipment', id, { status: 'in_use' });
  successResponse(res, usage, '设备已开始使用');
});

export const endEquipmentUsage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const usage = db.query('equipmentUsage', u => u.equipmentId === id && !u.endTime)[0];
  if (!usage) {
    errorResponse(res, '设备未在使用中', 400);
    return;
  }
  const endTime = new Date();
  const duration = Math.round((endTime.getTime() - new Date(usage.startTime).getTime()) / 3600000);
  const updatedUsage = db.update('equipmentUsage', usage.id, {
    endTime: endTime.toISOString(),
    duration
  });
  const equipment = db.getById('equipment', id);
  if (equipment) {
    const nextMaintenanceHours = Math.max(0, equipment.nextMaintenanceHours - duration);
    db.update('equipment', id, {
      status: 'available',
      totalRuntime: equipment.totalRuntime + duration,
      nextMaintenanceHours
    });
  }
  successResponse(res, updatedUsage, '设备使用已结束');
});

export const getWorkOrders = asyncHandler(async (req: Request, res: Response) => {
  const { status, equipmentId } = req.query;
  let workOrders = db.getAll('maintenanceWorkOrders');
  if (status) workOrders = workOrders.filter(w => w.status === status);
  if (equipmentId) workOrders = workOrders.filter(w => w.equipmentId === equipmentId);
  workOrders = workOrders.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  successResponse(res, workOrders, '获取维保工单成功');
});

export const createWorkOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { equipmentId, type, description, scheduledDate, assignedTeamId } = req.body;
  if (!equipmentId || !type || !description || !scheduledDate) {
    errorResponse(res, '缺少必填字段', 400);
    return;
  }
  const workOrder = db.create('maintenanceWorkOrders', {
    equipmentId, type, description, scheduledDate,
    status: assignedTeamId ? 'assigned' : 'pending',
    assignedTeamId: assignedTeamId || null,
    partsUsed: [],
    completedDate: null
  } as MaintenanceWorkOrder);
  db.update('equipment', equipmentId, { status: 'maintenance' });
  successResponse(res, workOrder, '维保工单创建成功', 201);
});

export const updateWorkOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const workOrder = db.getById('maintenanceWorkOrders', id);
  if (!workOrder) {
    errorResponse(res, '工单不存在', 404);
    return;
  }
  const updated = db.update('maintenanceWorkOrders', id, req.body);
  successResponse(res, updated, '工单更新成功');
});

export const completeWorkOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { partsUsed } = req.body;
  const workOrder = db.getById('maintenanceWorkOrders', id);
  if (!workOrder) {
    errorResponse(res, '工单不存在', 404);
    return;
  }
  if (workOrder.status === 'completed') {
    errorResponse(res, '工单已完成', 400);
    return;
  }
  const completed = db.update('maintenanceWorkOrders', id, {
    status: 'completed',
    completedDate: new Date().toISOString().split('T')[0],
    partsUsed: partsUsed || []
  });
  db.update('equipment', workOrder.equipmentId, {
    status: 'available',
    lastMaintenanceDate: new Date().toISOString().split('T')[0],
    nextMaintenanceHours: db.getById('equipment', workOrder.equipmentId)?.maintenanceThreshold || 250
  });
  successResponse(res, completed, '工单已完成');
});

export const getSpareParts = asyncHandler(async (req: Request, res: Response) => {
  const spareParts = db.getAll('spareParts');
  successResponse(res, spareParts, '获取备件列表成功');
});

export const createSparePart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, code, stock, safetyStock, unitPrice } = req.body;
  if (!name || !code) {
    errorResponse(res, '备件名称和编码不能为空', 400);
    return;
  }
  const sparePart = db.create('spareParts', {
    name, code,
    stock: stock || 0,
    safetyStock: safetyStock || 0,
    unitPrice: unitPrice || 0
  } as SparePart);
  successResponse(res, sparePart, '备件创建成功', 201);
});

export const updateSparePart = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sparePart = db.getById('spareParts', id);
  if (!sparePart) {
    errorResponse(res, '备件不存在', 404);
    return;
  }
  const updated = db.update('spareParts', id, req.body);
  successResponse(res, updated, '备件更新成功');
});
