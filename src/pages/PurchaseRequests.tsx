import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Clock, CheckCircle, XCircle, User, FileText, ChevronRight } from 'lucide-react';
import type { PurchaseRequest, Material } from '../../shared/types';
import { materialApi } from '../utils/apiClient';
import { useAuthStore } from '../store/appStore';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';

export default function PurchaseRequests() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    materialId: '', quantity: 0, reason: ''
  });
  const { user } = useAuthStore();
  const isProjectManager = user?.role === 'project_manager';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsData, materialsData] = await Promise.all([
        materialApi.getPurchaseRequests() as Promise<PurchaseRequest[]>,
        materialApi.getMaterials() as Promise<Material[]>
      ]);
      setRequests(requestsData);
      setMaterials(materialsData);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await materialApi.createPurchaseRequest(formData);
    setShowAddModal(false);
    setFormData({ materialId: '', quantity: 0, reason: '' });
    fetchData();
  };

  const handleApprove = async (id: string) => {
    await materialApi.approvePurchaseRequest(id);
    fetchData();
  };

  const getMaterialName = (id: string) => {
    return materials.find(m => m.id === id)?.name || '未知材料';
  };

  const getMaterialCode = (id: string) => {
    return materials.find(m => m.id === id)?.code || '';
  };

  const getStatusTimeline = (status: string) => {
    const steps = [
      { key: 'draft', label: '草稿' },
      { key: 'pending', label: '待审批' },
      { key: 'approved', label: '已批准' },
      { key: 'ordered', label: '已下单' },
      { key: 'received', label: '已入库' },
    ];
    const currentIndex = steps.findIndex(s => s.key === status);
    return steps.map((step, idx) => ({
      ...step,
      completed: idx <= currentIndex,
      current: idx === currentIndex
    }));
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <ShoppingCart /> 采购申请
          </h1>
          <p className="text-slate-500 mt-1">管理材料采购申请及审批流程</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> 新增申请
        </button>
      </div>

      <div className="space-y-4">
        {requests.map((pr, idx) => {
          const timeline = getStatusTimeline(pr.status);
          return (
            <div key={pr.id} className="card p-5 animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-slate-800">
                        {getMaterialName(pr.materialId)}
                      </h3>
                      <span className="font-mono text-sm text-slate-500">{getMaterialCode(pr.materialId)}</span>
                      <StatusBadge status={pr.status} />
                    </div>
                    <div className="flex items-center gap-6 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <ShoppingCart size={14} /> 采购数量: <strong className="text-slate-800">{pr.quantity}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} /> 申请人: <strong className="text-slate-800">{pr.requestedBy}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {new Date(pr.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="mt-2 text-slate-600 text-sm">
                      <span className="font-medium">申请原因:</span> {pr.reason}
                    </p>
                  </div>
                </div>
                {isProjectManager && pr.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary flex items-center gap-1 text-sm"
                      onClick={() => handleApprove(pr.id)}
                    >
                      <CheckCircle size={16} /> 批准
                    </button>
                    <button className="btn btn-secondary flex items-center gap-1 text-sm text-red-600 border-red-600">
                      <XCircle size={16} /> 驳回
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50">
                {timeline.map((step, stepIdx) => (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex items-center gap-2 px-3 py-1 ${
                      step.current ? 'bg-primary-100 text-primary-700 font-medium' :
                      step.completed ? 'text-green-600' : 'text-slate-400'
                    }`}>
                      {step.completed && !step.current && <CheckCircle size={14} />}
                      {step.current && <Clock size={14} />}
                      <span className="text-sm">{step.label}</span>
                    </div>
                    {stepIdx < timeline.length - 1 && (
                      <ChevronRight className={`mx-1 ${step.completed ? 'text-green-400' : 'text-slate-300'}`} size={16} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无采购申请</p>
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新增采购申请">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">选择材料</label>
            <select
              className="input-field"
              value={formData.materialId}
              onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              required
            >
              <option value="">请选择材料</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.code}) - 库存: {m.availableStock}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">采购数量</label>
            <input
              type="number"
              className="input-field"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">申请原因</label>
            <textarea
              className="input-field min-h-24"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="请说明采购原因..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>取消</button>
            <button type="submit" className="btn btn-primary">提交申请</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
