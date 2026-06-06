import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, Building2, DollarSign, MapPin, Calendar, Plus,
  CheckCircle2, Clock, AlertCircle, Target,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/store/appStore';
import { projectApi } from '@/utils/apiClient';
import type { Project, Milestone } from '../../shared/types.js';

const COLORS = ['#1e3a5f', '#eab308', '#94a3b8'];

const InfoItem = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <Icon size={20} className="text-primary-800 mt-0.5" />
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color }: {
  icon: LucideIcon; label: string; value: number; color: string;
}) => (
  <div className={`p-4 border-2 ${color}`}>
    <div className="flex items-center gap-2 text-slate-500 mb-2">
      <Icon size={18} />
      <span className="text-sm">{label}</span>
    </div>
    <p className="text-3xl font-bold text-slate-800">{value}</p>
  </div>
);

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, tasks, fetchProjects, fetchTasks } = useAppStore();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ name: '', plannedDate: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (id) loadProjectData(id); }, [id]);

  const loadProjectData = async (projectId: string) => {
    await Promise.all([fetchProjects(), fetchTasks()]);
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setProject(proj);
      try {
        const data = (await projectApi.getMilestones(projectId)) as Milestone[];
        setMilestones(data);
      } catch (err) {
        console.error('Failed to load milestones:', err);
      }
    }
  };

  const projectTasks = tasks.filter((t) => t.projectId === id);
  const taskStats = {
    total: projectTasks.length,
    completed: projectTasks.filter((t) => t.status === 'completed').length,
    inProgress: projectTasks.filter((t) => t.status === 'in_progress').length,
    pending: projectTasks.filter((t) => ['pending', 'not_started'].includes(t.status)).length,
  };

  const budgetData = project ? [
    { name: '已使用', value: project.actualCost },
    { name: '剩余', value: Math.max(0, project.budget - project.actualCost) },
  ] : [];

  const budgetPercent = project ? Math.min(100, Math.round((project.actualCost / project.budget) * 100)) : 0;

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    try {
      await projectApi.createMilestone(id, { ...milestoneForm, status: 'pending', actualDate: null });
      const data = (await projectApi.getMilestones(id)) as Milestone[];
      setMilestones(data);
      setIsMilestoneModalOpen(false);
      setMilestoneForm({ name: '', plannedDate: '', description: '' });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-800 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-slate-100 transition-colors">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">{project.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-500 font-mono">{project.projectNo}</span>
            <StatusBadge status={project.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-slate-800 font-display mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={Building2} label="项目描述" value={project.description} />
            <InfoItem icon={MapPin} label="项目地点" value={project.location} />
            <InfoItem icon={Calendar} label="计划周期" value={`${project.startDate} 至 ${project.endDate}`} />
            <InfoItem icon={DollarSign} label="预算金额" value={`¥${project.budget.toLocaleString()}`} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-800 font-display mb-4">预算执行</h2>
          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={budgetData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value">
                  {budgetData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-primary-800">{budgetPercent}%</span>
              <span className="text-sm text-slate-500">已使用</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#1e3a5f]" />
              <span className="text-sm text-slate-600">已使用</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#eab308]" />
              <span className="text-sm text-slate-600">剩余</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 font-display">里程碑</h2>
          <button onClick={() => setIsMilestoneModalOpen(true)} className="btn btn-primary text-sm flex items-center gap-2">
            <Plus size={16} /> 新增里程碑
          </button>
        </div>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-4">
            {milestones.map((m) => (
              <div key={m.id} className="relative flex gap-4 pl-12">
                <div className="absolute left-4 w-4 h-4 rounded-full border-4 border-white shadow-md z-10 bg-primary-800" />
                <div className="flex-1 p-4 border-2 border-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{m.name}</span>
                        <StatusBadge status={m.status} />
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{m.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">计划日期</p>
                      <p className="text-sm font-medium text-slate-700">{m.plannedDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {milestones.length === 0 && <div className="text-center py-8 text-slate-500">暂无里程碑数据</div>}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800 font-display mb-4">任务统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Target} label="总任务" value={taskStats.total} color="bg-slate-50 border-slate-200" />
          <StatCard icon={CheckCircle2} label="已完成" value={taskStats.completed} color="bg-green-50 border-green-200" />
          <StatCard icon={Clock} label="进行中" value={taskStats.inProgress} color="bg-blue-50 border-blue-200" />
          <StatCard icon={AlertCircle} label="待开始" value={taskStats.pending} color="bg-yellow-50 border-yellow-200" />
        </div>
      </div>

      <Modal isOpen={isMilestoneModalOpen} onClose={() => setIsMilestoneModalOpen(false)} title="新增里程碑">
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">里程碑名称</label>
            <input type="text" value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">计划完成日期</label>
            <input type="date" value={milestoneForm.plannedDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, plannedDate: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
            <textarea value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} rows={3} className="input-field" required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsMilestoneModalOpen(false)} className="btn btn-secondary">取消</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
