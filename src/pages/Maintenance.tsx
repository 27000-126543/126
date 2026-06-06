import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Wrench, AlertTriangle, Clock, Package } from 'lucide-react';
import type { MaintenanceWorkOrder, SparePart, Equipment } from '../../shared/types.js';
import { equipmentApi } from '../utils/apiClient.js';
import StatusBadge from '../components/ui/StatusBadge.js';
import Modal from '../components/ui/Modal.js';

interface PartUsage {
  sparePartId: string;
  quantity: number;
}

export default function Maintenance() {
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceWorkOrder | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [partsUsed, setPartsUsed] = useState<PartUsage[]>([]);
  const [newOrder, setNewOrder] = useState({
    equipmentId: '', type: 'preventive', description: '', scheduledDate: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    const [orders, eq, parts] = await Promise.all([
      equipmentApi.getWorkOrders(statusFilter ? { status: statusFilter } : undefined),
      equipmentApi.getEquipment(),
      equipmentApi.getSpareParts()
    ]);
    setWorkOrders(orders as MaintenanceWorkOrder[]);
    setEquipment(eq as Equipment[]);
    setSpareParts(parts as SparePart[]);
  };

  const getEquipmentName = (id: string) => {
    return equipment.find(e => e.id === id)?.name || '未知设备';
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await equipmentApi.createWorkOrder(newOrder);
      setIsCreateModalOpen(false);
      loadData();
      setNewOrder({ equipmentId: '', type: 'preventive', description: '', scheduledDate: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOrder = (order: MaintenanceWorkOrder) => {
    setSelectedOrder(order);
    setPartsUsed([]);
    setIsCompleteModalOpen(true);
  };

  const addPartUsage = () =>
    setPartsUsed([...partsUsed, { sparePartId: '', quantity: 1 }]);

  const updatePartUsage = (index: number, field: keyof PartUsage, value: string | number) =>
    setPartsUsed(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));

  const removePartUsage = (index: number) =>
    setPartsUsed(prev => prev.filter((_, i) => i !== index));

  const submitCompleteOrder = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const validParts = partsUsed.filter(p => p.sparePartId && p.quantity > 0);
      await equipmentApi.updateWorkOrder(selectedOrder.id, { partsUsed: validParts });
      await equipmentApi.completeWorkOrder(selectedOrder.id);
      setIsCompleteModalOpen(false);
      setSelectedOrder(null);
      loadData();
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preventive': return <Wrench size={16} className="text-blue-600" />;
      case 'corrective': return <AlertTriangle size={16} className="text-orange-600" />;
      case 'emergency': return <AlertTriangle size={16} className="text-red-600" />;
      default: return <Wrench size={16} />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 font-display">维保工单</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增工单
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-48"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="assigned">已分配</option>
          <option value="in_progress">进行中</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">设备</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">类型</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">描述</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">计划日期</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">状态</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((order) => (
              <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-800">{getEquipmentName(order.equipmentId)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(order.type)}
                    <StatusBadge status={order.type} />
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{order.description}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock size={14} />
                    <span>{order.scheduledDate}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  {order.status !== 'completed' && (
                    <button
                      onClick={() => handleCompleteOrder(order)}
                      className="btn btn-primary flex items-center gap-1 py-1 text-sm"
                    >
                      <CheckCircle size={14} />完成工单
                    </button>
                  )}
                  {order.status === 'completed' && order.partsUsed && order.partsUsed.length > 0 && (
                    <div className="flex items-center gap-1 text-slate-500 text-sm">
                      <Package size={14} />
                      <span>使用{order.partsUsed.length}个备件</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="新增维保工单">
        <form onSubmit={handleCreateOrder} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">设备</label>
            <select value={newOrder.equipmentId} onChange={(e) => setNewOrder({ ...newOrder, equipmentId: e.target.value })} className="input-field" required>
              <option value="">请选择设备</option>
              {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">类型</label>
            <select value={newOrder.type} onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value as 'preventive' | 'corrective' | 'emergency' })} className="input-field">
              <option value="preventive">预防性维保</option>
              <option value="corrective">修复性维保</option>
              <option value="emergency">紧急维修</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">描述</label>
            <textarea value={newOrder.description} onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })} className="input-field" rows={2} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">计划日期</label>
            <input type="date" value={newOrder.scheduledDate} onChange={(e) => setNewOrder({ ...newOrder, scheduledDate: e.target.value })} className="input-field" required />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">取消</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '保存中...' : '保存'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="完成工单" size="lg">
        <div className="space-y-3">
          <div className="bg-slate-50 p-3">
            <p className="text-sm text-slate-600">设备: <span className="font-medium">{selectedOrder && getEquipmentName(selectedOrder.equipmentId)}</span></p>
            <p className="text-sm text-slate-600 mt-1">描述: <span className="font-medium">{selectedOrder?.description}</span></p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-700">使用备件</label>
              <button type="button" onClick={addPartUsage} className="btn btn-secondary py-1 text-xs">+ 添加备件</button>
            </div>
            <div className="space-y-2">
              {partsUsed.map((part, index) => (
                <div key={index} className="flex gap-2">
                  <select value={part.sparePartId} onChange={(e) => updatePartUsage(index, 'sparePartId', e.target.value)} className="input-field flex-1">
                    <option value="">选择备件</option>
                    {spareParts.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} (库存: {p.stock})</option>)}
                  </select>
                  <input type="number" min="1" value={part.quantity} onChange={(e) => updatePartUsage(index, 'quantity', parseInt(e.target.value) || 0)} className="input-field w-20" />
                  <button type="button" onClick={() => removePartUsage(index)} className="btn btn-danger py-1">删除</button>
                </div>
              ))}
              {!partsUsed.length && <p className="text-sm text-slate-500 text-center py-3">暂无备件使用</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="btn btn-secondary">取消</button>
            <button type="button" onClick={submitCompleteOrder} className="btn btn-primary" disabled={loading}>{loading ? '处理中...' : '确认完成'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
