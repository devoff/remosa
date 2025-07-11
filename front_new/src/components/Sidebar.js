import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Settings, ChevronRight, ChevronDown, Briefcase, FileText, Home, Zap } from 'lucide-react';
import { useFlowStore } from '../store/flowStore';
import { getCategoryColors } from '../components/NodeTypes';
import { nodeTypes } from '../components/NodeTypes';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/useAuth';
const SidebarSection = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (_jsxs("div", { className: "mb-2", children: [_jsxs("button", { className: "w-full flex items-center justify-between py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors", onClick: () => setIsOpen(!isOpen), children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2", children: icon }), _jsx("span", { className: "font-medium", children: title })] }), _jsx("span", { children: isOpen ? _jsx(ChevronDown, { size: 16 }) : _jsx(ChevronRight, { size: 16 }) })] }), isOpen && children && (_jsx("div", { className: "pl-9 pr-3 py-2 text-sm space-y-1", children: children }))] }));
};
const Sidebar = () => {
    const { flows, currentFlow } = useFlowStore();
    const categoryColors = getCategoryColors();
    const { get } = useApi();
    const [systemStatus, setSystemStatus] = useState(null);
    const { user, isSuperAdmin } = useAuth();
    // --- История алертов ---
    const [alerts, setAlerts] = useState([]);
    const [alertsLoading, setAlertsLoading] = useState(true);
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                setAlertsLoading(true);
                const data = await get('/alerts/');
                setAlerts(Array.isArray(data) ? data : []);
            }
            catch (e) {
                setAlerts([]);
            }
            finally {
                setAlertsLoading(false);
            }
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, [get]);
    // Подсчёт алертов по датам
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const countToday = alerts.filter(a => a.created_at && a.created_at.slice(0, 10) === today).length;
    const countYesterday = alerts.filter(a => a.created_at && a.created_at.slice(0, 10) === yesterday).length;
    const countWeek = alerts.filter(a => a.created_at && new Date(a.created_at) >= weekAgo).length;
    const formatTime = (isoString) => {
        if (!isoString || isoString === "N/A")
            return "N/A";
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        catch (e) {
            console.error("Ошибка форматирования времени в сайдбаре:", e);
            return "N/A";
        }
    };
    useEffect(() => {
        const fetchSystemStatus = async () => {
            try {
                const data = await get('/stats/dashboard');
                setSystemStatus(data);
            }
            catch (error) {
                console.error('Ошибка при получении статуса системы в сайдбаре:', error);
            }
        };
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 60000);
        return () => clearInterval(interval);
    }, [get]);
    // Получаем текущий поток
    const flow = flows.find(f => f.id === currentFlow) || flows[0];
    // Подсчитываем статистику узлов по категориям
    const categoryStats = flow.nodes.reduce((acc, node) => {
        const nodeType = nodeTypes[node.type];
        if (nodeType) {
            const category = nodeType.category;
            acc[category] = (acc[category] || 0) + 1;
        }
        return acc;
    }, {});
    // Для superadmin показываем обновленный sidebar
    if (isSuperAdmin) {
        return (_jsxs("aside", { className: "w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto", children: [_jsxs("div", { className: "p-4 pb-2", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-200 mb-4", children: "\u041F\u0430\u043D\u0435\u043B\u044C \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430" }), _jsxs(Link, { to: "/", className: "flex items-center py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors mb-2", children: [_jsx(Home, { size: 18, className: "text-cyan-400 mr-2" }), _jsx("span", { className: "font-medium", children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430" })] }), _jsxs(SidebarSection, { title: "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435", icon: _jsx(Briefcase, { size: 18, className: "text-orange-400" }), defaultOpen: true, children: [_jsx(Link, { to: "/users", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438 \u0438 \u0440\u043E\u043B\u0438" }), _jsx(Link, { to: "/command-templates", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0428\u0430\u0431\u043B\u043E\u043D\u044B \u043A\u043E\u043C\u0430\u043D\u0434" }), _jsx(Link, { to: "/admin/platforms", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B" }), _jsx(Link, { to: "/devices", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 (\u0430\u0434\u043C\u0438\u043D)" })] }), _jsxs(SidebarSection, { title: "\u041C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433", icon: _jsx(Activity, { size: 18, className: "text-green-400" }), children: [_jsx(Link, { to: "/status", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0421\u0442\u0430\u0442\u0443\u0441 \u0441\u0438\u0441\u0442\u0435\u043C\u044B" }), _jsx(Link, { to: "/exporters", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u044B Prometheus" }), _jsx(Link, { to: "/jobs", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0417\u0430\u0434\u0430\u043D\u0438\u044F (\u0410\u043B\u0435\u0440\u0442\u044B)" }), _jsx(Link, { to: "/devices-prometheus", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 \u0438\u0437 Prometheus" }), _jsx(Link, { to: "/monitoring", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u041C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433 \u0441\u0438\u0441\u0442\u0435\u043C\u044B" })] }), _jsxs(SidebarSection, { title: "\u0416\u0443\u0440\u043D\u0430\u043B\u044B", icon: _jsx(FileText, { size: 18, className: "text-orange-400" }), children: [_jsx(Link, { to: "/audit-logs", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439" }), _jsx(Link, { to: "/logs", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439" }), _jsx(Link, { to: "/command-logs", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u043A\u043E\u043C\u0430\u043D\u0434" })] })] }), _jsx("div", { className: "mt-auto border-t border-gray-700", children: _jsxs("div", { className: "p-4 space-y-2", children: [_jsxs("div", { className: "mb-2", children: [_jsx("div", { className: "text-xs text-gray-400 font-semibold mb-1", children: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0430\u043B\u0435\u0440\u0442\u043E\u0432" }), alertsLoading ? (_jsx("div", { className: "text-xs text-gray-400", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })) : (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: countToday })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0412\u0447\u0435\u0440\u0430" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: countYesterday })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0417\u0430 \u043D\u0435\u0434\u0435\u043B\u044E" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: countWeek })] })] }))] }), _jsxs(Link, { to: "/settings", className: "w-full flex items-center text-gray-300 hover:bg-gray-700 py-2 px-3 rounded-md transition-colors", children: [_jsx(Settings, { size: 18, className: "mr-2" }), _jsx("span", { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] })] }) })] }));
    }
    // Для пользователей платформы — новый лаконичный sidebar
    return (_jsxs("aside", { className: "w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto", children: [_jsxs("div", { className: "p-4 pb-2", children: [_jsxs(Link, { to: "/", className: "flex items-center py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors mb-2", children: [_jsx(Home, { size: 18, className: "text-cyan-400 mr-2" }), _jsx("span", { className: "font-medium", children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430" })] }), _jsxs(Link, { to: "/command-templates", className: "flex items-center py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors mb-2", children: [_jsx(FileText, { size: 18, className: "text-blue-400 mr-2" }), _jsx("span", { className: "font-medium", children: "\u0428\u0430\u0431\u043B\u043E\u043D\u044B \u043A\u043E\u043C\u0430\u043D\u0434" })] }), _jsxs(Link, { to: "/platform-exporters", className: "flex items-center py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors mb-2", children: [_jsx(Zap, { size: 18, className: "text-green-400 mr-2" }), _jsx("span", { className: "font-medium", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u044B" })] }), _jsxs(SidebarSection, { title: "\u0416\u0443\u0440\u043D\u0430\u043B\u044B", icon: _jsx(FileText, { size: 18, className: "text-orange-400" }), children: [_jsx(Link, { to: "/audit-logs", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439" }), _jsx(Link, { to: "/logs", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439" }), _jsx(Link, { to: "/command-logs", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u043A\u043E\u043C\u0430\u043D\u0434" })] })] }), _jsx("div", { className: "mt-auto border-t border-gray-700", children: _jsxs("div", { className: "p-4 space-y-2", children: [_jsxs("div", { className: "mb-2", children: [_jsx("div", { className: "text-xs text-gray-400 font-semibold mb-1", children: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0430\u043B\u0435\u0440\u0442\u043E\u0432" }), alertsLoading ? (_jsx("div", { className: "text-xs text-gray-400", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })) : (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: countToday })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0412\u0447\u0435\u0440\u0430" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: countYesterday })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0417\u0430 \u043D\u0435\u0434\u0435\u043B\u044E" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: countWeek })] })] }))] }), _jsxs(Link, { to: "/settings", className: "w-full flex items-center text-gray-300 hover:bg-gray-700 py-2 px-3 rounded-md transition-colors", children: [_jsx(Settings, { size: 18, className: "mr-2" }), _jsx("span", { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] })] }) })] }));
};
export default Sidebar;
