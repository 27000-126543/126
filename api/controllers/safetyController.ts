import type { Request, Response } from 'express';
import { db } from '../data/database.js';
import { successResponse, errorResponse, asyncHandler } from '../utils/response.js';
import { safetyMonitoringService } from '../services/safetyMonitoringService.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { SensorReading, SafetyIncident } from '../../shared/types.js';

export const getSensors = asyncHandler(async (req: Request, res: Response) => {
  const sensors = db.getAll('sensors');
  successResponse(res, sensors, '获取传感器列表成功');
});

export const getSensorReadings = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sensor = db.getById('sensors', id);
  if (!sensor) {
    errorResponse(res, '传感器不存在', 404);
    return;
  }
  const readings = db.query('sensorReadings', r => r.sensorId === id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 100);
  successResponse(res, readings, '获取传感器数据成功');
});

export const submitSensorReading = asyncHandler(async (req: Request, res: Response) => {
  const { sensorId, value } = req.body;
  if (!sensorId || value === undefined) {
    errorResponse(res, '传感器ID和数值不能为空', 400);
    return;
  }
  const sensor = db.getById('sensors', sensorId);
  if (!sensor) {
    errorResponse(res, '传感器不存在', 404);
    return;
  }
  const reading = safetyMonitoringService.processReading(sensor, Number(value));
  successResponse(res, reading, '数据提交成功');
});

export const getAlarms = asyncHandler(async (req: Request, res: Response) => {
  const { acknowledged } = req.query;
  let alarms = db.getAll('safetyAlarms');
  if (acknowledged !== undefined) {
    alarms = alarms.filter(a => a.acknowledged === (acknowledged === 'true'));
  }
  alarms = alarms.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  successResponse(res, alarms, '获取报警列表成功');
});

export const acknowledgeAlarm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId) {
    errorResponse(res, '用户未认证', 401);
    return;
  }
  const alarm = db.getById('safetyAlarms', id);
  if (!alarm) {
    errorResponse(res, '报警不存在', 404);
    return;
  }
  if (alarm.acknowledged) {
    errorResponse(res, '该报警已确认', 400);
    return;
  }
  const updated = safetyMonitoringService.acknowledgeAlarm(id, userId);
  successResponse(res, updated, '报警确认成功');
});

export const issueEvacuationOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { area, reason } = req.body;
  const userId = req.user?.id;
  if (!userId || !area || !reason) {
    errorResponse(res, '区域和原因不能为空', 400);
    return;
  }
  const activeOrder = safetyMonitoringService.getActiveEvacuationOrder();
  if (activeOrder) {
    errorResponse(res, '已有正在执行的疏散指令', 400);
    return;
  }
  const order = safetyMonitoringService.issueEvacuationOrder(userId, area, reason);
  successResponse(res, order, '疏散指令已发布');
});

export const getCurrentEvacuation = asyncHandler(async (req: Request, res: Response) => {
  const order = safetyMonitoringService.getActiveEvacuationOrder();
  successResponse(res, order || null, order ? '获取当前疏散状态成功' : '暂无疏散指令');
});

export const completeEvacuation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = db.getById('evacuationOrders', id);
  if (!order) {
    errorResponse(res, '疏散指令不存在', 404);
    return;
  }
  if (order.status !== 'active') {
    errorResponse(res, '该疏散指令已处理', 400);
    return;
  }
  const updated = safetyMonitoringService.completeEvacuation(id);
  successResponse(res, updated, '疏散已完成');
});

export const getIncidents = asyncHandler(async (req: Request, res: Response) => {
  const incidents = db.getAll('safetyIncidents')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  successResponse(res, incidents, '获取安全事件列表成功');
});

export const createIncident = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { date, type, severity, description, location } = req.body;
  const reportedBy = req.user?.id;
  if (!reportedBy || !date || !type || !severity || !description || !location) {
    errorResponse(res, '缺少必填字段', 400);
    return;
  }
  const incident = db.create('safetyIncidents', {
    date, type, severity, description, location, reportedBy
  } as SafetyIncident);
  successResponse(res, incident, '安全事件已记录', 201);
});
