import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import CommandTemplatesPage from './components/CommandTemplatesPage';
import RolesPage from './components/RolesPage';
import StatusPage from './components/StatusPage';
import DevicesPage from './components/DevicesPage';
import { AuditLogsPage } from './components/AuditLogsPage';
import { CommandLogsPageContent } from './components/CommandLogsPageContent';
import ExportersPage from './components/ExportersPage';
import PlatformExportersPage from './components/PlatformExportersPage';
import JobsPage from './components/JobsPage';
import DevicesPrometheusPage from './components/DevicesPrometheusPage';
import MonitoringPage from './pages/MonitoringPage';
import { config } from './config/runtime';
if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
    console.log('API URL:', config.API_URL);
}
const PrivateRoute = ({ children }) => {
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
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-gray-900 text-gray-100 relative", children: [_jsx(Header, {}), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [isAuthenticated && _jsx(Sidebar, {}), _jsx("div", { className: "flex-1 flex flex-col", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/", element: _jsx(PrivateRoute, { children: _jsx(DevicesList, {}) }) }), _jsx(Route, { path: "/devices", element: _jsx(PrivateRoute, { children: _jsx(DevicesPage, {}) }) }), _jsx(Route, { path: "/users", element: _jsx(PrivateRoute, { children: _jsx(UsersPage, {}) }) }), _jsx(Route, { path: "/roles", element: _jsx(PrivateRoute, { children: _jsx(RolesPage, {}) }) }), _jsx(Route, { path: "/command-templates", element: _jsx(PrivateRoute, { children: _jsx(CommandTemplatesPage, {}) }) }), _jsx(Route, { path: "/logs", element: _jsx(PrivateRoute, { children: _jsx(AlertsPage, { onStatsChange: (a, r) => { setActiveAlerts(a); setResolvedAlerts(r); } }) }) }), _jsx(Route, { path: "/command-logs", element: _jsx(PrivateRoute, { children: _jsx(CommandLogsPageContent, {}) }) }), _jsx(Route, { path: "/audit-logs", element: _jsx(PrivateRoute, { children: _jsx(AuditLogsPage, {}) }) }), _jsx(Route, { path: "/status", element: _jsx(PrivateRoute, { children: _jsx(StatusPage, {}) }) }), _jsx(Route, { path: "/admin/platforms", element: _jsx(PrivateRoute, { children: _jsx(AdminPlatformsPage, {}) }) }), _jsx(Route, { path: "/admin/platforms/:platformId", element: _jsx(PrivateRoute, { children: _jsx(PlatformDetailsPage, {}) }) }), _jsx(Route, { path: "/exporters", element: _jsx(PrivateRoute, { children: _jsx(ExportersPage, {}) }) }), _jsx(Route, { path: "/platform-exporters", element: _jsx(PrivateRoute, { children: _jsx(PlatformExportersPage, {}) }) }), _jsx(Route, { path: "/jobs", element: _jsx(PrivateRoute, { children: _jsx(JobsPage, {}) }) }), _jsx(Route, { path: "/devices-prometheus", element: _jsx(PrivateRoute, { children: _jsx(DevicesPrometheusPage, {}) }) }), _jsx(Route, { path: "/monitoring", element: _jsx(PrivateRoute, { children: _jsx(MonitoringPage, {}) }) })] }) })] }), isAuthenticated && _jsx(StatusBar, { activeAlerts: activeAlerts, resolvedAlerts: resolvedAlerts })] }));
}
function App() {
    return (_jsx(AuthProvider, { children: _jsx(NotificationProvider, { children: _jsx(AppContent, {}) }) }));
}
export default App;
