import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, CalendarClock, ListTodo,
  Package, ShieldAlert, Wrench, BarChart3, Map, LogOut,
  Users, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/appStore.js';
import type { UserRole } from '@shared/types.js';

const roleNavItems: Record<UserRole, { to: string; label: string; icon: React.ElementType }[]> = {
  project_manager: [
    { to: '/dashboard', label: '项目总览', icon: LayoutDashboard },
    { to: '/projects', label: '项目管理', icon: Building2 },
    { to: '/scheduling', label: '智能排程', icon: CalendarClock },
    { to: '/tasks', label: '任务中心', icon: ListTodo },
    { to: '/tasks/adjustments', label: '调整审批', icon: AlertTriangle },
    { to: '/materials', label: '材料管理', icon: Package },
    { to: '/materials/purchase', label: '采购审批', icon: Package },
    { to: '/safety', label: '安全监测', icon: ShieldAlert },
    { to: '/equipment', label: '设备管理', icon: Wrench },
    { to: '/workforce', label: '人员管理', icon: Users },
    { to: '/statistics', label: '统计分析', icon: BarChart3 },
    { to: '/floorplan', label: '施工平面图', icon: Map },
  ],
  foreman: [
    { to: '/dashboard', label: '项目总览', icon: LayoutDashboard },
    { to: '/tasks/board', label: '任务看板', icon: ListTodo },
    { to: '/safety', label: '安全监测', icon: ShieldAlert },
  ],
  safety_officer: [
    { to: '/dashboard', label: '项目总览', icon: LayoutDashboard },
    { to: '/safety', label: '安全监测', icon: ShieldAlert },
    { to: '/safety/alarms', label: '报警历史', icon: AlertTriangle },
    { to: '/floorplan', label: '施工平面图', icon: Map },
  ],
  equipment_manager: [
    { to: '/dashboard', label: '项目总览', icon: LayoutDashboard },
    { to: '/equipment', label: '设备管理', icon: Wrench },
    { to: '/equipment/maintenance', label: '维保工单', icon: Wrench },
  ],
  material_manager: [
    { to: '/dashboard', label: '项目总览', icon: LayoutDashboard },
    { to: '/materials', label: '材料管理', icon: Package },
    { to: '/materials/purchase', label: '采购申请', icon: Package },
  ],
  executive: [
    { to: '/dashboard', label: '项目总览', icon: LayoutDashboard },
    { to: '/projects', label: '项目管理', icon: Building2 },
    { to: '/statistics', label: '统计分析', icon: BarChart3 },
    { to: '/statistics/report', label: '报告导出', icon: BarChart3 },
    { to: '/safety', label: '安全监测', icon: ShieldAlert },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navItems = user ? roleNavItems[user.role] || [] : [];

  return (
    <aside className="w-64 bg-industrial-bg h-screen flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-industrial-border">
        <h1 className="font-display text-2xl font-bold text-white tracking-wider">
          智慧工地
        </h1>
        <p className="text-industrial-muted text-sm mt-1">工程项目管理系统</p>
      </div>

      {user && (
        <div className="p-4 border-b border-industrial-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-white font-medium">{user.name}</p>
              <p className="text-industrial-muted text-xs">
                {{
                  project_manager: '项目经理',
                  foreman: '施工班组长',
                  safety_officer: '安全员',
                  equipment_manager: '设备管理员',
                  material_manager: '材料管理员',
                  executive: '企业管理层',
                }[user.role]}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item animate-slide-in ${isActive ? 'nav-item-active' : ''}`
            }
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-industrial-border">
        <button
          onClick={logout}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/30"
        >
          <LogOut size={20} />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
