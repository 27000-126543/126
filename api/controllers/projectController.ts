import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { db } from '../data/database.js';
import { successResponse, errorResponse } from '../utils/response.js';
import type { Project, Milestone } from '../../shared/types.js';

export async function getProjects(req: AuthRequest, res: Response): Promise<void> {
  const projects = db.getAll('projects');
  successResponse(res, projects, '获取项目列表成功');
}

export async function createProject(req: AuthRequest, res: Response): Promise<void> {
  const { projectNo, name, budget, startDate, endDate, status, description, location } = req.body as Omit<Project, 'id' | 'actualCost' | 'createdAt'>;

  if (!projectNo || !name || !budget || !startDate || !endDate) {
    errorResponse(res, '项目编号、名称、预算、开始日期和结束日期不能为空', 400);
    return;
  }

  const newProject = db.create('projects', {
    projectNo,
    name,
    budget,
    actualCost: 0,
    startDate,
    endDate,
    status: status || 'planning',
    description: description || '',
    location: location || '',
    createdAt: new Date().toISOString()
  });

  res.status(201);
  successResponse(res, newProject, '项目创建成功');
}

export async function getProjectById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const project = db.getById('projects', id);

  if (!project) {
    errorResponse(res, '项目不存在', 404);
    return;
  }

  successResponse(res, project, '获取项目详情成功');
}

export async function updateProject(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const updates = req.body as Partial<Project>;

  const project = db.getById('projects', id);
  if (!project) {
    errorResponse(res, '项目不存在', 404);
    return;
  }

  const updatedProject = db.update('projects', id, updates);
  successResponse(res, updatedProject, '项目更新成功');
}

export async function deleteProject(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const project = db.getById('projects', id);
  if (!project) {
    errorResponse(res, '项目不存在', 404);
    return;
  }

  const deleted = db.delete('projects', id);
  if (deleted) {
    successResponse(res, null, '项目删除成功');
  } else {
    errorResponse(res, '项目删除失败', 500);
  }
}

export async function getMilestones(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  const project = db.getById('projects', id);
  if (!project) {
    errorResponse(res, '项目不存在', 404);
    return;
  }

  const milestones = db.query('milestones', m => m.projectId === id);
  successResponse(res, milestones, '获取里程碑列表成功');
}

export async function createMilestone(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, plannedDate, status, description } = req.body as Omit<Milestone, 'id' | 'projectId' | 'actualDate'>;

  const project = db.getById('projects', id);
  if (!project) {
    errorResponse(res, '项目不存在', 404);
    return;
  }

  if (!name || !plannedDate) {
    errorResponse(res, '里程碑名称和计划日期不能为空', 400);
    return;
  }

  const newMilestone = db.create('milestones', {
    projectId: id,
    name,
    plannedDate,
    actualDate: null,
    status: status || 'pending',
    description: description || ''
  });

  res.status(201);
  successResponse(res, newMilestone, '里程碑创建成功');
}

export async function updateMilestone(req: AuthRequest, res: Response): Promise<void> {
  const { id, mid } = req.params;
  const updates = req.body as Partial<Milestone>;

  const project = db.getById('projects', id);
  if (!project) {
    errorResponse(res, '项目不存在', 404);
    return;
  }

  const milestone = db.getById('milestones', mid);
  if (!milestone || milestone.projectId !== id) {
    errorResponse(res, '里程碑不存在', 404);
    return;
  }

  const updatedMilestone = db.update('milestones', mid, updates);
  successResponse(res, updatedMilestone, '里程碑更新成功');
}

export async function deleteMilestone(req: AuthRequest, res: Response): Promise<void> {
  const { id, mid } = req.params;

  const project = db.getById('projects', id);
  if (!project) {
    errorResponse(res, '项目不存在', 404);
    return;
  }

  const milestone = db.getById('milestones', mid);
  if (!milestone || milestone.projectId !== id) {
    errorResponse(res, '里程碑不存在', 404);
    return;
  }

  const deleted = db.delete('milestones', mid);
  if (deleted) {
    successResponse(res, null, '里程碑删除成功');
  } else {
    errorResponse(res, '里程碑删除失败', 500);
  }
}
