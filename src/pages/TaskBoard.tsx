import { useState, useEffect } from 'react';
import { Play, CheckCircle, RotateCcw, Users, Clock, MapPin, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import type { Task, TaskStatus } from '../../shared/types.js';
import { taskApi, workforceApi } from '../utils/apiClient';

const COLUMNS: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'not_started', title: '未开始', color: 'border-slate-400' },
  { status: 'in_progress', title: '施工中', color: 'border-blue-500' },
  { status: 'completed', title: '已完工', color: 'border-green-500' },
  { status: 'rework', title: '返工', color: 'border-red-500' },
];

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, teamsData] = await Promise.all([
        taskApi.getTasks(),
        workforceApi.getTeams(),
      ]);
      setTasks(tasksData as Task[]);
      setTeams(teamsData as { id: string; name: string }[]);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(t => t.status === status);
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return '未分配';
    return teams.find(t => t.id === teamId)?.name || '未知班组';
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (targetStatus: TaskStatus) => {
    if (!draggedTask) return;
    try {
      await taskApi.updateTaskStatus(draggedTask.id, targetStatus);
      setTasks(tasks.map(t => t.id === draggedTask.id ? { ...t, status: targetStatus } : t));
    } catch (error) {
      console.error('更新状态失败:', error);
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleQuickAction = async (task: Task, newStatus: TaskStatus) => {
    try {
      await taskApi.updateTaskStatus(task.id, newStatus);
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const getQuickActions = (task: Task): { status: TaskStatus; label: string; icon: React.ReactNode; color: string }[] => {
    switch (task.status) {
      case 'not_started':
        return [{ status: 'in_progress', label: '开始', icon: <Play size={14} />, color: 'bg-blue-500 hover:bg-blue-600' }];
      case 'in_progress':
        return [
          { status: 'completed', label: '完成', icon: <CheckCircle size={14} />, color: 'bg-green-500 hover:bg-green-600' },
          { status: 'rework', label: '返工', icon: <RotateCcw size={14} />, color: 'bg-red-500 hover:bg-red-600' },
        ];
      case 'rework':
        return [{ status: 'in_progress', label: '开始', icon: <Play size={14} />, color: 'bg-blue-500 hover:bg-blue-600' }];
      case 'completed':
        return [{ status: 'in_progress', label: '重启', icon: <RotateCcw size={14} />, color: 'bg-orange-500 hover:bg-orange-600' }];
      default:
        return [];
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-bold text-slate-800">任务看板</h1>
        <div className="text-sm text-slate-500">拖拽卡片可切换任务状态</div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {COLUMNS.map(column => {
          const columnTasks = getTasksByStatus(column.status);
          return (
            <div
              key={column.status}
              className={`flex-1 flex flex-col rounded-lg border-2 ${
                dragOverColumn === column.status
                  ? 'border-blue-500 bg-blue-50'
                  : `border-slate-200 ${column.color.replace('border-', 'border-t-4 border-')}`
              } transition-colors`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(column.status)}
            >
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-lg">
                <h3 className="font-semibold text-slate-700">{column.title}</h3>
                <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {columnTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onClick={() => openTaskDetail(task)}
                    className={`bg-white p-3 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-all ${
                      draggedTask?.id === task.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-slate-800 text-sm flex-1 pr-2">{task.name}</h4>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users size={12} />
                        {getTeamName(task.assignedTeamId)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {task.estimatedDuration} 小时
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        {task.workArea}
                      </div>
                      {task.isHighAltitude && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <AlertTriangle size={12} />
                          高空作业
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-1">
                      {getQuickActions(task).map(action => (
                        <button
                          key={action.status}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction(task, action.status);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 text-xs text-white rounded ${action.color} transition-colors`}
                        >
                          {action.icon}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-8">暂无任务</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="任务详情" size="lg">
        {selectedTask && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">{selectedTask.name}</h3>
              <StatusBadge status={selectedTask.status} />
            </div>
            <p className="text-slate-600">{selectedTask.description || '暂无描述'}</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">分配班组</div>
                <div className="font-medium text-slate-800">{getTeamName(selectedTask.assignedTeamId)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">预计工期</div>
                <div className="font-medium text-slate-800">{selectedTask.estimatedDuration} 小时</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">施工区域</div>
                <div className="font-medium text-slate-800">{selectedTask.workArea}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">所需技能</div>
              <div className="flex flex-wrap gap-2">
                {selectedTask.skills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {getQuickActions(selectedTask).map(action => (
                <button
                  key={action.status}
                  onClick={() => {
                    handleQuickAction(selectedTask, action.status);
                    setIsDetailModalOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg ${action.color} transition-colors`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
