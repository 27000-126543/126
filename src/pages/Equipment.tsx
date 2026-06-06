import { useState, useEffect } from 'react';
import { Plus, Play, Square, Wrench, Monitor, Truck, Cpu, HardDrive, Settings, Clock, Calendar, Activity } from 'lucide-react';
import type { Equipment as EquipmentType } from '../../shared/types.js';
import { equipmentApi } from '../utils/apiClient.js';
import StatusBadge from '../components/ui/StatusBadge.js';
import Modal from '../components/ui/Modal.js';

const typeIcons: Record<string, typeof Monitor> = {
  '起重机': Truck,
  '挖掘机': HardDrive,
  '混凝土泵车': Settings,
  '升降机': Wrench,
  '发电机': Cpu,
  '切割机': Monitor,
};

const statusColors: Record<string, string> = {
  available: 'text-green-600',
  in_use: 'text-blue-600',
  maintenance: 'text-yellow-600',
  fault: 'text-red-600',
  retired: 'text-slate-600',
};

export default function Equipment() {
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    code: '', name: '', type: '', location: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, [typeFilter, statusFilter]);

  const loadEquipment = async () => {
      const params: { status?: string; type?: string } = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const data = await equipmentApi.getEquipment(params);
      setEquipment(data as EquipmentType[]);
    };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await equipmentApi.createEquipment(newEquipment);
      setIsModalOpen(false);
      loadEquipment();
      setNewEquipment({ code: '', name: '', type: '', location: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartUsage = async (id: string) => {
    await equipmentApi.startUsage(id, { operatorId: '1', taskId: '1' });
    loadEquipment();
  };

  const handleEndUsage = async (id: string) => {
    await equipmentApi.endUsage(id);
    loadEquipment();
  };

  const types = [...new Set(equipment.map(e => e.type))];

  const getRuntimeProgress = (eq: EquipmentType) => {
    return Math.min((eq.totalRuntime / eq.maintenanceThreshold) * 100, 100);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 font-display">设备管理</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增设备
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field w-48"
        >
          <option value="">全部类型</option>
          {types.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-48"
        >
          <option value="">全部状态</option>
          <option value="available">可用</option>
          <option value="in_use">使用中</option>
          <option value="maintenance">维保中</option>
          <option value="fault">故障</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {equipment.map((eq) => {
          const IconComponent = typeIcons[eq.type] || Monitor;
          const progress = getRuntimeProgress(eq);
          return (
            <div key={eq.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-slate-100 ${statusColors[eq.status]}`}>
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{eq.code}</p>
                    <h3 className="font-semibold text-slate-800">{eq.name}</h3>
                  </div>
                </div>
                <StatusBadge status={eq.status} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">类型</span>
                  <span className="text-slate-700">{eq.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock size={14} />运行时长
                  </span>
                  <span className="text-slate-700">{eq.totalRuntime}h</span>
                </div>
                <div className="w-full bg-slate-200 h-2 mt-1">
                  <div
                    className={`h-full transition-all ${progress > 80 ? 'bg-red-500' : progress > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar size={14} />下次维保
                  </span>
                  <span className="text-slate-700">{eq.nextMaintenanceHours}h后</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Activity size={14} />位置
                  </span>
                  <span className="text-slate-700">{eq.location}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {eq.status === 'available' && (
                  <button
                    onClick={() => handleStartUsage(eq.id)}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-1 py-1 text-sm"
                  >
                    <Play size={14} />开始使用
                  </button>
                )}
                {eq.status === 'in_use' && (
                  <button
                    onClick={() => handleEndUsage(eq.id)}
                    className="btn btn-danger flex-1 flex items-center justify-center gap-1 py-1 text-sm"
                  >
                    <Square size={14} />结束使用
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增设备">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">设备编号</label>
            <input
              type="text"
              value={newEquipment.code}
              onChange={(e) => setNewEquipment({ ...newEquipment, code: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">设备名称</label>
            <input
              type="text"
              value={newEquipment.name}
              onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">设备类型</label>
            <input
              type="text"
              value={newEquipment.type}
              onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">存放位置</label>
            <input
              type="text"
              value={newEquipment.location}
              onChange={(e) => setNewEquipment({ ...newEquipment, location: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
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
