import { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, AlertTriangle, History, X } from 'lucide-react';
import type { Material, MaterialConsumption } from '../../shared/types';
import { materialApi } from '../utils/apiClient';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [alerts, setAlerts] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [consumptions, setConsumptions] = useState<MaterialConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: '', name: '', unit: '', totalStock: 0, safetyStock: 0, unitPrice: 0, supplier: ''
  });
  const [consumptionData, setConsumptionData] = useState({ taskId: '', quantity: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsData, alertsData] = await Promise.all([
        materialApi.getMaterials() as Promise<Material[]>,
        materialApi.getAlerts() as Promise<Material[]>
      ]);
      setMaterials(materialsData);
      setAlerts(alertsData);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m =>
    m.name.includes(searchTerm) || m.code.includes(searchTerm)
  );

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    await materialApi.createMaterial(formData);
    setShowAddModal(false);
    setFormData({ code: '', name: '', unit: '', totalStock: 0, safetyStock: 0, unitPrice: 0, supplier: '' });
    fetchData();
  };

  const handleViewConsumptions = async (material: Material) => {
    setSelectedMaterial(material);
    const data = await materialApi.getConsumptions(material.id) as MaterialConsumption[];
    setConsumptions(data);
    setShowConsumptionModal(true);
  };

  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    await materialApi.consumeMaterial({
      materialId: selectedMaterial.id,
      ...consumptionData
    });
    setShowConsumptionModal(false);
    setConsumptionData({ taskId: '', quantity: 0 });
    fetchData();
  };

  const getStockPercentage = (m: Material) => {
    const max = Math.max(m.totalStock, m.safetyStock * 2);
    return Math.min(100, (m.availableStock / max) * 100);
  };

  const isLowStock = (m: Material) => m.availableStock < m.safetyStock;

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <Package /> 材料库存管理
          </h1>
          <p className="text-slate-500 mt-1">管理工地材料库存及消耗记录</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> 新增材料
        </button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="card p-4 mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="搜索材料名称或编号..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-secondary flex items-center gap-2">
              <Filter size={18} /> 筛选
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">编号</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">名称</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">单位</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">总库存</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">可用库存</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">安全库存</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">单价</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((m, idx) => (
                  <tr key={m.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isLowStock(m) ? 'bg-red-50' : ''}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                    <td className="px-4 py-3 font-mono text-sm">{m.code}</td>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-slate-600">{m.unit}</td>
                    <td className="px-4 py-3">{m.totalStock}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${isLowStock(m) ? 'text-red-600' : ''}`}>{m.availableStock}</span>
                        <div className="w-24 h-2 bg-slate-200">
                          <div
                            className={`h-full ${isLowStock(m) ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${getStockPercentage(m)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.safetyStock}</td>
                    <td className="px-4 py-3">¥{m.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        className="text-primary-600 hover:text-primary-800 flex items-center gap-1 text-sm"
                        onClick={() => handleViewConsumptions(m)}
                      >
                        <History size={14} /> 记录
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-80">
          <div className="card p-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={18} /> 库存预警
              <span className="ml-auto bg-red-100 text-red-600 px-2 py-0.5 text-xs font-medium">{alerts.length}</span>
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
              {alerts.map((m) => (
                <div key={m.id} className="p-3 bg-red-50 border border-red-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-red-800">{m.name}</p>
                      <p className="text-sm text-red-600">库存: {m.availableStock} / 安全: {m.safetyStock}</p>
                    </div>
                    <StatusBadge status="critical" />
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-center text-slate-400 py-8">暂无预警</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="新增材料">
        <form onSubmit={handleAddMaterial} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">材料编号</label>
              <input type="text" className="input-field" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">材料名称</label>
              <input type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">单位</label>
              <input type="text" className="input-field" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">供应商</label>
              <input type="text" className="input-field" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">总库存</label>
              <input type="number" className="input-field" value={formData.totalStock} onChange={(e) => setFormData({ ...formData, totalStock: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">安全库存</label>
              <input type="number" className="input-field" value={formData.safetyStock} onChange={(e) => setFormData({ ...formData, safetyStock: Number(e.target.value) })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">单价 (¥)</label>
              <input type="number" step="0.01" className="input-field" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>取消</button>
            <button type="submit" className="btn btn-primary">确认添加</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showConsumptionModal} onClose={() => setShowConsumptionModal(false)} title={`消耗记录 - ${selectedMaterial?.name}`} size="lg">
        <div className="mb-6">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Plus size={16} /> 新增消耗记录
          </h4>
          <form onSubmit={handleConsume} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">任务编号</label>
              <input type="text" className="input-field" value={consumptionData.taskId} onChange={(e) => setConsumptionData({ ...consumptionData, taskId: e.target.value })} required />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">数量</label>
              <input type="number" className="input-field" value={consumptionData.quantity} onChange={(e) => setConsumptionData({ ...consumptionData, quantity: Number(e.target.value) })} required />
            </div>
            <button type="submit" className="btn btn-primary">提交</button>
          </form>
        </div>

        <div>
          <h4 className="font-medium mb-3">历史记录</h4>
          <div className="border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">任务编号</th>
                  <th className="px-3 py-2 text-left">数量</th>
                  <th className="px-3 py-2 text-left">记录人</th>
                  <th className="px-3 py-2 text-left">时间</th>
                </tr>
              </thead>
              <tbody>
                {consumptions.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono">{c.taskId}</td>
                    <td className="px-3 py-2">{c.quantity}</td>
                    <td className="px-3 py-2">{c.recordedBy}</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(c.recordedAt).toLocaleString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
