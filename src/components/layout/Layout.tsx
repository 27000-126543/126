import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.js';
import Header from './Header.js';
import { useAuthStore } from '../../store/appStore.js';
import { Navigate } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': '项目总览',
  '/projects': '项目管理',
  '/scheduling': '智能排程',
  '/tasks': '任务中心',
  '/tasks/board': '任务看板',
  '/tasks/adjustments': '调整申请审批',
  '/materials': '材料库存管理',
  '/materials/purchase': '采购申请',
  '/safety': '安全监测中心',
  '/safety/alarms': '报警历史',
  '/equipment': '设备管理',
  '/equipment/maintenance': '维保工单',
  '/workforce': '人员管理',
  '/statistics': '统计分析',
  '/statistics/report': '报告导出',
  '/floorplan': '施工平面图',
};

export default function Layout() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const currentPath = Object.keys(pageTitles).find(
    (path) => location.pathname.startsWith(path) && path !== '/'
  );
  const title = currentPath ? pageTitles[currentPath] : '系统';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header title={title} />
        <main className="flex-1 p-6 animate-slide-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
