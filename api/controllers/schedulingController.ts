import type { Response } from 'express';
import { db } from '../data/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import { schedulingService } from '../services/schedulingService.js';
import type { ScheduleStatus } from '../../shared/types.js';

export async function generateSchedule(req: AuthRequest, res: Response): Promise<void> {
  const { projectId, date } = req.body;
  if (!projectId || !date) {
    errorResponse(res, '项目ID和日期不能为空');
    return;
  }
  const project = db.getById('projects', projectId);
  if (!project) {
    errorResponse(res, '项目不存在', 404);
    return;
  }
  const schedule = schedulingService.generateSchedule(projectId, date);
  successResponse(res, schedule, '排程生成成功');
}

export async function getScheduleByDate(req: AuthRequest, res: Response): Promise<void> {
  const { date } = req.params;
  const { projectId } = req.query;
  let schedules = db.getAll('schedules');
  if (projectId) {
    schedules = schedules.filter(s => s.projectId === projectId);
  }
  schedules = schedules.filter(s => s.date === date);
  if (schedules.length === 0) {
    successResponse(res, null, '该日期暂无排程');
    return;
  }
  successResponse(res, schedules[0]);
}

export async function confirmSchedule(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const schedule = db.getById('schedules', id);
  if (!schedule) {
    errorResponse(res, '排程不存在', 404);
    return;
  }
  if (schedule.status !== 'draft') {
    errorResponse(res, '仅草稿状态的排程可确认');
    return;
  }
  const criticalConflicts = schedule.conflicts.filter(c => c.severity === 'critical');
  if (criticalConflicts.length > 0) {
    errorResponse(res, '存在严重冲突，无法确认排程，请先解决冲突');
    return;
  }
  const updated = db.update('schedules', id, {
    status: 'confirmed' as ScheduleStatus
  });
  successResponse(res, updated, '排程确认成功');
}

export async function publishSchedule(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const schedule = db.getById('schedules', id);
  if (!schedule) {
    errorResponse(res, '排程不存在', 404);
    return;
  }
  if (schedule.status !== 'confirmed') {
    errorResponse(res, '仅已确认的排程可发布');
    return;
  }
  const updated = db.update('schedules', id, {
    status: 'published' as ScheduleStatus
  });
  for (const st of schedule.tasks) {
    db.update('tasks', st.taskId, {
      status: 'not_started' as const,
      startDate: st.startTime
    });
  }
  successResponse(res, updated, '排程发布成功');
}
