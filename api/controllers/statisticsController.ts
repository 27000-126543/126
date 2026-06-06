import type { Response } from 'express';
import { db } from '../data/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { ProgressStat, MaterialStat, SafetyStat, WorkHoursStat, EquipmentStat } from '../../shared/types.js';

export async function getProgressStatistics(req: AuthRequest, res: Response): Promise<void> {
  const { projectId } = req.query;
  const projects = projectId
    ? db.query('projects', p => p.id === projectId)
    : db.getAll('projects');

  const stats: ProgressStat[] = projects.map(project => {
    const tasks = db.query('tasks', t => t.projectId === project.id);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const delayedTasks = tasks.filter(t => t.status === 'rework').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

    const startDate = new Date(project.startDate).getTime();
    const endDate = new Date(project.endDate).getTime();
    const now = Date.now();
    const plannedProgress = Math.min(100, Math.max(0, ((now - startDate) / (endDate - startDate)) * 100));
    const actualProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const completionRate = totalTasks > 0 ? ((completedTasks + inProgressTasks * 0.5) / totalTasks) * 100 : 0;

    return {
      projectId: project.id,
      projectName: project.name,
      plannedProgress: parseFloat(plannedProgress.toFixed(1)),
      actualProgress: parseFloat(actualProgress.toFixed(1)),
      completionRate: parseFloat(completionRate.toFixed(1)),
      delayedTasks,
      completedTasks,
      totalTasks
    };
  });

  successResponse(res, stats, '获取进度统计成功');
}

export async function getMaterialStatistics(req: AuthRequest, res: Response): Promise<void> {
  const materials = db.getAll('materials');
  const consumptions = db.getAll('materialConsumptions');

  const stats: MaterialStat[] = materials.map(material => {
    const materialConsumptions = consumptions.filter(c => c.materialId === material.id);
    const actualUsage = materialConsumptions.reduce((sum, c) => sum + c.quantity, 0);
    const plannedUsage = material.totalStock - material.availableStock;
    const overConsumptionRate = plannedUsage > 0 ? ((actualUsage - plannedUsage) / plannedUsage) * 100 : 0;
    const costVariance = (actualUsage - plannedUsage) * material.unitPrice;

    return {
      materialId: material.id,
      materialName: material.name,
      plannedUsage: parseFloat(plannedUsage.toFixed(2)),
      actualUsage: parseFloat(actualUsage.toFixed(2)),
      overConsumptionRate: parseFloat(overConsumptionRate.toFixed(1)),
      unitPrice: material.unitPrice,
      costVariance: parseFloat(costVariance.toFixed(2))
    };
  });

  successResponse(res, stats, '获取材料统计成功');
}

export async function getSafetyStatistics(req: AuthRequest, res: Response): Promise<void> {
  const { startDate, endDate } = req.query;

  let alarms = db.getAll('safetyAlarms');
  let incidents = db.getAll('safetyIncidents');
  let evacuations = db.getAll('evacuationOrders');

  if (startDate) {
    alarms = alarms.filter(a => a.timestamp >= startDate);
    incidents = incidents.filter(i => i.date >= startDate);
    evacuations = evacuations.filter(e => e.timestamp >= startDate);
  }
  if (endDate) {
    alarms = alarms.filter(a => a.timestamp <= endDate);
    incidents = incidents.filter(i => i.date <= endDate);
    evacuations = evacuations.filter(e => e.timestamp <= endDate);
  }

  const stats: SafetyStat[] = [{
    period: `${startDate || '开始'} 至 ${endDate || '现在'}`,
    totalAlarms: alarms.length,
    criticalAlarms: alarms.filter(a => a.level === 'critical').length,
    incidents: incidents.length,
    injuryIncidents: incidents.filter(i => i.type === 'injury').length,
    nearMisses: incidents.filter(i => i.type === 'near_miss').length,
    evacuationCount: evacuations.length
  }];

  successResponse(res, stats, '获取安全统计成功');
}

export async function getWorkHoursStatistics(req: AuthRequest, res: Response): Promise<void> {
  const { startDate, endDate, teamId } = req.query;
  let teams = db.getAll('teams');
  const workers = db.getAll('workers');
  let workHours = db.getAll('workHours');

  if (startDate) workHours = workHours.filter(wh => wh.date >= startDate);
  if (endDate) workHours = workHours.filter(wh => wh.date <= endDate);
  if (teamId) teams = teams.filter(t => t.id === teamId);

  const stats: WorkHoursStat[] = teams.map(team => {
    const teamWorkers = workers.filter(w => w.teamId === team.id);
    const workerIds = teamWorkers.map(w => w.id);
    const teamWorkHours = workHours.filter(wh => workerIds.includes(wh.workerId));
    const totalHours = teamWorkHours.reduce((sum, wh) => sum + wh.hours, 0);
    const overtimeHours = teamWorkHours.reduce((sum, wh) => sum + (wh.overtime || 0), 0);

    return {
      period: `${startDate || '开始'} 至 ${endDate || '现在'}`,
      teamId: team.id,
      teamName: team.name,
      totalHours: parseFloat(totalHours.toFixed(1)),
      overtimeHours: parseFloat(overtimeHours.toFixed(1)),
      workerCount: teamWorkers.length
    };
  });

  successResponse(res, stats, '获取工时统计成功');
}

export async function getEquipmentStatistics(req: AuthRequest, res: Response): Promise<void> {
  const equipment = db.getAll('equipment');
  const usage = db.getAll('equipmentUsage');
  const workOrders = db.getAll('maintenanceWorkOrders');

  const periodDays = 30;
  const periodHours = periodDays * 24;

  const stats: EquipmentStat[] = equipment.map(eq => {
    const eqUsage = usage.filter(u => u.equipmentId === eq.id);
    const eqWorkOrders = workOrders.filter(w => w.equipmentId === eq.id);

    const totalRuntime = eqUsage.reduce((sum, u) => sum + u.duration, 0) + eq.totalRuntime;
    const utilizationRate = parseFloat(((totalRuntime / periodHours) * 100).toFixed(1));
    const maintenanceCount = eqWorkOrders.length;
    const downtime = eqWorkOrders.filter(w => w.status !== 'completed').length * 8;

    return {
      equipmentId: eq.id,
      equipmentName: eq.name,
      totalRuntime: parseFloat(totalRuntime.toFixed(1)),
      utilizationRate: Math.min(100, utilizationRate),
      maintenanceCount,
      downtime
    };
  });

  successResponse(res, stats, '获取设备统计成功');
}

export async function generateReport(req: AuthRequest, res: Response): Promise<void> {
  const { type, startDate, endDate, projectId } = req.body;

  if (!type) {
    errorResponse(res, '报告类型不能为空');
    return;
  }

  const reportId = `RPT-${Date.now()}`;
  const report = {
    id: reportId,
    type,
    startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: endDate || new Date().toISOString().split('T')[0],
    projectId,
    status: 'generating',
    createdAt: new Date().toISOString()
  };

  successResponse(res, report, '报告生成中', 202);
}

export async function downloadReport(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const reportData = {
    id,
    title: '施工项目综合报告',
    generatedAt: new Date().toISOString(),
    content: '报告内容...'
  };

  successResponse(res, {
    reportId: id,
    downloadUrl: `/api/reports/${id}/pdf`,
    reportData
  }, '获取报告下载链接成功');
}
