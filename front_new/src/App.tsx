import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatusBar from './components/Monitoring/StatusBar';
import DevicesList from './components/Monitoring/DevicesList';
import AlertsPage from './components/AlertsPage';
import LoginPage from './components/Auth/LoginPage';
import UsersPage from './components/Users/UsersPage';
import { AuthProvider, useAuth } from './lib/useAuth';
import { NotificationProvider } from './components/NotificationProvider';
import AdminPlatformsPage from './components/AdminPlatformsPage';
import PlatformDetailsPage from './components/PlatformDetailsPage';
import DashboardPage from './components/DashboardPage';
import { LogsPage } from './components/LogsPage';
import CommandTemplatesPage from './components/CommandTemplatesPage';
import RolesPage from './components/RolesPage';
import StatusPage from './components/StatusPage';
import DevicesPage from './components/DevicesPage';
import { AuditLogsPage } from './components/AuditLogsPage';
import { CommandLogsPageContent } from './components/CommandLogsPageContent';
import { config } from './config/runtime';

if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
  console.log('API URL:', config.API_URL);
}

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null;
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeAlerts, setActiveAlerts] = React.useState(0);
  const [resolvedAlerts, setResolvedAlerts] = React.useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100 relative">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {isAuthenticated && <Sidebar />}
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<PrivateRoute><DevicesList /></PrivateRoute>} />
            <Route path="/devices" element={<PrivateRoute><DevicesPage /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
            <Route path="/roles" element={<PrivateRoute><RolesPage /></PrivateRoute>} />
            <Route path="/command-templates" element={<PrivateRoute><CommandTemplatesPage /></PrivateRoute>} />
            <Route path="/logs" element={<PrivateRoute><AlertsPage onStatsChange={(a, r) => { setActiveAlerts(a); setResolvedAlerts(r); }} /></PrivateRoute>} />
            <Route path="/command-logs" element={<PrivateRoute><CommandLogsPageContent /></PrivateRoute>} />
            <Route path="/audit-logs" element={<PrivateRoute><AuditLogsPage /></PrivateRoute>} />
            <Route path="/status" element={<PrivateRoute><StatusPage /></PrivateRoute>} />
            <Route path="/admin/platforms" element={<PrivateRoute><AdminPlatformsPage /></PrivateRoute>} />
            <Route path="/admin/platforms/:platformId" element={<PrivateRoute><PlatformDetailsPage /></PrivateRoute>} />
          </Routes>
        </div>
      </div>
      {isAuthenticated && <StatusBar activeAlerts={activeAlerts} resolvedAlerts={resolvedAlerts} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
