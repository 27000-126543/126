import { Bell, Settings, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '../../store/appStore.js';
import { useWebSocket } from '../../hooks/useWebSocket.js';

export default function Header({ title }: { title: string }) {
  const { notifications, alarms, clearNotifications } = useAppStore();
  const { isConnected } = useWebSocket();
  const unacknowledgedAlarms = alarms.filter(a => !a.acknowledged).length;

  return (
    <header className="h-16 bg-white border-b-2 border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          {isConnected ? (
            <span className="flex items-center gap-1 text-safety-success">
              <Wifi size={16} />
              实时连接
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-500">
              <WifiOff size={16} />
              连接断开
            </span>
          )}
        </div>

        <div className="relative">
          <button className="p-2 hover:bg-slate-100 relative">
            <Bell size={20} className="text-slate-600" />
            {(notifications.length > 0 || unacknowledgedAlarms > 0) && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length + unacknowledgedAlarms}
              </span>
            )}
          </button>

          {notifications.length > 0 && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-slate-200 shadow-lg max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                <span className="font-medium">通知</span>
                <button
                  onClick={clearNotifications}
                  className="text-xs text-primary-600 hover:underline"
                >
                  清空
                </button>
              </div>
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className="p-3 border-b border-slate-100 hover:bg-slate-50 text-sm"
                >
                  {notification}
                </div>
              ))}
            </div>
          )}
        </div>

        {unacknowledgedAlarms > 0 && (
          <div className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium animate-pulse-fast">
            {unacknowledgedAlarms} 条未处理报警
          </div>
        )}

        <button className="p-2 hover:bg-slate-100">
          <Settings size={20} className="text-slate-600" />
        </button>
      </div>
    </header>
  );
}
