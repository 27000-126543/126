import { useState, useEffect } from 'react';
import { Plus, Edit2, Users, User, BarChart3, Trash2, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Worker, Team, WorkHoursStat } from '../../shared/types.js';
import { workforceApi } from '../utils/apiClient.js';
import StatusBadge from '../components/ui/StatusBadge.js';
import Modal from '../components/ui/Modal.js';

type TabType = 'workers' | 'teams';

export default function Workforce() {
  const [activeTab, setActiveTab] = useState<TabType>('workers');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workHoursStats, setWorkHoursStats] = useState<WorkHoursStat[]>([]);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    employeeNo: '', name: '', teamId: '', skills: '', status: 'available' as Worker['status']
  });
  const [teamForm, setTeamForm] = useState({
    name: '', teamLeaderId: '', type: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    const [workersData, teamsData, stats] = await Promise.all([
      workforceApi.getWorkers(),
      workforceApi.getTeams(),
      workforceApi.getWorkHoursStats(),
    ]);
    setWorkers(workersData as Worker[]);
    setTeams(teamsData as Team[]);
    setWorkHoursStats(stats as WorkHoursStat[]);
  };

  const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || '未分配';
  const getTeamLeaderName = (leaderId: string) => workers.find(w => w.id === leaderId)?.name || '未指定';

  const openWorkerModal = (worker?: Worker) => {
    setEditingWorker(worker || null);
    setWorkerForm(worker
      ? { employeeNo: worker.employeeNo, name: worker.name, teamId: worker.teamId, skills: worker.skills.join(', '), status: worker.status }
      : { employeeNo: '', name: '', teamId: '', skills: '', status: 'available' });
    setIsWorkerModalOpen(true);
  };

  const openTeamModal = (team?: Team) => {
    setEditingTeam(team || null);
    setTeamForm(team
      ? { name: team.name, teamLeaderId: team.teamLeaderId, type: team.type }
      : { name: '', teamLeaderId: '', type: '' });
    setIsTeamModalOpen(true);
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...workerForm, skills: workerForm.skills.split(',').map(s => s.trim()).filter(Boolean) };
      editingWorker
        ? await workforceApi.updateWorker(editingWorker.id, data)
        : await workforceApi.createWorker(data);
      setIsWorkerModalOpen(false);
      loadData();
    } finally { setLoading(false); }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      editingTeam
        ? await workforceApi.updateTeam(editingTeam.id, teamForm)
        : await workforceApi.createTeam({ ...teamForm, members: [] });
      setIsTeamModalOpen(false);
      loadData();
    } finally { setLoading(false); }
  };

  const deleteWorker = (id: string) => { if (confirm('删除该工人？')) workforceApi.deleteWorker(id).then(loadData); };
  const deleteTeam = (id: string) => { if (confirm('删除该班组？')) workforceApi.deleteTeam(id).then(loadData); };

  const chartData = workHoursStats.map(s => ({
    name: s.teamName || s.period,
    正常工时: s.totalHours - s.overtimeHours,
    加班工时: s.overtimeHours,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 font-display">人员管理</h1>
        <button
          onClick={() => activeTab === 'workers' ? openWorkerModal() : openTeamModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增{activeTab === 'workers' ? '工人' : '班组'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('workers')}
          className={`btn ${activeTab === 'workers' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
        >
          <User size={16} />
          工人
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`btn ${activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
        >
          <Users size={16} />
          班组
        </button>
      </div>

      {activeTab === 'workers' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">工号</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">姓名</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">班组</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">技能</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">状态</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">总工时</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{worker.employeeNo}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{worker.name}</td>
                  <td className="px-4 py-3 text-slate-600">{getTeamName(worker.teamId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={worker.status} /></td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Clock size={14} />
                      {worker.totalWorkHours}h
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openWorkerModal(worker)} className="p-1 hover:bg-slate-100">
                        <Edit2 size={16} className="text-blue-600" />
                      </button>
                      <button onClick={() => deleteWorker(worker.id)} className="p-1 hover:bg-slate-100">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">班组名称</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">组长</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">成员数量</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">类型</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{team.name}</td>
                  <td className="px-4 py-3 text-slate-600">{getTeamLeaderName(team.teamLeaderId)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Users size={14} />
                      {team.members.length}人
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs">
                      {team.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openTeamModal(team)} className="p-1 hover:bg-slate-100">
                        <Edit2 size={16} className="text-blue-600" />
                      </button>
                      <button onClick={() => deleteTeam(team.id)} className="p-1 hover:bg-slate-100">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-4 mt-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          工时统计
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="正常工时" fill="#10B981" />
              <Bar dataKey="加班工时" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Modal isOpen={isWorkerModalOpen} onClose={() => setIsWorkerModalOpen(false)} title={editingWorker ? '编辑工人' : '新增工人'}>
        <form onSubmit={handleSaveWorker} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">工号</label>
            <input
              type="text"
              value={workerForm.employeeNo}
              onChange={(e) => setWorkerForm({ ...workerForm, employeeNo: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">姓名</label>
            <input
              type="text"
              value={workerForm.name}
              onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">班组</label>
            <select
              value={workerForm.teamId}
              onChange={(e) => setWorkerForm({ ...workerForm, teamId: e.target.value })}
              className="input-field"
            >
              <option value="">请选择班组</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">技能 (逗号分隔)</label>
            <input
              type="text"
              value={workerForm.skills}
              onChange={(e) => setWorkerForm({ ...workerForm, skills: e.target.value })}
              className="input-field"
              placeholder="例如: 电工, 焊工"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
            <select
              value={workerForm.status}
              onChange={(e) => setWorkerForm({ ...workerForm, status: e.target.value as Worker['status'] })}
              className="input-field"
            >
              <option value="available">可用</option>
              <option value="on_site">在岗</option>
              <option value="leave">请假</option>
              <option value="off_work">下班</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsWorkerModalOpen(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title={editingTeam ? '编辑班组' : '新增班组'}>
        <form onSubmit={handleSaveTeam} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">班组名称</label>
            <input
              type="text"
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">组长</label>
            <select
              value={teamForm.teamLeaderId}
              onChange={(e) => setTeamForm({ ...teamForm, teamLeaderId: e.target.value })}
              className="input-field"
            >
              <option value="">请选择组长</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.employeeNo})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
            <input
              type="text"
              value={teamForm.type}
              onChange={(e) => setTeamForm({ ...teamForm, type: e.target.value })}
              className="input-field"
              placeholder="例如: 电工班, 焊工班"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsTeamModalOpen(false)} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
