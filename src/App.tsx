import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Scheduling from "@/pages/Scheduling";
import Tasks from "@/pages/Tasks";
import TaskBoard from "@/pages/TaskBoard";
import AdjustmentApproval from "@/pages/AdjustmentApproval";
import Materials from "@/pages/Materials";
import PurchaseRequests from "@/pages/PurchaseRequests";
import SafetyMonitoring from "@/pages/SafetyMonitoring";
import AlarmHistory from "@/pages/AlarmHistory";
import Equipment from "@/pages/Equipment";
import Maintenance from "@/pages/Maintenance";
import Workforce from "@/pages/Workforce";
import Statistics from "@/pages/Statistics";
import ReportExport from "@/pages/ReportExport";
import FloorPlan from "@/pages/FloorPlan";
import { useAuthStore } from "./store/appStore.js";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="scheduling" element={<Scheduling />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/board" element={<TaskBoard />} />
          <Route path="tasks/adjustments" element={<AdjustmentApproval />} />
          <Route path="materials" element={<Materials />} />
          <Route path="materials/purchase" element={<PurchaseRequests />} />
          <Route path="safety" element={<SafetyMonitoring />} />
          <Route path="safety/alarms" element={<AlarmHistory />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="equipment/maintenance" element={<Maintenance />} />
          <Route path="workforce" element={<Workforce />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="statistics/report" element={<ReportExport />} />
          <Route path="floorplan" element={<FloorPlan />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
