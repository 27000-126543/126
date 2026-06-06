import type { Response } from 'express';
import { db } from '../data/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { Worker, Team, WorkHours } from '../../shared/types.js';

export async function getWorkers(req: AuthRequest, res: Response): Promise<void> {
  const { teamId, status } = req.query;
  let workers = db.getAll('workers');
  if (teamId) {
    workers = workers.filter(w => w.teamId === teamId);
  }
  if (status) {
    workers = workers.filter(w => w.status === status);
  }
  successResponse(res, workers, '获取工人列表成功');
}

export async function getWorkerById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const worker = db.getById('workers', id);
  if (!worker) {
    errorResponse(res, '工人不存在', 404);
    return;
  }
  successResponse(res, worker, '获取工人详情成功');
}

export async function createWorker(req: AuthRequest, res: Response): Promise<void> {
  const data = req.body as Omit<Worker, 'id' | 'totalWorkHours'>;
  if (!data.employeeNo || !data.name) {
    errorResponse(res, '工号和姓名不能为空');
    return;
  }
  const existing = db.query('workers', w => w.employeeNo === data.employeeNo);
  if (existing.length > 0) {
    errorResponse(res, '工号已存在');
    return;
  }
  const worker = db.create('workers', { ...data, totalWorkHours: 0 });
  successResponse(res, worker, '添加工人成功', 201);
}

export async function updateWorker(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data = req.body as Partial<Worker>;
  const worker = db.update('workers', id, data);
  if (!worker) {
    errorResponse(res, '工人不存在', 404);
    return;
  }
  successResponse(res, worker, '更新工人成功');
}

export async function deleteWorker(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const deleted = db.delete('workers', id);
  if (!deleted) {
    errorResponse(res, '工人不存在', 404);
    return;
  }
  successResponse(res, null, '删除工人成功');
}

export async function getTeams(req: AuthRequest, res: Response): Promise<void> {
  const teams = db.getAll('teams');
  successResponse(res, teams, '获取班组列表成功');
}

export async function getTeamById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const team = db.getById('teams', id);
  if (!team) {
    errorResponse(res, '班组不存在', 404);
    return;
  }
  successResponse(res, team, '获取班组详情成功');
}

export async function createTeam(req: AuthRequest, res: Response): Promise<void> {
  const data = req.body as Omit<Team, 'id'>;
  if (!data.name) {
    errorResponse(res, '班组名称不能为空');
    return;
  }
  const team = db.create('teams', data);
  successResponse(res, team, '添加班组成功', 201);
}

export async function updateTeam(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const data = req.body as Partial<Team>;
  const team = db.update('teams', id, data);
  if (!team) {
    errorResponse(res, '班组不存在', 404);
    return;
  }
  successResponse(res, team, '更新班组成功');
}

export async function deleteTeam(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const deleted = db.delete('teams', id);
  if (!deleted) {
    errorResponse(res, '班组不存在', 404);
    return;
  }
  successResponse(res, null, '删除班组成功');
}

export async function recordWorkHours(req: AuthRequest, res: Response): Promise<void> {
  const data = req.body as Omit<WorkHours, 'id'>;
  if (!data.workerId || !data.taskId || !data.date || data.hours <= 0) {
    errorResponse(res, '工人ID、任务ID、日期和工时不能为空');
    return;
  }
  const worker = db.getById('workers', data.workerId);
  if (!worker) {
    errorResponse(res, '工人不存在');
    return;
  }
  const task = db.getById('tasks', data.taskId);
  if (!task) {
    errorResponse(res, '任务不存在');
    return;
  }
  const workHours = db.create('workHours', {
    ...data,
    recordedBy: req.user?.id || ''
  });
  db.update('workers', data.workerId, {
    totalWorkHours: worker.totalWorkHours + data.hours + (data.overtime || 0)
  });
  successResponse(res, workHours, '记录工时成功', 201);
}

export async function getWorkHoursStatistics(req: AuthRequest, res: Response): Promise<void> {
  const { startDate, endDate, teamId, workerId } = req.query;
  let workHours = db.getAll('workHours');
  if (startDate) {
    workHours = workHours.filter(wh => wh.date >= startDate);
  }
  if (endDate) {
    workHours = workHours.filter(wh => wh.date <= endDate);
  }
  if (workerId) {
    workHours = workHours.filter(wh => wh.workerId === workerId);
  }
  if (teamId) {
    const workers = db.query('workers', w => w.teamId === teamId);
    const workerIds = workers.map(w => w.id);
    workHours = workHours.filter(wh => workerIds.includes(wh.workerId));
  }
  const totalHours = workHours.reduce((sum, wh) => sum + wh.hours, 0);
  const totalOvertime = workHours.reduce((sum, wh) => sum + (wh.overtime || 0), 0);
  successResponse(res, {
    records: workHours,
    totalHours,
    totalOvertime,
    recordCount: workHours.length
  }, '获取工时统计成功');
}
