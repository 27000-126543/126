import { useState, useEffect } from 'react';
import { Calendar, Play, CheckCircle, Send, ChevronDown, ChevronRight, AlertTriangle, Clock, Users, Wrench } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import type { Task, Schedule, ScheduleConflict, ScheduledTask, Project } from '../../shared/types.js';
import { schedulingApi, taskApi, projectApi } from '../utils/apiClient';

export default function Scheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await projectApi.getProjects() as Project[];
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error('加载项目失败:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const data = await taskApi.getTasks({ projectId: selectedProject }) as Task[];
      setTasks(data);
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  };

  const generateSchedule = async () => {
    if (!selectedProject || !selectedDate) return;
    setLoading(true);
    try {
      const data = await schedulingApi.generateSchedule(selectedProject, selectedDate) as Schedule;
      setSchedule(data);
    } catch (error) {
      console.error('生成排程失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmSchedule = async () => {
    if (!schedule) return;
    try {
      await schedulingApi.confirmSchedule(schedule.id);
      setSchedule({ ...schedule, status: 'confirmed' });
    } catch (error) {
      console.error('确认排程失败:', error);
    }
  };

  const publishSchedule = async () => {
    if (!schedule) return;
    try {
      await schedulingApi.publishSchedule(schedule.id);
      setSchedule({ ...schedule, status: 'published' });
    } catch (error) {
      console.error('发布排程失败:', error);
    }
  };

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const hasConflict = (taskId: string) => {
    return schedule?.conflicts.some(c => c.taskIds.includes(taskId)) || false;
  };

  const getScheduledTask = (taskId: string): ScheduledTask | undefined => {
    return schedule?.tasks.find(t => t.taskId === taskId);
  };

  const getTaskPosition = (scheduledTask: ScheduledTask) => {
    const startTime = new Date(scheduledTask.startTime);
    const endTime = new Date(scheduledTask.endTime);
    const dayStart = new Date(selectedDate);
    dayStart.setHours(8, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(18, 0, 0, 0);
    
    const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / 60000;
    const startMinutes = (startTime.getTime() - dayStart.getTime()) / 60000;
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
    
    const left = Math.max(0, (startMinutes / totalMinutes) * 100);
    const width = Math.min(100 - left, (durationMinutes / totalMinutes) * 100);
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const getConflictColor = (conflict: ScheduleConflict) => {
    return conflict.severity === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-bold text-slate-800">智能排程</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={generateSchedule}
            disabled={loading || !selectedProject}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Play size={18} />
            {loading ? '生成中...' : '生成排程'}
          </button>
          {schedule && (
            <>
              <button
                onClick={confirmSchedule}
                disabled={schedule.status !== 'draft'}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={18} />
                确认排程
              </button>
              <button
                onClick={publishSchedule}
                disabled={schedule.status === 'published'}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
                发布排程
              </button>
            </>
          )}
        </div>
      </div>

      {schedule && schedule.conflicts.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
            <AlertTriangle size={20} />
            检测到 {schedule.conflicts.length} 个排程冲突
          </div>
          <div className="space-y-2">
            {schedule.conflicts.map((conflict, idx) => (
              <div key={idx} className={`p-3 rounded border ${getConflictColor(conflict)}`}>
                <span className="font-medium">{conflict.type === 'workstation' ? '工位冲突' : conflict.type === 'equipment' ? '设备冲突' : conflict.type === 'worker' ? '人员冲突' : '安全冲突'}: </span>
                {conflict.description}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="w-80 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 font-semibold text-slate-800">任务列表</div>
          <div className="flex-1 overflow-y-auto">
            {tasks.map(task => (
              <div key={task.id} className={`border-b border-slate-100 ${hasConflict(task.id) ? 'bg-red-50' : ''}`}>
                <div
                  className="flex items-center gap-2 p-3 hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleTask(task.id)}
                >
                  {expandedTasks.has(task.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="flex-1 text-sm font-medium text-slate-700">{task.name}</span>
                  <StatusBadge status={task.status} />
                </div>
                {expandedTasks.has(task.id) && (
                  <div className="px-6 pb-3 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      预计工期: {task.estimatedDuration} 小时
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      所需技能: {task.skills.join(', ')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench size={14} />
                      材料需求: {task.materials.length} 项
                    </div>
                    {task.dependencies.length > 0 && (
                      <div className="text-slate-500">依赖任务: {task.dependencies.length} 个</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 font-semibold text-slate-800">甘特图</div>
          <div className="flex-1 overflow-auto">
            <div className="min-w-[800px] p-4">
              <div className="flex border-b border-slate-200 mb-2">
                <div className="w-40 flex-shrink-0 p-2 text-xs font-semibold text-slate-500">任务</div>
                <div className="flex-1 flex">
                  {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
                    <div key={hour} className="flex-1 text-center text-xs text-slate-500 border-l border-slate-100 py-2">
                      {hour}:00
                    </div>
                  ))}
                </div>
              </div>
              {tasks.map(task => {
                const scheduled = getScheduledTask(task.id);
                const position = scheduled ? getTaskPosition(scheduled) : null;
                return (
                  <div key={task.id} className="flex items-center border-b border-slate-100 h-14">
                    <div className="w-40 flex-shrink-0 p-2 text-sm truncate" title={task.name}>
                      {task.name}
                    </div>
                    <div className="flex-1 relative h-full px-1">
                      {position && (
                        <div
                          className={`absolute top-2 bottom-2 rounded px-2 py-1 text-xs text-white ${
                            hasConflict(task.id) ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ left: position.left, width: position.width }}
                        >
                          <div className="truncate font-medium">{task.name}</div>
                          {scheduled && (
                            <div className="opacity-80 text-[10px]">
                              {new Date(scheduled.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - {new Date(scheduled.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
