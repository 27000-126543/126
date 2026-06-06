import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, Clock, HardDrive, Calendar, Users } from 'lucide-react';
import type { Project, ProgressStat, MaterialStat, SafetyStat, WorkHoursStat, EquipmentStat } from '../../shared/types.js';
import { statisticsApi, projectApi } from '../utils/apiClient.js';
import StatCard from '../components/ui/StatCard.js';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Statistics() {
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupBy, setGroupBy] = useState<'project' | 'team' | 'week' | 'month'>('week');
  const [projects, setProjects] = useState<Project[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStat[]>([]);
  const [materialStats, setMaterialStats] = useState<MaterialStat[]>([]);
  const [safetyStats, setSafetyStats] = useState<SafetyStat[]>([]);
  const [workHoursStats, setWorkHoursStats] = useState<WorkHoursStat[]>([]);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      loadStatistics();
    }
  }, [projectId, startDate, endDate, groupBy, projects]);

  const loadInitialData = async () => {
    const data = await projectApi.getProjects();
    setProjects(data as Project[]);
    setLoading(false);
  };

  const loadStatistics = async () => {
    setLoading(true);
    const params = {
      projectId: projectId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    try {
      const [progress, material, safety, workHours, equipment] = await Promise.all([
        statisticsApi.getProgressStats(params),
        statisticsApi.getMaterialStats(params),
        statisticsApi.getSafetyStats(params),
        statisticsApi.getWorkHoursStats({ ...params, teamId: undefined }),
        statisticsApi.getEquipmentStats(params),
      ]);
      setProgressStats(progress as ProgressStat[]);
      setMaterialStats(material as MaterialStat[]);
      setSafetyStats(safety as SafetyStat[]);
      setWorkHoursStats(workHours as WorkHoursStat[]);
      setEquipmentStats(equipment as EquipmentStat[]);
    } finally {
      setLoading(false);
    }
  };

  const totalIncidents = safetyStats.reduce((sum, s) => sum + s.incidents, 0);
  const totalHours = workHoursStats.reduce((sum, w) => sum + w.totalHours, 0);
  const avgProgress = progressStats.length
    ? progressStats.reduce((sum, p) => sum + p.completionRate, 0) / progressStats.length
    : 0;

  const progressData = progressStats.map(p => ({
    name: p.projectName, 计划进度: p.plannedProgress, 实际进度: p.actualProgress, 完成率: p.completionRate
  }));
  const materialData = materialStats.map(m => ({
    name: m.materialName, value: Math.abs(m.overConsumptionRate), overConsumptionRate: m.overConsumptionRate
  }));
  const safetyData = safetyStats.map(s => ({
    name: s.period, 总报警: s.totalAlarms, 严重报警: s.criticalAlarms, 事故数: s.incidents
  }));
  const workHoursData = workHoursStats.map(w => ({
    name: w.period || w.teamName, 正常工时: w.totalHours - w.overtimeHours, 加班工时: w.overtimeHours
  }));
  const equipmentData = equipmentStats.map(e => ({
    name: e.equipmentName, 利用率: e.utilizationRate, 运行时长: e.totalRuntime / 100
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 font-display">统计分析</h1>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">项目</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input-field w-48"
            >
              <option value="">全部项目</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field w-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field w-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">分组方式</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
              className="input-field w-40"
            >
              <option value="project">按项目</option>
              <option value="team">按班组</option>
              <option value="week">按周</option>
              <option value="month">按月</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="平均完成率"
          value={`${avgProgress.toFixed(1)}%`}
          icon={<TrendingUp size={24} />}
          color="blue"
          delay={0}
        />
        <StatCard
          title="安全事故数"
          value={totalIncidents}
          icon={<AlertTriangle size={24} />}
          color={totalIncidents > 0 ? 'red' : 'green'}
          delay={0.1}
        />
        <StatCard
          title="总工时"
          value={`${totalHours.toLocaleString()}h`}
          icon={<Clock size={24} />}
          color="green"
          delay={0.2}
        />
        <StatCard
          title="设备数"
          value={equipmentStats.length}
          icon={<HardDrive size={24} />}
          color="orange"
          delay={0.3}
        />
      </div>

      {loading && (
        <div className="text-center py-12 text-slate-500">加载中...</div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              进度完成率
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="计划进度" fill="#94A3B8" />
                  <Bar dataKey="实际进度" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-600" />
              材料超耗率
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, overConsumptionRate }) => `${name}: ${overConsumptionRate}%`}
                  >
                    {materialData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" />
              安全事故统计
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safetyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="总报警" fill="#F59E0B" />
                  <Bar dataKey="严重报警" fill="#EF4444" />
                  <Bar dataKey="事故数" fill="#7C3AED" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-green-600" />
              工时统计
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={workHoursData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="正常工时" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="加班工时" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4 lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <HardDrive size={20} className="text-purple-600" />
              设备利用率
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={equipmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="利用率" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
