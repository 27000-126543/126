import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Volume2, Wind, Thermometer, Droplets, Activity, AlertTriangle, LogOut, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Sensor, SensorReading, SafetyAlarm, WebSocketMessage } from '../../shared/types.js';
import { safetyApi } from '../utils/apiClient.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { useAppStore } from '../store/appStore.js';
import AlarmModal from '../components/ui/AlarmModal.js';
import Modal from '../components/ui/Modal.js';
import StatusBadge from '../components/ui/StatusBadge.js';

interface GaugeChartProps {
  value: number;
  max: number;
  threshold: { warning: number; critical: number };
  label: string;
  unit: string;
  color: string;
}

function GaugeChart({ value, max, threshold, label, unit, color }: GaugeChartProps) {
  const percentage = Math.min(100, (value / max) * 100);
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference * 0.75;

  const getStatusColor = () => {
    if (value >= threshold.critical) return '#DC2626';
    if (value >= threshold.warning) return '#EAB308';
    return color;
  };

  const statusColor = getStatusColor();

  return (
    <div className="gauge flex flex-col items-center">
      <svg width="160" height="120" viewBox="0 0 160 120">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference * 0.75}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(135 80 80)"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={statusColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference * 0.75}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(135 80 80)"
          className="transition-all duration-500"
        />
        <text x="80" y="75" textAnchor="middle" className="text-2xl font-bold" fill={statusColor}>
          {value.toFixed(1)}
        </text>
        <text x="80" y="95" textAnchor="middle" className="text-xs" fill="#64748B">
          {unit}
        </text>
      </svg>
      <p className="text-sm font-medium text-slate-700 mt-2">{label}</p>
      <p className="text-xs text-slate-400">阈值: {threshold.warning}/{threshold.critical}</p>
    </div>
  );
}

const sensorConfig: Record<string, { label: string; unit: string; max: number; color: string; icon: typeof Volume2 }> = {
  noise: { label: '噪音', unit: 'dB', max: 120, color: '#3B82F6', icon: Volume2 },
  dust: { label: '粉尘', unit: 'μg/m³', max: 500, color: '#8B5CF6', icon: Wind },
  tower_crane: { label: '塔吊倾斜', unit: '°', max: 10, color: '#F59E0B', icon: Activity },
  temperature: { label: '温度', unit: '°C', max: 60, color: '#EF4444', icon: Thermometer },
  humidity: { label: '湿度', unit: '%', max: 100, color: '#06B6D4', icon: Droplets },
};

export default function SafetyMonitoring() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [readings, setReadings] = useState<Record<string, number>>({});
  const [historyData, setHistoryData] = useState<Record<string, { time: string; value: number }[]>>({});
  const [showEvacuationModal, setShowEvacuationModal] = useState(false);
  const [evacuationForm, setEvacuationForm] = useState({ area: '', reason: '' });
  const [activeAlarm, setActiveAlarm] = useState<SafetyAlarm | null>(null);
  const [loading, setLoading] = useState(true);
  const { isConnected } = useWebSocket();
  const { alarms, handleWebSocketMessage } = useAppStore();

  const loadSensorData = useCallback(async () => {
    const sensorsData = await safetyApi.getSensors() as Sensor[];
    setSensors(sensorsData);

    const initialReadings: Record<string, number> = {};
    const initialHistory: Record<string, { time: string; value: number }[]> = {};

    for (const sensor of sensorsData) {
      try {
        const data = await safetyApi.getSensorReadings(sensor.id) as SensorReading[];
        if (data.length > 0) {
          initialReadings[sensor.id] = data[data.length - 1].value;
          initialHistory[sensor.type] = data.slice(-20).map(r => ({
            time: new Date(r.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            value: r.value
          }));
        }
      } catch (e) {
        initialReadings[sensor.id] = 0;
      }
    }

    setReadings(initialReadings);
    setHistoryData(initialHistory);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSensorData();
    const interval = setInterval(loadSensorData, 5000);
    return () => clearInterval(interval);
  }, [loadSensorData]);

  useEffect(() => {
    const wsHandler = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);

        if (message.type === 'sensor_reading') {
          const reading = message.data as SensorReading;
          setReadings(prev => ({ ...prev, [reading.sensorId]: reading.value }));
          const sensor = sensors.find(s => s.id === reading.sensorId);
          if (sensor) {
            setHistoryData(prev => {
              const typeData = prev[sensor.type] || [];
              const newPoint = {
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                value: reading.value
              };
              return { ...prev, [sensor.type]: [...typeData.slice(-19), newPoint] };
            });
          }
        }

        if (message.type === 'alarm') {
          setActiveAlarm(message.data as SafetyAlarm);
        }
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    };

    return () => {};
  }, [sensors, handleWebSocketMessage]);

  const handleIssueEvacuation = async (e: React.FormEvent) => {
    e.preventDefault();
    await safetyApi.issueEvacuation(evacuationForm);
    setShowEvacuationModal(false);
    setEvacuationForm({ area: '', reason: '' });
  };

  const handleAcknowledgeAlarm = async () => {
    if (activeAlarm) {
      await safetyApi.acknowledgeAlarm(activeAlarm.id);
      setActiveAlarm(null);
    }
  };

  const getLatestUnacknowledgedAlarm = () => {
    return alarms.find(a => !a.acknowledged) || null;
  };

  useEffect(() => {
    const unack = getLatestUnacknowledgedAlarm();
    if (unack && !activeAlarm) {
      setActiveAlarm(unack);
    }
  }, [alarms]);

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  const sensorTypes = ['noise', 'dust', 'tower_crane', 'temperature', 'humidity'] as const;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-display flex items-center gap-2">
            <ShieldAlert /> 安全监测中心
            <span className={`ml-3 flex items-center gap-1 text-sm font-normal ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              {isConnected ? '实时连接' : '连接断开'}
            </span>
          </h1>
          <p className="text-slate-500 mt-1">实时监测工地环境安全参数</p>
        </div>
        <button
          className="btn btn-danger flex items-center gap-2 text-lg px-6 py-3 animate-pulse"
          onClick={() => setShowEvacuationModal(true)}
        >
          <LogOut size={20} /> 发布疏散指令
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        {sensorTypes.map((type) => {
          const config = sensorConfig[type];
          const sensor = sensors.find(s => s.type === type);
          const value = sensor ? readings[sensor.id] || 0 : 0;
          const Icon = config.icon;

          return (
            <div key={type} className="card p-4 flex flex-col items-center animate-slide-up">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} style={{ color: config.color }} />
                <span className="text-sm font-medium text-slate-600">{config.label}</span>
              </div>
              {sensor && (
                <GaugeChart
                  value={value}
                  max={config.max}
                  threshold={sensor.threshold}
                  label={config.label}
                  unit={config.unit}
                  color={config.color}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {sensorTypes.slice(0, 4).map((type) => {
          const config = sensorConfig[type];
          const data = historyData[type] || [];

          return (
            <div key={type} className="card p-4 animate-slide-up">
              <h3 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                <config.icon size={16} style={{ color: config.color }} />
                {config.label} 历史趋势
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                    <Tooltip
                      contentStyle={{ border: '1px solid #E2E8F0', borderRadius: 0 }}
                      labelStyle={{ color: '#334155' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={config.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-4">
        <h3 className="font-medium text-slate-700 mb-4 flex items-center gap-2">
          <Activity size={18} /> 传感器状态
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {sensors.map((sensor) => (
            <div key={sensor.id} className="p-3 bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-slate-500">{sensor.code}</span>
                <StatusBadge status={sensor.status} />
              </div>
              <p className="font-medium text-sm">{sensorConfig[sensor.type]?.label}</p>
              <p className="text-xs text-slate-500">{sensor.location}</p>
              <p className="text-lg font-bold mt-1" style={{ color: sensorConfig[sensor.type]?.color }}>
                {readings[sensor.id]?.toFixed(1) || '0'} <span className="text-xs font-normal text-slate-500">{sensorConfig[sensor.type]?.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <AlarmModal
        alarm={activeAlarm}
        onClose={() => setActiveAlarm(null)}
        onAcknowledge={handleAcknowledgeAlarm}
      />

      <Modal isOpen={showEvacuationModal} onClose={() => setShowEvacuationModal(false)} title="发布疏散指令" size="md">
        <div className="mb-4 p-4 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <p className="font-semibold text-red-800">紧急疏散指令</p>
              <p className="text-sm text-red-600">此指令将通知所有相关人员立即撤离危险区域，请谨慎操作。</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleIssueEvacuation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">疏散区域</label>
            <input
              type="text"
              className="input-field"
              value={evacuationForm.area}
              onChange={(e) => setEvacuationForm({ ...evacuationForm, area: e.target.value })}
              placeholder="例如：A区施工现场"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">疏散原因</label>
            <textarea
              className="input-field min-h-24"
              value={evacuationForm.reason}
              onChange={(e) => setEvacuationForm({ ...evacuationForm, reason: e.target.value })}
              placeholder="请说明疏散原因..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setShowEvacuationModal(false)}>取消</button>
            <button type="submit" className="btn btn-danger">确认发布疏散指令</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
