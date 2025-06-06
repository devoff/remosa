import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
// import AlertsPanel from './components/Monitoring/AlertsPanel';
import StatusBar from './components/Monitoring/StatusBar';
import DevicesList from './components/Monitoring/DevicesList';
import { CommandLogsPage } from './components/CommandLogsPage';
import CommandTemplatesPage from './components/CommandTemplatesPage';
import AlertsPage from './components/AlertsPage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import UsersPage from './components/Users/UsersPage';
import { isAuthenticated, hasRole, getUserRole } from './utils/auth';

console.log('API URL:', import.meta.env.VITE_API_URL);

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const auth = isAuthenticated();
  const userRole = getUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth) {
      navigate('/login', { replace: true });
    } else if (allowedRoles && userRole && !hasRole(allowedRoles)) {
      navigate('/', { replace: true });
    }
  }, [auth, userRole, allowedRoles, navigate]);

  if (!auth) {
    return null;
  }

  if (allowedRoles && userRole && !hasRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
};

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100 relative">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><DevicesList /></ProtectedRoute>} />
            <Route path="/command-logs" element={<ProtectedRoute><CommandLogsPage /></ProtectedRoute>} />
            <Route path="/command-templates" element={<ProtectedRoute allowedRoles={["admin", "superuser"]}><CommandTemplatesPage /></ProtectedRoute>} />
            <Route path="/alert-logs" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={["admin", "superuser"]}><UsersPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
      <StatusBar />
    </div>
  );
}

export default App;