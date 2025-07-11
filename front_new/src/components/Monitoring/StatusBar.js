import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Activity, Server, Clock, Database, AlertCircle, Check, RefreshCcw } from 'lucide-react';
import { useApi } from '../../lib/useApi';
import { message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
const StatusBar = () => {
    const [status, setStatus] = useState(null);
    const { get } = useApi();
    const fetchSystemStatus = async () => {
        try {
            const data = await get('/api/v1/stats/dashboard');
            setStatus(data);
        }
        catch (error) {
            console.error('Ошибка при получении статуса системы:', error);
            message.error('Не удалось загрузить статус системы.');
        }
    };
    const formatTime = (isoString) => {
        if (!isoString || isoString === "N/A")
            return "N/A";
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        catch (e) {
            console.error("Ошибка форматирования времени:", e);
            return "N/A";
        }
    };
    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 60000); // Обновляем каждые 60 секунд
        return () => clearInterval(interval);
    }, []);
    if (!status) {
        return (_jsxs("div", { className: "bg-gray-850 border-t border-gray-700 py-1 px-4 text-gray-300 flex items-center justify-center", children: [_jsx(SyncOutlined, { spin: true, className: "mr-2" }), " \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0442\u0430\u0442\u0443\u0441\u0430..."] }));
    }
    return (_jsx("div", { className: "bg-gray-850 border-t border-gray-700 py-1 px-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4 text-xs text-gray-400", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { size: 14, className: "mr-1.5" }), _jsxs("span", { children: ["Uptime: ", status.uptime] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Server, { size: 14, className: "mr-1.5" }), _jsxs("span", { children: ["\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430: ", status.totalDevices] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(AlertCircle, { size: 14, className: "mr-1.5 text-red-500" }), _jsxs("span", { children: ["\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0430\u043B\u0435\u0440\u0442\u044B: ", status.activeAlerts] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Check, { size: 14, className: "mr-1.5 text-green-500" }), _jsxs("span", { children: ["\u0420\u0435\u0448\u0435\u043D\u043D\u044B\u0435: ", status.resolvedAlerts] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Database, { size: 14, className: "mr-1.5" }), _jsxs("span", { children: ["\u0411\u0414: ", status.dbConnections, " \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0439"] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { size: 14, className: "mr-1.5" }), _jsxs("span", { children: ["\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0430\u043B\u0435\u0440\u0442: ", formatTime(status.latestAlert)] })] })] }), _jsxs("div", { className: "flex items-center space-x-3 text-xs", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2", children: "API:" }), _jsxs("span", { className: `inline-flex items-center ${status.apiStatus === 'Онлайн' ? 'text-green-500' : 'text-red-500'}`, children: [_jsx(Activity, { size: 14, className: "mr-1" }), status.apiStatus === 'Онлайн' ? 'Онлайн' : 'Ошибка'] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2", children: "Telegram:" }), _jsxs("span", { className: `inline-flex items-center ${status.telegramStatus === 'Подключен' ? 'text-green-500' : 'text-red-500'}`, children: [_jsx(Activity, { size: 14, className: "mr-1" }), status.telegramStatus === 'Подключен' ? 'Подключен' : 'Ошибка'] })] }), _jsx("button", { className: "p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors", onClick: fetchSystemStatus, children: _jsx(RefreshCcw, { size: 12 }) })] })] }) }));
};
export default StatusBar;
