import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
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
console.log('API URL:', import.meta.env.VITE_API_URL);
function App() {
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-gray-900 text-gray-100 relative", children: [_jsx(Header, {}), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, {}), _jsx("div", { className: "flex-1 flex flex-col", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/", element: _jsx(DevicesList, {}) }), _jsx(Route, { path: "/command-logs", element: _jsx(CommandLogsPage, {}) }), _jsx(Route, { path: "/command-templates", element: _jsx(CommandTemplatesPage, {}) }), _jsx(Route, { path: "/alert-logs", element: _jsx(AlertsPage, {}) }), _jsx(Route, { path: "/users", element: _jsx(UsersPage, {}) })] }) })] }), _jsx(StatusBar, {})] }));
}
export default App;
