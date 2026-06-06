import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, User, FileText, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import type { AdjustmentRequest, Task } from '../../shared/types.js';
import { taskApi } from '../utils/apiClient.js';

export default function AdjustmentApproval() {
  const [adjustments, setAdjustments] = useState<AdjustmentRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending'>('pending');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const [adjustmentsData, tasksData] = await Promise.all([
        taskApi.getAdjustments(),
        taskApi.getTasks(),
      ]);
      setAdjustments(adjustmentsData as AdjustmentRequest[]);
      setTasks(tasksData as Task[]);
      const mockUsers = [
        { id: 'user1', name: '张三' },
        { id: 'user2', name: '李四' },
        { id: 'user3', name: '王五' },
        { id: 'user4', name: '赵六' },
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const filteredAdjustments = adjustments.filter(adj => {
    if (filter === 'pending') return adj.status === 'pending';
    return true;
  });

  const getTaskName = (taskId: string) => {
    return tasks.find(t => t.id === taskId)?.name || '未知任务';
  };

  const getTaskStatus = (taskId: string) => {
    return tasks.find(t => t.id === taskId)?.status || '';
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || userId;
  };

  const handleApprove = async (id: string) => {
    try {
      await taskApi.approveAdjustment(id);
      setAdjustments(adjustments.map(adj =>
        adj.id === id ? { ...adj, status: 'approved' as const } : adj
      ));
    } catch (error) {
      console.error('批准失败:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await taskApi.rejectAdjustment(id);
      setAdjustments(adjustments.map(adj =>
        adj.id === id ? { ...adj, status: 'rejected' as const } : adj
      ));
    } catch (error) {
      console.error('驳回失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = adjustments.filter(a => a.status === 'pending').length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-display font-bold text-slate-800">调整申请审批</h1>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'pending'
                  ? 'bg-white text-slate-800 shadow'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              待审批
              {pendingCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white text-slate-800 shadow'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              全部
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          {filteredAdjustments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText size={48} className="mb-2" />
              <p>暂无{filter === 'pending' ? '待审批' : ''}调整申请</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAdjustments.map(adj => (
                <div key={adj.id} className="hover:bg-slate-50 transition-colors">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === adj.id ? null : adj.id)}
                  >
                    <button className="p-1 hover:bg-slate-100 rounded">
                      {expandedId === adj.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-slate-800 truncate">
                          {getTaskName(adj.taskId)}
                        </span>
                        <StatusBadge status={getTaskStatus(adj.taskId)} />
                        <StatusBadge status={adj.status} />
                      </div>
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          申请人: {getUserName(adj.requesterId)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(adj.createdAt)}
                        </div>
                      </div>
                    </div>
                    {adj.status === 'pending' && (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApprove(adj.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <CheckCircle size={16} />
                          批准
                        </button>
                        <button
                          onClick={() => handleReject(adj.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <XCircle size={16} />
                          驳回
                        </button>
                      </div>
                    )}
                  </div>
                  {expandedId === adj.id && (
                    <div className="px-16 pb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">调整原因</h4>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{adj.reason}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">建议调整</h4>
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">{adj.suggestedChange || '无'}</p>
                        </div>
                      </div>
                      {adj.approverId && (
                        <div className="mt-3 text-sm text-slate-500">
                          审批人: {getUserName(adj.approverId)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
