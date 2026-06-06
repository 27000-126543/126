import type { Response } from 'express';
import { db } from '../data/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { Material, PurchaseRequestStatus } from '../../shared/types.js';

export async function getMaterials(req: AuthRequest, res: Response): Promise<void> {
  const { code, name } = req.query;
  let materials = db.getAll('materials');
  if (code) {
    materials = materials.filter(m => m.code.includes(code as string));
  }
  if (name) {
    materials = materials.filter(m => m.name.includes(name as string));
  }
  successResponse(res, materials);
}

export async function createMaterial(req: AuthRequest, res: Response): Promise<void> {
  const { code, name, unit, totalStock, safetyStock, unitPrice, supplier } = req.body;
  if (!code || !name || !unit) {
    errorResponse(res, '材料编码、名称和单位不能为空');
    return;
  }
  const existing = db.query('materials', m => m.code === code);
  if (existing.length > 0) {
    errorResponse(res, '材料编码已存在');
    return;
  }
  const material = db.create('materials', {
    code,
    name,
    unit,
    totalStock: totalStock || 0,
    reservedStock: 0,
    availableStock: totalStock || 0,
    safetyStock: safetyStock || 0,
    unitPrice: unitPrice || 0,
    supplier: supplier || ''
  } as Omit<Material, 'id'>);
  successResponse(res, material, '材料添加成功');
}

export async function updateMaterial(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const material = db.getById('materials', id);
  if (!material) {
    errorResponse(res, '材料不存在', 404);
    return;
  }
  const { totalStock, reservedStock, ...rest } = req.body;
  const updates: Partial<Material> = { ...rest };
  if (totalStock !== undefined) {
    updates.totalStock = totalStock;
    const reserved = reservedStock !== undefined ? reservedStock : material.reservedStock;
    updates.availableStock = totalStock - reserved;
  }
  if (reservedStock !== undefined && totalStock === undefined) {
    updates.reservedStock = reservedStock;
    updates.availableStock = material.totalStock - reservedStock;
  }
  const updated = db.update('materials', id, updates);
  successResponse(res, updated, '材料更新成功');
}

export async function getMaterialConsumptions(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const material = db.getById('materials', id);
  if (!material) {
    errorResponse(res, '材料不存在', 404);
    return;
  }
  const consumptions = db.query('materialConsumptions', c => c.materialId === id);
  successResponse(res, consumptions);
}

export async function recordConsumption(req: AuthRequest, res: Response): Promise<void> {
  const { taskId, materialId, quantity } = req.body;
  if (!taskId || !materialId || !quantity || quantity <= 0) {
    errorResponse(res, '任务ID、材料ID和消耗量不能为空且消耗量必须大于0');
    return;
  }
  const material = db.getById('materials', materialId);
  if (!material) {
    errorResponse(res, '材料不存在', 404);
    return;
  }
  if (material.availableStock < quantity) {
    errorResponse(res, '可用库存不足');
    return;
  }
  const task = db.getById('tasks', taskId);
  if (!task) {
    errorResponse(res, '任务不存在', 404);
    return;
  }
  const consumption = db.create('materialConsumptions', {
    taskId,
    materialId,
    quantity,
    recordedBy: req.user!.id,
    recordedAt: new Date().toISOString()
  });
  const newTotal = material.totalStock - quantity;
  const newAvailable = material.availableStock - quantity;
  db.update('materials', materialId, {
    totalStock: newTotal,
    availableStock: newAvailable
  });
  successResponse(res, consumption, '材料消耗记录成功');
}

export async function getMaterialAlerts(req: AuthRequest, res: Response): Promise<void> {
  const materials = db.getAll('materials');
  const alerts = materials.filter(m => m.availableStock <= m.safetyStock).map(m => ({
    ...m,
    alertLevel: m.availableStock <= m.safetyStock * 0.5 ? 'critical' : 'warning',
    shortage: m.safetyStock - m.availableStock
  }));
  successResponse(res, alerts);
}

export async function getPurchaseRequests(req: AuthRequest, res: Response): Promise<void> {
  const { status, materialId } = req.query;
  let requests = db.getAll('purchaseRequests');
  if (status) {
    requests = requests.filter(r => r.status === status);
  }
  if (materialId) {
    requests = requests.filter(r => r.materialId === materialId);
  }
  successResponse(res, requests);
}

export async function createPurchaseRequest(req: AuthRequest, res: Response): Promise<void> {
  const { materialId, quantity, reason } = req.body;
  if (!materialId || !quantity || quantity <= 0 || !reason) {
    errorResponse(res, '材料ID、采购数量和原因不能为空');
    return;
  }
  const material = db.getById('materials', materialId);
  if (!material) {
    errorResponse(res, '材料不存在', 404);
    return;
  }
  const request = db.create('purchaseRequests', {
    materialId,
    quantity,
    reason,
    status: 'pending' as PurchaseRequestStatus,
    requestedBy: req.user!.id,
    approvedBy: null,
    createdAt: new Date().toISOString()
  });
  successResponse(res, request, '采购申请创建成功');
}

export async function approvePurchaseRequest(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const request = db.getById('purchaseRequests', id);
  if (!request) {
    errorResponse(res, '采购申请不存在', 404);
    return;
  }
  if (request.status !== 'pending') {
    errorResponse(res, '该申请已处理');
    return;
  }
  const updated = db.update('purchaseRequests', id, {
    status: 'approved' as PurchaseRequestStatus,
    approvedBy: req.user!.id
  });
  successResponse(res, updated, '采购申请已批准');
}
