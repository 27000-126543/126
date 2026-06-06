import { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, Clock, User, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { SafetyAlarm } from '../../shared/types';
import { safetyApi } from '../utils/apiClient';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import StatCard from '../components/ui/StatCard';

export default function AlarmHistory() {
  const [alarms, setAlarms] = useState<SafetyAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterAck, setFilterAck] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<SafetyAlarm | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await safetyApi.getAlarms() as SafetyAlarm[];
      setAlarms(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    await safetyApi.acknowledgeAlarm(id);
    fetchData();
  };

  const handleViewDetail = (alarm: SafetyAlarm) => {
    setSelectedAlarm(alarm);
    setShowDetailModal(true);
  };

  const typeLabels: Record<string, string> = {
    noise: '噪音超标',
    dust: '粉尘超标',
    tower_crane: '塔吊倾斜',
    temperature: '温度异常',
    humidity: '湿度异常',
  };

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'noise', label: '噪音超标' },
    { value: 'dust', label: '粉尘超标' },
    { value: 'tower_crane', label: '塔吊倾斜' },
    { value: 'temperature', label: '温度异常' },
    { value: 'humidity', label: '湿度异常' },
  ];

  const levelOptions = [
    { value: 'all', label: '全部级别' },
    { value: 'warning', label: '预警' },
    { value: 'critical', label: '报警' },
  ];

  const ackOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'acknowledged', label: '已确认' },
    { value: 'unacknowledged', label: '未确认' },
  ];

  const filteredAlarms = alarms.filter(alarm => {
    const matchSearch = typeLabels[alarm.type]?.includes(searchTerm) ||
      alarm.message.includes(searchTerm) ||
      (alarm.acknowledgedBy && alarm.acknowledgedBy.includes(searchTerm));
    const matchType = filterType === 'all' || alarm.type === filterType;
    const matchLevel = filterLevel === 'all' || alarm.level === filterLevel;
    const matchAck = filterAck === 'all' ||
      (filterAck === 'acknowledged' && alarm.acknowledged) ||
      (filterAck === 'unacknowledged' && !alarm.acknowledged);
    return matchSearch && matchType && matchLevel && matchAck;
  });

  const stats = {
    total: alarms.length,
    warning: alarms.filter(a => a.level === 'warning').length,
    critical: alarms.filter(a => a.level === 'critical').length,
    unacknowledged: alarms.filter(a => !a.acknowledged).length,
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
          <AlertTriangle /> 报警历史
        </h1>
        <p className="text-slate-500 mt-1">查看和管理所有安全报警记录</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="总报警数"
          value={stats.total}
          icon={<AlertTriangle size={24} />}
          color="blue"
          delay={0}
        />
        <StatCard
          title="预警次数"
          value={stats.warning}
          icon={<AlertTriangle size={24} />}
          color="yellow"
          delay={0.1}
        />
        <StatCard
          title="严重报警"
          value={stats.critical}
          icon={<AlertTriangle size={24} />}
          color="red"
          delay={0.2}
        />
        <StatCard
          title="待确认"
          value={stats.unacknowledged}
          icon={<Clock size={24} />}
          color="orange"
          delay={0.3}
        />
      </div>

      <div className="card p-4 mb-4 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜索报警类型、消息或确认人..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select
            className="input-field w-36"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="input-field w-32"
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            {levelOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            className="input-field w-32"
            value={filterAck}
            onChange={(e) => setFilterAck(e.target.value)}
          >
            {ackOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">报警时间</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">类型</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">级别</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">消息</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">确认状态</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">确认人</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlarms.map((alarm, idx) => (
              <tr
                key={alarm.id}
                className={`border-b border-slate-100 hover:bg-slate-50 ${!alarm.acknowledged ? 'bg-red-50' : ''}`}
                style={{ animationDelay: `${idx * 0.02}s` }}
              >
                <td className="px-4 py-3 text-sm text-slate-600">
                  {new Date(alarm.timestamp).toLocaleString('zh-CN')}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">{typeLabels[alarm.type] || alarm.type}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={alarm.level} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">{alarm.message}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-sm ${alarm.acknowledged ? 'text-green-600' : 'text-red-600'}`}>
                    {alarm.acknowledged ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {alarm.acknowledged ? '已确认' : '未确认'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {alarm.acknowledgedBy ? (
                    <span className="flex items-center gap-1">
                      <User size={14} /> {alarm.acknowledgedBy}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="text-primary-600 hover:text-primary-800 flex items-center gap-1 text-sm"
                      onClick={() => handleViewDetail(alarm)}
                    >
                      <Eye size={14} /> 详情
                    </button>
                    {!alarm.acknowledged && (
                      <button
                        className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
                        onClick={() => handleAcknowledge(alarm.id)}
                      >
                        <CheckCircle size={14} /> 确认
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAlarms.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无符合条件的报警记录</p>
          </div>
        )}
      </div>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="报警详情" size="lg">
        {selectedAlarm && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">报警时间</p>
                <p className="font-medium">{new Date(selectedAlarm.timestamp).toLocaleString('zh-CN')}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">报警类型</p>
                <p className="font-medium">{typeLabels[selectedAlarm.type] || selectedAlarm.type}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">报警级别</p>
                <StatusBadge status={selectedAlarm.level} />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">确认状态</p>
                <span className={`flex items-center gap-1 ${selectedAlarm.acknowledged ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedAlarm.acknowledged ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {selectedAlarm.acknowledged ? '已确认' : '未确认'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200">
              <p className="text-sm text-slate-500 mb-2">报警消息</p>
              <p className="font-medium text-lg">{selectedAlarm.message}</p>
            </div>

            {selectedAlarm.acknowledged && (
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 border border-green-200">
                  <p className="text-sm text-green-600 mb-1">确认人</p>
                  <p className="font-medium flex items-center gap-2">
                    <User size={16} /> {selectedAlarm.acknowledgedBy}
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200">
                  <p className="text-sm text-green-600 mb-1">确认时间</p>
                  <p className="font-medium">
                    {selectedAlarm.acknowledgedAt ? new Date(selectedAlarm.acknowledgedAt).toLocaleString('zh-CN') : '-'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>关闭</button>
              {!selectedAlarm.acknowledged && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleAcknowledge(selectedAlarm.id);
                    setShowDetailModal(false);
                  }}
                >
                  确认报警
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
