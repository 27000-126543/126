import type { Response } from 'express';
import { db } from '../data/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { HeatmapData, LocationUpdate } from '../../shared/types.js';

function findFloorPlan(projectId: string) {
  return db.query('floorPlans', fp => fp.projectId === projectId)[0];
}

export async function getFloorPlan(req: AuthRequest, res: Response): Promise<void> {
  const floorPlan = findFloorPlan(req.params.projectId);
  if (!floorPlan) {
    errorResponse(res, '未找到该项目的平面图', 404);
    return;
  }
  successResponse(res, floorPlan, '获取平面图成功');
}

export async function getFloorPlans(req: AuthRequest, res: Response): Promise<void> {
  successResponse(res, db.getAll('floorPlans'), '获取平面图列表成功');
}

export async function createFloorPlan(req: AuthRequest, res: Response): Promise<void> {
  const data = req.body;
  if (!data.projectId || !data.name) {
    errorResponse(res, '项目ID和平面图名称不能为空');
    return;
  }
  successResponse(res, db.create('floorPlans', data), '创建平面图成功', 201);
}

export async function updateFloorPlan(req: AuthRequest, res: Response): Promise<void> {
  const floorPlan = db.update('floorPlans', req.params.id, req.body);
  if (!floorPlan) {
    errorResponse(res, '平面图不存在', 404);
    return;
  }
  successResponse(res, floorPlan, '更新平面图成功');
}

export async function deleteFloorPlan(req: AuthRequest, res: Response): Promise<void> {
  if (!db.delete('floorPlans', req.params.id)) {
    errorResponse(res, '平面图不存在', 404);
    return;
  }
  successResponse(res, null, '删除平面图成功');
}

export async function getHeatmap(req: AuthRequest, res: Response): Promise<void> {
  const floorPlan = findFloorPlan(req.params.projectId);
  if (!floorPlan) {
    errorResponse(res, '未找到该项目的平面图', 404);
    return;
  }
  const workers = db.getAll('workers');
  const equipment = db.getAll('equipment');
  const now = new Date().toISOString();

  const heatmapData: HeatmapData[] = floorPlan.areas.map(area => {
    const areaWorkers = workers.filter(w => w.currentLocation?.area === area.name);
    const areaEquipment = equipment.filter(e => e.location.includes(area.name));
    const intensity = Math.min(100, areaWorkers.length * 15 + areaEquipment.length * 10);
    return { areaId: area.id, workerCount: areaWorkers.length, equipmentCount: areaEquipment.length, intensity, timestamp: now };
  });

  successResponse(res, { floorPlanId: floorPlan.id, heatmapData, generatedAt: now }, '获取热力图数据成功');
}

export async function getLocations(req: AuthRequest, res: Response): Promise<void> {
  const { projectId } = req.params;
  const { entityType } = req.query;
  const floorPlan = findFloorPlan(projectId);
  if (!floorPlan) {
    errorResponse(res, '未找到该项目的平面图', 404);
    return;
  }

  const locations: LocationUpdate[] = [];
  const now = new Date().toISOString();

  if (!entityType || entityType === 'worker') {
    db.getAll('workers').forEach(w => {
      if (w.currentLocation) {
        locations.push({ entityType: 'worker', entityId: w.id, x: w.currentLocation.x, y: w.currentLocation.y, area: w.currentLocation.area, timestamp: now });
      }
    });
  }

  if (!entityType || entityType === 'equipment') {
    db.getAll('equipment').forEach(eq => {
      const area = floorPlan.areas.find(a => eq.location.includes(a.name));
      if (area) {
        const cx = area.bounds.x + area.bounds.width / 2;
        const cy = area.bounds.y + area.bounds.height / 2;
        locations.push({ entityType: 'equipment', entityId: eq.id, x: cx + (Math.random() - 0.5) * 40, y: cy + (Math.random() - 0.5) * 40, area: area.name, timestamp: now });
      }
    });
  }

  successResponse(res, { projectId, locations, updatedAt: now }, '获取实时位置成功');
}

export async function updateLocation(req: AuthRequest, res: Response): Promise<void> {
  const { entityType, entityId } = req.params;
  const { x, y, area } = req.body;

  if (x === undefined || y === undefined || !area) {
    errorResponse(res, '坐标和区域不能为空');
    return;
  }

  if (entityType === 'worker') {
    const worker = db.update('workers', entityId, { currentLocation: { x, y, area }, status: 'on_site' });
    if (!worker) { errorResponse(res, '工人不存在', 404); return; }
    successResponse(res, worker, '更新工人位置成功');
  } else if (entityType === 'equipment') {
    const equipment = db.update('equipment', entityId, { location: area });
    if (!equipment) { errorResponse(res, '设备不存在', 404); return; }
    successResponse(res, equipment, '更新设备位置成功');
  } else {
    errorResponse(res, '无效的实体类型');
  }
}
