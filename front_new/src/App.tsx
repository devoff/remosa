import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
// import AlertsPanel from './components/Monitoring/AlertsPanel';
import StatusBar from './components/Monitoring/StatusBar';
import DevicesList from './components/Monitoring/DevicesList';
import { CommandLogsPage } from './components/CommandLogsPage';
import CommandTemplatesPage from './components/CommandTemplatesPage';
import AlertsPage from './components/AlertsPage';
import LoginPage from './components/Auth/LoginPage';
import UsersPage from './components/Users/UsersPage';
import { AuthProvider, useAuth } from './lib/useAuth';

console.log('API URL:', import.meta.env.VITE_API_URL);

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null;
};

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100 relative">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {isAuthenticated && <Sidebar />}
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<PrivateRoute><DevicesList /></PrivateRoute>} />
              <Route path="/command-logs" element={<PrivateRoute><CommandLogsPage /></PrivateRoute>} />
              <Route path="/command-templates" element={<PrivateRoute><CommandTemplatesPage /></PrivateRoute>} />
              <Route path="/alert-logs" element={<PrivateRoute><AlertsPage /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} />
            </Routes>
          </div>
        </div>
        {isAuthenticated && <StatusBar />}
      </div>
    </AuthProvider>
  );
}

export default App;