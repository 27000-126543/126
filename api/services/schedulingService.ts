import { db } from '../data/database.js';
import type { Task, Schedule, ScheduleConflict, ScheduledTask, Worker, Equipment } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export class SchedulingService {
  generateSchedule(projectId: string, date: string): Schedule {
    const tasks = db.query('tasks', t => t.projectId === projectId && t.status !== 'completed');
    const teams = db.getAll('teams');
    const workers = db.getAll('workers');
    const equipment = db.getAll('equipment');
    const materials = db.getAll('materials');

    const sortedTasks = this.topologicalSort(tasks);
    const scheduledTasks: ScheduledTask[] = [];
    const conflicts: ScheduleConflict[] = [];

    let currentHour = 8;

    for (const task of sortedTasks) {
      const availableWorkers = this.matchWorkers(task.skills, workers, teams);
      const availableEquipment = this.matchEquipment(task.equipment.map(e => e.equipmentId), equipment);
      const hasEnoughMaterials = this.checkMaterials(task.materials, materials);
      const safetyCheck = this.checkSafetyConstraints(task);

      const taskConflicts: ScheduleConflict[] = [];

      if (availableWorkers.length === 0) {
        taskConflicts.push({
          type: 'worker',
          description: `任务"${task.name}"没有匹配技能的工人可用`,
          severity: 'critical',
          taskIds: [task.id]
        });
      }

      if (task.equipment.length > 0 && availableEquipment.length === 0) {
        taskConflicts.push({
          type: 'equipment',
          description: `任务"${task.name}"所需设备不可用`,
          severity: 'critical',
          taskIds: [task.id]
        });
      }

      if (!hasEnoughMaterials) {
        taskConflicts.push({
          type: 'worker',
          description: `任务"${task.name}"所需材料库存不足`,
          severity: 'warning',
          taskIds: [task.id]
        });
      }

      if (!safetyCheck.valid) {
        taskConflicts.push({
          type: 'safety',
          description: safetyCheck.reason || `任务"${task.name}"存在安全约束冲突`,
          severity: 'critical',
          taskIds: [task.id]
        });
      }

      const workstationConflict = this.checkWorkstationConflict(task, scheduledTasks, currentHour);
      if (workstationConflict) {
        taskConflicts.push({
          type: 'workstation',
          description: `工位"${task.workArea}"在该时间段已有任务安排`,
          severity: 'warning',
          taskIds: [task.id, workstationConflict]
        });
      }

      conflicts.push(...taskConflicts);

      if (taskConflicts.filter(c => c.severity === 'critical').length === 0) {
        const duration = task.estimatedDuration / 60;
        scheduledTasks.push({
          taskId: task.id,
          startTime: `${date} ${String(Math.floor(currentHour)).padStart(2, '0')}:00:00`,
          endTime: `${date} ${String(Math.floor(currentHour + duration)).padStart(2, '0')}:00:00`,
          assignedWorkers: availableWorkers.slice(0, 3).map(w => w.id),
          assignedEquipment: availableEquipment.slice(0, 2).map(e => e.id)
        });
        currentHour += duration + 0.5;
      }
    }

    const existingSchedule = db.query('schedules', s => s.projectId === projectId && s.date === date)[0];

    if (existingSchedule) {
      return db.update('schedules', existingSchedule.id, {
        tasks: scheduledTasks,
        conflicts,
        status: 'draft'
      }) as Schedule;
    }

    return db.create('schedules', {
      projectId,
      date,
      tasks: scheduledTasks,
      status: 'draft',
      conflicts
    }) as Schedule;
  }

  private topologicalSort(tasks: Task[]): Task[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const task of tasks) {
      inDegree.set(task.id, task.dependencies.length);
      for (const dep of task.dependencies) {
        if (!adjacency.has(dep)) {
          adjacency.set(dep, []);
        }
        adjacency.get(dep)!.push(task.id);
      }
    }

    const queue: string[] = [];
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    const result: Task[] = [];
    while (queue.length > 0) {
      const taskId = queue.shift()!;
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        result.push(task);
      }

      const neighbors = adjacency.get(taskId) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result.length === tasks.length ? result : tasks;
  }

  private matchWorkers(skills: string[], workers: Worker[], teams: any[]): Worker[] {
    return workers.filter(w => {
      if (w.status !== 'available' && w.status !== 'on_site') return false;
      return skills.every(skill => w.skills.includes(skill));
    });
  }

  private matchEquipment(equipmentIds: string[], equipment: Equipment[]): Equipment[] {
    return equipment.filter(e => {
      if (!equipmentIds.includes(e.id)) return false;
      return e.status === 'available' || e.status === 'in_use';
    });
  }

  private checkMaterials(taskMaterials: { materialId: string; quantity: number }[], materials: any[]): boolean {
    for (const tm of taskMaterials) {
      if (!tm.materialId) continue;
      const material = materials.find(m => m.id === tm.materialId);
      if (!material || material.availableStock < tm.quantity) {
        return false;
      }
    }
    return true;
  }

  private checkSafetyConstraints(task: Task): { valid: boolean; reason?: string } {
    if (task.isHighAltitude) {
      const highAltitudeTasks = db.query('tasks',
        t => t.isHighAltitude && t.status === 'in_progress'
      );
      if (highAltitudeTasks.length >= 3) {
        return { valid: false, reason: '同时高空作业人数超过最大允许人数(3人)' };
      }
    }
    return { valid: true };
  }

  private checkWorkstationConflict(task: Task, scheduled: ScheduledTask[], currentHour: number): string | null {
    for (const st of scheduled) {
      const sTask = db.getById('tasks', st.taskId);
      if (sTask && sTask.workArea === task.workArea) {
        const stHour = parseInt(st.startTime.split(' ')[1].split(':')[0]);
        if (Math.abs(stHour - currentHour) < 4) {
          return st.taskId;
        }
      }
    }
    return null;
  }
}

export const schedulingService = new SchedulingService();
