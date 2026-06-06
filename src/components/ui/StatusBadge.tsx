interface StatusBadgeProps {
  status: string;
  customColors?: Record<string, string>;
}

const defaultColors: Record<string, string> = {
  planning: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-slate-100 text-slate-700',
  not_started: 'bg-slate-100 text-slate-700',
  rework: 'bg-red-100 text-red-700',
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  fault: 'bg-red-100 text-red-700',
  online: 'bg-green-100 text-green-700',
  offline: 'bg-slate-100 text-slate-700',
  normal: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  critical: 'bg-red-100 text-red-700',
  active: 'bg-green-100 text-green-700',
  idle: 'bg-slate-100 text-slate-700',
  dangerous: 'bg-red-100 text-red-700',
  delayed: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  draft: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  ordered: 'bg-purple-100 text-purple-700',
  received: 'bg-green-100 text-green-700',
  on_site: 'bg-blue-100 text-blue-700',
  leave: 'bg-yellow-100 text-yellow-700',
  off_work: 'bg-slate-100 text-slate-700',
  preventive: 'bg-blue-100 text-blue-700',
  corrective: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700',
  assigned: 'bg-blue-100 text-blue-700',
  injury: 'bg-red-100 text-red-700',
  near_miss: 'bg-yellow-100 text-yellow-700',
  property_damage: 'bg-orange-100 text-orange-700',
  environmental: 'bg-purple-100 text-purple-700',
  minor: 'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  major: 'bg-red-100 text-red-700',
  fatal: 'bg-red-900 text-white',
};

const statusLabels: Record<string, string> = {
  planning: '规划中',
  in_progress: '进行中',
  completed: '已完成',
  suspended: '已暂停',
  pending: '待开始',
  not_started: '未开始',
  rework: '返工',
  available: '可用',
  in_use: '使用中',
  maintenance: '维保中',
  fault: '故障',
  online: '在线',
  offline: '离线',
  normal: '正常',
  warning: '预警',
  critical: '报警',
  active: '活跃',
  idle: '闲置',
  dangerous: '危险',
  delayed: '延期',
  approved: '已批准',
  rejected: '已驳回',
  draft: '草稿',
  confirmed: '已确认',
  published: '已发布',
  ordered: '已下单',
  received: '已入库',
  on_site: '在岗',
  leave: '请假',
  off_work: '下班',
  preventive: '预防性',
  corrective: '修复性',
  emergency: '紧急',
  assigned: '已分配',
  injury: '人员受伤',
  near_miss: '未遂事件',
  property_damage: '财产损失',
  environmental: '环境影响',
  minor: '轻微',
  moderate: '一般',
  major: '严重',
  fatal: '致命',
};

export default function StatusBadge({ status, customColors }: StatusBadgeProps) {
  const colors = { ...defaultColors, ...customColors };
  const colorClass = colors[status] || 'bg-slate-100 text-slate-700';
  const label = statusLabels[status] || status;

  return (
    <span className={`status-badge ${colorClass}`}>
      {label}
    </span>
  );
}
