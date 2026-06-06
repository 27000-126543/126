import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, Clock, Users, Wrench, Package, Edit3 } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import type { Task, Project, TaskStatus } from '../../shared/types.js';
import { taskApi, projectApi, workforceApi } from '../utils/apiClient';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({ name: '', description: '', projectId: '', estimatedDuration: 4, workArea: '' });
  const [adjustForm, setAdjustForm] = useState({ reason: '', suggestedChange: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [t, p, teams] = await Promise.all([
        taskApi.getTasks(),
        projectApi.getProjects(),
        workforceApi.getTeams(),
      ]);
      setTasks(t as Task[]);
      setProjects(p as Project[]);
      setTeams(teams as { id: string; name: string }[]);
    } catch (err) {
      console.error('加载失败:', err);
    }
  };

  const filteredTasks = tasks.filter(t =>
    (statusFilter === 'all' || t.status === statusFilter) &&
    (projectFilter === 'all' || t.projectId === projectFilter)
  );

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || '-';
  const getTeamName = (id: string | null) => id ? (teams.find(t => t.id === id)?.name || '-') : '-';

  const handleCreate = async () => {
    if (!newTask.name || !newTask.projectId) return;
    try {
      await taskApi.createTask({ ...newTask, status: 'not_started', dependencies: [], skills: [''], materials: [], equipment: [], isHighAltitude: false });
      setIsCreateOpen(false);
      setNewTask({ name: '', description: '', projectId: '', estimatedDuration: 4, workArea: '' });
      loadData();
    } catch (err) {
      console.error('创建失败:', err);
    }
  };

  const handleUpdateStatus = async (id: string, status: TaskStatus) => {
    try {
      await taskApi.updateTaskStatus(id, status);
      setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
    } catch (err) {
      console.error('更新失败:', err);
    }
  };

  const handleRequestAdjust = async () => {
    if (!selectedTask || !adjustForm.reason) return;
    try {
      await taskApi.createAdjustment(selectedTask.id, adjustForm);
      setIsAdjustOpen(false);
      setAdjustForm({ reason: '', suggestedChange: '' });
      setSelectedTask(null);
    } catch (err) {
      console.error('申请失败:', err);
    }
  };

  const nextStatus: Record<TaskStatus, { status: TaskStatus; label: string }[]> = {
    pending: [{ status: 'not_started', label: '标记未开始' }],
    not_started: [{ status: 'in_progress', label: '开始施工' }],
    in_progress: [{ status: 'completed', label: '标记完工' }, { status: 'rework', label: '需要返工' }],
    completed: [{ status: 'in_progress', label: '重新开始' }],
    rework: [{ status: 'in_progress', label: '重新施工' }],
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-bold text-slate-800">任务中心</h1>
        <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} />新增任务
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">状态:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">全部</option>
            <option value="pending">待开始</option>
            <option value="not_started">未开始</option>
            <option value="in_progress">施工中</option>
            <option value="completed">已完工</option>
            <option value="rework">返工</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">项目:</span>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">全部</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="w-10 p-3"></th>
                <th className="text-left p-3 text-sm font-semibold text-slate-600">任务名称</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-600">所属项目</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-600">分配班组</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-600">工期</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-600">状态</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <>
                  <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <button onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)} className="p-1 hover:bg-slate-100 rounded">
                        {expandedTask === task.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="p-3 text-sm font-medium text-slate-800">{task.name}</td>
                    <td className="p-3 text-sm text-slate-600">{getProjectName(task.projectId)}</td>
                    <td className="p-3 text-sm text-slate-600">{getTeamName(task.assignedTeamId)}</td>
                    <td className="p-3 text-sm text-slate-600">{task.estimatedDuration} 小时</td>
                    <td className="p-3"><StatusBadge status={task.status} /></td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {nextStatus[task.status]?.map(opt => (
                          <button key={opt.status} onClick={() => handleUpdateStatus(task.id, opt.status)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">{opt.label}</button>
                        ))}
                        <button onClick={() => { setSelectedTask(task); setIsAdjustOpen(true); }} className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
                          <Edit3 size={12} />申请调整
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedTask === task.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={7} className="p-4">
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">任务描述</h4>
                            <p className="text-sm text-slate-600">{task.description || '暂无描述'}</p>
                            <div className="mt-3 space-y-1 text-sm text-slate-600">
                              <div className="flex items-center gap-2"><Clock size={14} />预计工期: {task.estimatedDuration} 小时</div>
                              <div className="flex items-center gap-2"><Users size={14} />所需技能: {task.skills.join(', ')}</div>
                              <div className="flex items-center gap-2"><Wrench size={14} />施工区域: {task.workArea}</div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">依赖任务</h4>
                            {task.dependencies.length > 0 ? task.dependencies.map(depId => {
                              const dep = tasks.find(t => t.id === depId);
                              return <div key={depId} className="text-sm text-slate-600 flex items-center gap-2"><span className="w-2 h-2 bg-slate-400 rounded-full"></span>{dep?.name || depId}</div>;
                            }) : <p className="text-sm text-slate-500">无依赖任务</p>}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">资源需求</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-slate-600"><Package size={14} />材料: {task.materials.length} 项</div>
                              <div className="flex items-center gap-2 text-sm text-slate-600"><Wrench size={14} />设备: {task.equipment.length} 项</div>
                              {task.isHighAltitude && <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded inline-block">高空作业</div>}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="新增任务">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">任务名称</label><input type="text" value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入任务名称" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">所属项目</label><select value={newTask.projectId} onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">请选择项目</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">任务描述</label><textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="请输入任务描述" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">预计工期（小时）</label><input type="number" value={newTask.estimatedDuration} onChange={(e) => setNewTask({ ...newTask, estimatedDuration: Number(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">施工区域</label><input type="text" value={newTask.workArea} onChange={(e) => setNewTask({ ...newTask, workArea: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="如：A区3层" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">创建</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} title="申请调整" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg"><div className="text-sm font-medium text-slate-700">任务: {selectedTask?.name}</div><div className="text-sm text-slate-500 mt-1">当前状态: <StatusBadge status={selectedTask?.status || ''} /></div></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">调整原因</label><textarea value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="请说明调整原因" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">建议调整</label><textarea value={adjustForm.suggestedChange} onChange={(e) => setAdjustForm({ ...adjustForm, suggestedChange: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={2} placeholder="请描述建议的调整方案" /></div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setIsAdjustOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
            <button onClick={handleRequestAdjust} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">提交申请</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
