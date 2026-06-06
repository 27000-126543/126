import { AlertTriangle, X, Volume2 } from 'lucide-react';
import type { SafetyAlarm } from '../../../shared/types.js';
import StatusBadge from './StatusBadge.js';

interface AlarmModalProps {
  alarm: SafetyAlarm | null;
  onClose: () => void;
  onAcknowledge: () => void;
}

export default function AlarmModal({ alarm, onClose, onAcknowledge }: AlarmModalProps) {
  if (!alarm) return null;

  const typeLabels: Record<string, string> = {
    noise: '噪音超标',
    dust: '粉尘超标',
    tower_crane: '塔吊倾斜',
    temperature: '温度异常',
    humidity: '湿度异常',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-pulse-fast">
      <div className="bg-white border-4 border-red-500 w-full max-w-lg glow-danger animate-slide-up">
        <div className="bg-red-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <AlertTriangle size={28} className="animate-bounce" />
            <div>
              <h3 className="font-display text-xl font-bold">安全警报</h3>
              <p className="text-red-100 text-sm">{typeLabels[alarm.type] || alarm.type}</p>
            </div>
          </div>
          <Volume2 size={24} className="text-white animate-pulse" />
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <StatusBadge status={alarm.level} />
              <span className="text-sm text-slate-500">
                {new Date(alarm.timestamp).toLocaleString('zh-CN')}
              </span>
            </div>
            <p className="text-slate-700 font-medium">{alarm.message}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onAcknowledge}
              className="btn btn-primary flex-1"
            >
              确认收到并处理
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              <X size={18} className="inline mr-1" />
              稍后处理
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
