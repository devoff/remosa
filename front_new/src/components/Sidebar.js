import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Database, Server, Activity, Clock, Users, Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { useFlowStore } from '../store/flowStore';
import { getCategoryColors } from '../components/NodeTypes';
import { nodeTypes } from '../components/NodeTypes';
import { useApi } from '../lib/useApi';
const SidebarSection = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (_jsxs("div", { className: "mb-2", children: [_jsxs("button", { className: "w-full flex items-center justify-between py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors", onClick: () => setIsOpen(!isOpen), children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2", children: icon }), _jsx("span", { className: "font-medium", children: title })] }), _jsx("span", { children: isOpen ? _jsx(ChevronDown, { size: 16 }) : _jsx(ChevronRight, { size: 16 }) })] }), isOpen && children && (_jsx("div", { className: "pl-9 pr-3 py-2 text-sm space-y-1", children: children }))] }));
};
const Sidebar = () => {
    const { flows, currentFlow } = useFlowStore();
    const categoryColors = getCategoryColors();
    const { get } = useApi();
    const [systemStatus, setSystemStatus] = useState(null);
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
                const data = await get('/api/v1/stats/dashboard');
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
    return (_jsxs("aside", { className: "w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto", children: [_jsxs("div", { className: "p-4 pb-2", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-200 mb-4", children: "\u041F\u0430\u043D\u0435\u043B\u044C \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430" }), _jsx(SidebarSection, { title: "\u0421\u0442\u0430\u0442\u0443\u0441 \u0441\u0438\u0441\u0442\u0435\u043C\u044B", icon: _jsx(Activity, { size: 18, className: "text-green-500" }), defaultOpen: true, children: _jsxs("div", { className: "space-y-2 text-gray-300", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0410\u043A\u0442\u0438\u0432\u043D\u043E:" }), _jsx("span", { className: "font-medium text-green-400", children: "\u0414\u0430" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "Uptime:" }), _jsx("span", { children: systemStatus?.uptime || 'Загрузка...' })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0430\u043B\u0435\u0440\u0442:" }), _jsx("span", { children: formatTime(systemStatus?.latestAlert || null) })] })] }) }), _jsx(SidebarSection, { title: "Telegram", icon: _jsx(MessageSquare, { size: 18, className: "text-blue-500" }), children: _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between", children: [_jsx("span", { children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: "12" })] }), _jsxs("div", { className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between", children: [_jsx("span", { children: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: "47" })] }), _jsxs("div", { className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between", children: [_jsx("span", { children: "\u041A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: "8" })] })] }) }), _jsx(SidebarSection, { title: "\u0411\u0430\u0437\u0430 \u0434\u0430\u043D\u043D\u044B\u0445", icon: _jsx(Database, { size: 18, className: "text-green-500" }), children: _jsxs("div", { className: "space-y-1", children: [_jsx(Link, { to: "/", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430" }), _jsx(Link, { to: "/telegram-users", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438 Telegram" }), _jsx(Link, { to: "/command-templates", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0428\u0430\u0431\u043B\u043E\u043D\u044B \u043A\u043E\u043C\u0430\u043D\u0434" }), _jsx(Link, { to: "/alert-logs", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0430\u043B\u0435\u0440\u0442\u043E\u0432" }), _jsx(Link, { to: "/command-logs", className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u043A\u043E\u043C\u0430\u043D\u0434" })] }) }), _jsx(SidebarSection, { title: "\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B", icon: _jsx(Server, { size: 18, className: "text-purple-500" }), children: _jsx("div", { className: "space-y-1", children: Object.entries(categoryStats).map(([category, count]) => (_jsxs("div", { className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "w-3 h-3 rounded-full mr-2", style: { backgroundColor: categoryColors[category] || '#888' } }), _jsx("span", { children: category })] }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: count })] }, category))) }) }), _jsx(SidebarSection, { title: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0430\u043B\u0435\u0440\u0442\u043E\u0432", icon: _jsx(Clock, { size: 18, className: "text-amber-500" }), children: _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between", children: [_jsx("span", { children: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: "7" })] }), _jsxs("div", { className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between", children: [_jsx("span", { children: "\u0412\u0447\u0435\u0440\u0430" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: "12" })] }), _jsxs("div", { className: "hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between", children: [_jsx("span", { children: "\u0417\u0430 \u043D\u0435\u0434\u0435\u043B\u044E" }), _jsx("span", { className: "bg-gray-600 text-xs px-1.5 rounded-full", children: "43" })] })] }) })] }), _jsx("div", { className: "mt-auto border-t border-gray-700", children: _jsxs("div", { className: "p-4 space-y-2", children: [_jsxs(Link, { to: "/users", className: "w-full flex items-center text-gray-300 hover:bg-gray-700 py-2 px-3 rounded-md transition-colors", children: [_jsx(Users, { size: 18, className: "mr-2" }), _jsx("span", { children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438" })] }), _jsxs(Link, { to: "/settings", className: "w-full flex items-center text-gray-300 hover:bg-gray-700 py-2 px-3 rounded-md transition-colors", children: [_jsx(Settings, { size: 18, className: "mr-2" }), _jsx("span", { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] })] }) })] }));
};
export default Sidebar;
