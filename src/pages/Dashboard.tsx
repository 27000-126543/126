import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ListTodo,
  Package,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import AlarmModal from '@/components/ui/AlarmModal';
import { useAppStore } from '@/store/appStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { Project, SafetyAlarm } from '../../shared/types.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedAlarm, setSelectedAlarm] = useState<SafetyAlarm | null>(null);
  const {
    projects,
    tasks,
    materials,
    alarms,
    loading,
    fetchProjects,
    fetchTasks,
    fetchMaterials,
    fetchAlarms,
  } = useAppStore();

  useWebSocket();

  useEffect(() => {
    fetchProjects();
    fetchTasks();
    fetchMaterials();
    fetchAlarms();
  }, [fetchProjects, fetchTasks, fetchMaterials, fetchAlarms]);

  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const materialAlerts = materials.filter((m) => m.availableStock < m.safetyStock).length;
  const unhandledAlarms = alarms.filter((a) => !a.acknowledged).length;

  const topProjects = projects.slice(0, 5);
  const recentAlarms = alarms.slice(0, 5);

  const budgetData = projects.slice(0, 6).map((p) => ({
    name: p.name.length > 6 ? p.name.slice(0, 6) + '...' : p.name,
    预算: p.budget / 10000,
    实际成本: p.actualCost / 10000,
  }));

  const getProjectProgress = (project: Project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const handleAlarmClick = (alarm: SafetyAlarm) => {
    if (!alarm.acknowledged) {
      setSelectedAlarm(alarm);
    }
  };

  const handleAcknowledge = () => {
    setSelectedAlarm(null);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-800 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">项目总览</h1>
          <p className="text-slate-500 text-sm mt-1">实时监控所有项目进度和状态</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="项目总数"
          value={projects.length}
          icon={<Building2 size={24} />}
          color="blue"
          delay={0}
        />
        <StatCard
          title="进行中任务"
          value={inProgressTasks}
          icon={<ListTodo size={24} />}
          color="green"
          delay={0.1}
        />
        <StatCard
          title="材料预警"
          value={materialAlerts}
          icon={<Package size={24} />}
          color="yellow"
          delay={0.2}
        />
        <StatCard
          title="未处理报警"
          value={unhandledAlarms}
          icon={<AlertTriangle size={24} />}
          color="red"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 font-display">项目进度</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm text-primary-800 hover:text-primary-600 flex items-center gap-1"
            >
              查看全部 <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-4">
            {topProjects.map((project) => {
              const progress = getProjectProgress(project);
              return (
                <div
                  key={project.id}
                  className="p-4 border-2 border-slate-100 hover:border-primary-200 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{project.name}</span>
                        <StatusBadge status={project.status} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <DollarSign size={14} />
                        <span>
                          ¥{project.actualCost.toLocaleString()} / ¥{project.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary-800">{progress}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100">
                    <div
                      className="h-full bg-primary-800 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {topProjects.length === 0 && (
              <div className="text-center py-8 text-slate-500">暂无项目数据</div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800 font-display">最新报警</h2>
            {unhandledAlarms > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium animate-pulse">
                {unhandledAlarms} 条待处理
              </span>
            )}
          </div>
          <div className="space-y-3">
            {recentAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`p-3 border-2 cursor-pointer transition-colors ${
                  alarm.acknowledged
                    ? 'border-slate-100 bg-slate-50'
                    : 'border-red-200 bg-red-50 hover:bg-red-100'
                }`}
                onClick={() => handleAlarmClick(alarm)}
              >
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge status={alarm.level} />
                  <span className="text-xs text-slate-400">
                    {new Date(alarm.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">{alarm.message}</p>
              </div>
            ))}
            {recentAlarms.length === 0 && (
              <div className="text-center py-8 text-slate-500">暂无报警数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 font-display">预算执行情况</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp size={16} className="text-green-600" />
            <span>单位：万元</span>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '0',
                }}
              />
              <Legend />
              <Bar dataKey="预算" fill="#1e3a5f" radius={[0, 0, 0, 0]} />
              <Bar dataKey="实际成本" fill="#eab308" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AlarmModal
        alarm={selectedAlarm}
        onClose={() => setSelectedAlarm(null)}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
}
