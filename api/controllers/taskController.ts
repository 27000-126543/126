import type { Request, Response } from 'express';
import { db } from '../data/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { Task, TaskStatus, AdjustmentRequestStatus } from '../../shared/types.js';

export async function getTasks(req: AuthRequest, res: Response): Promise<void> {
  const { projectId, status } = req.query;
  let tasks = db.getAll('tasks');
  if (projectId) {
    tasks = tasks.filter(t => t.projectId === projectId);
  }
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  successResponse(res, tasks);
}

export async function createTask(req: AuthRequest, res: Response): Promise<void> {
  const { projectId, name, description, dependencies, skills, estimatedDuration, workArea, isHighAltitude, materials, equipment } = req.body;
  if (!projectId || !name) {
    errorResponse(res, '项目ID和任务名称不能为空');
    return;
  }
  const task = db.create('tasks', {
    projectId,
    name,
    description: description || '',
    dependencies: dependencies || [],
    skills: skills || [],
    estimatedDuration: estimatedDuration || 480,
    status: 'pending' as TaskStatus,
    startDate: null,
    endDate: null,
    assignedTeamId: null,
    workArea: workArea || '',
    isHighAltitude: isHighAltitude || false,
    materials: materials || [],
    equipment: equipment || []
  } as Omit<Task, 'id'>);
  successResponse(res, task, '任务创建成功');
}

export async function updateTask(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const task = db.getById('tasks', id);
  if (!task) {
    errorResponse(res, '任务不存在', 404);
    return;
  }
  const updated = db.update('tasks', id, req.body);
  successResponse(res, updated, '任务更新成功');
}

export async function updateTaskStatus(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { status } = req.body;
  const task = db.getById('tasks', id);
  if (!task) {
    errorResponse(res, '任务不存在', 404);
    return;
  }
  const validStatuses: TaskStatus[] = ['pending', 'not_started', 'in_progress', 'completed', 'rework'];
  if (!validStatuses.includes(status)) {
    errorResponse(res, '无效的任务状态');
    return;
  }
  const updates: Partial<Task> = { status };
  if (status === 'in_progress' && !task.startDate) {
    updates.startDate = new Date().toISOString();
  }
  if (status === 'completed' && !task.endDate) {
    updates.endDate = new Date().toISOString();
  }
  const updated = db.update('tasks', id, updates);
  successResponse(res, updated, '任务状态更新成功');
}

export async function createAdjustmentRequest(req: AuthRequest, res: Response): Promise<void> {
  const { id: taskId } = req.params;
  const { reason, suggestedChange } = req.body;
  if (!reason || !suggestedChange) {
    errorResponse(res, '原因和建议变更不能为空');
    return;
  }
  const task = db.getById('tasks', taskId);
  if (!task) {
    errorResponse(res, '任务不存在', 404);
    return;
  }
  const request = db.create('adjustmentRequests', {
    taskId,
    requesterId: req.user!.id,
    reason,
    suggestedChange,
    status: 'pending' as AdjustmentRequestStatus,
    approverId: null,
    createdAt: new Date().toISOString()
  });
  successResponse(res, request, '调整申请提交成功');
}

export async function getAdjustmentRequests(req: AuthRequest, res: Response): Promise<void> {
  const { status, taskId } = req.query;
  let requests = db.getAll('adjustmentRequests');
  if (status) {
    requests = requests.filter(r => r.status === status);
  }
  if (taskId) {
    requests = requests.filter(r => r.taskId === taskId);
  }
  successResponse(res, requests);
}

export async function approveAdjustmentRequest(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const request = db.getById('adjustmentRequests', id);
  if (!request) {
    errorResponse(res, '调整申请不存在', 404);
    return;
  }
  if (request.status !== 'pending') {
    errorResponse(res, '该申请已处理');
    return;
  }
  const updated = db.update('adjustmentRequests', id, {
    status: 'approved' as AdjustmentRequestStatus,
    approverId: req.user!.id
  });
  successResponse(res, updated, '调整申请已批准');
}

export async function rejectAdjustmentRequest(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const request = db.getById('adjustmentRequests', id);
  if (!request) {
    errorResponse(res, '调整申请不存在', 404);
    return;
  }
  if (request.status !== 'pending') {
    errorResponse(res, '该申请已处理');
    return;
  }
  const updated = db.update('adjustmentRequests', id, {
    status: 'rejected' as AdjustmentRequestStatus,
    approverId: req.user!.id
  });
  successResponse(res, updated, '调整申请已驳回');
}
