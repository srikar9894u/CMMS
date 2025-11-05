import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UIEngineProvider } from './context/UIEngineContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import WorkOrders from './pages/WorkOrders';
import WorkOrderDetail from './pages/WorkOrderDetail';
import PreventiveMaintenance from './pages/PreventiveMaintenance';
import PMCalendar from './pages/PMCalendar';
import Inventory from './pages/Inventory';
import Users from './pages/Users';
import Reports from './pages/Reports';
import LeaveManagement from './pages/LeaveManagement';
import OPCConfiguration from './pages/OPCConfiguration';
import S7Configuration from './pages/S7Configuration';
import RealTimeStatus from './pages/RealTimeStatus';
import SystemHealth from './pages/SystemHealth';
import AdminLogs from './pages/AdminLogs';
import SystemSettings from './pages/SystemSettings';
import DocumentLibrary from './pages/DocumentLibrary';
import TripFeedback from './pages/TripFeedback';
import TagsManagement from './pages/TagsManagement';
import PLCConfiguration from './pages/PLCConfiguration';
import Notifications from './pages/Notifications';

function App() {
  return (
    <AuthProvider>
      <UIEngineProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="assets" element={<Assets />} />
                <Route path="assets/:id" element={<AssetDetail />} />
                <Route path="work-orders" element={<WorkOrders />} />
                <Route path="work-orders/:id" element={<WorkOrderDetail />} />
                <Route path="preventive-maintenance" element={<PreventiveMaintenance />} />
                <Route path="pm-calendar" element={<PMCalendar />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="documents" element={<DocumentLibrary />} />
                <Route path="reports" element={<Reports />} />
                <Route path="users" element={<Users />} />
                <Route path="leave" element={<LeaveManagement />} />
                <Route path="plc-config" element={<PLCConfiguration />} />
                <Route path="opc-config" element={<OPCConfiguration />} />
                <Route path="s7-config" element={<S7Configuration />} />
                <Route path="tags-management" element={<TagsManagement />} />
                <Route path="real-time-status" element={<RealTimeStatus />} />
                <Route path="system-health" element={<SystemHealth />} />
                <Route path="admin-logs" element={<AdminLogs />} />
                <Route path="system-settings" element={<SystemSettings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="trip-feedback" element={<TripFeedback />} />
              </Route>
            </Routes>
          </Router>
        </ThemeProvider>
      </UIEngineProvider>
    </AuthProvider>
  );
}

export default App;
