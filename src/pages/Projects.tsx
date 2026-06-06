import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, Filter, DollarSign, MapPin, Calendar } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/store/appStore';
import { projectApi } from '@/utils/apiClient';
import type { Project, ProjectStatus } from '../../shared/types.js';

interface ProjectFormData {
  projectNo: string;
  name: string;
  budget: string;
  actualCost: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  description: string;
  location: string;
}

const initialFormData: ProjectFormData = {
  projectNo: '', name: '', budget: '', actualCost: '0',
  startDate: '', endDate: '', status: 'planning', description: '', location: '',
};

export default function Projects() {
  const navigate = useNavigate();
  const { projects, tasks, fetchProjects } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProgress = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const handleAdd = () => {
    setEditingProject(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      projectNo: project.projectNo, name: project.name,
      budget: project.budget.toString(), actualCost: project.actualCost.toString(),
      startDate: project.startDate, endDate: project.endDate,
      status: project.status, description: project.description, location: project.location,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此项目吗？')) return;
    try {
      await projectApi.deleteProject(id);
      fetchProjects();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const submitData = { ...formData, budget: Number(formData.budget), actualCost: Number(formData.actualCost) };
    try {
      editingProject
        ? await projectApi.updateProject(editingProject.id, submitData)
        : await projectApi.createProject(submitData);
      fetchProjects();
      setIsModalOpen(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const FormField = ({ label, name, type = 'text', required = true }: {
    label: string; name: string; type?: string; required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type} name={name} value={formData[name as keyof ProjectFormData]}
        onChange={handleInputChange} className="input-field" required={required}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display">项目管理</h1>
          <p className="text-slate-500 text-sm mt-1">管理所有工程项目信息</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> 新增项目
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="搜索项目编号或名称..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-40"
            >
              <option value="all">全部状态</option>
              <option value="planning">规划中</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="suspended">已暂停</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                {['项目编号', '项目名称', '预算', '实际成本', '进度', '状态', '操作'].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-sm font-semibold text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((project) => {
                const progress = getProgress(project.id);
                return (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4"><span className="font-mono text-sm text-slate-600">{project.projectNo}</span></td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-800">{project.name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <MapPin size={12} /> <span>{project.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <DollarSign size={14} /> <span className="font-medium">{project.budget.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <DollarSign size={14} /> <span className="font-medium">{project.actualCost.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-100">
                          <div className="h-full bg-primary-800" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={project.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/projects/${project.id}`)} className="p-2 text-primary-800 hover:bg-primary-50" title="查看详情">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEdit(project)} className="p-2 text-blue-600 hover:bg-blue-50" title="编辑">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(project.id)} className="p-2 text-red-600 hover:bg-red-50" title="删除">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProjects.length === 0 && (
            <div className="text-center py-12 text-slate-500">暂无项目数据</div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingProject ? '编辑项目' : '新增项目'} size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="项目编号" name="projectNo" />
            <FormField label="项目名称" name="name" />
            <FormField label="预算金额" name="budget" type="number" />
            <FormField label="实际成本" name="actualCost" type="number" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar size={14} className="inline mr-1" /> 开始日期
              </label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar size={14} className="inline mr-1" /> 结束日期
              </label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <MapPin size={14} className="inline mr-1" /> 项目地点
              </label>
              <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">项目状态</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className="input-field" required>
                <option value="planning">规划中</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="suspended">已暂停</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">项目描述</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="input-field" required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">取消</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
