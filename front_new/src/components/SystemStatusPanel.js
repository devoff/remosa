import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useApi } from '../lib/useApi';
import { SyncOutlined } from '@ant-design/icons';
import { message } from 'antd';
const SystemStatusPanel = () => {
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
        return (_jsxs("div", { className: "p-4 text-gray-300 flex items-center", children: [_jsx(SyncOutlined, { spin: true, className: "mr-2" }), " \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0442\u0430\u0442\u0443\u0441\u0430..."] }));
    }
    return (_jsxs("div", { className: "p-4 space-y-2 text-gray-300 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "Uptime:" }), _jsx("span", { className: "font-medium", children: status.uptime })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430:" }), _jsx("span", { className: "font-medium", children: status.totalDevices })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0430\u043B\u0435\u0440\u0442\u044B:" }), _jsx("span", { className: "font-medium text-red-400", children: status.activeAlerts })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0420\u0435\u0448\u0435\u043D\u043D\u044B\u0435:" }), _jsx("span", { className: "font-medium text-green-400", children: status.resolvedAlerts })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u0411\u0414:" }), _jsxs("span", { className: "font-medium", children: [status.dbConnections, " \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0439"] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "API:" }), _jsx("span", { className: "font-medium", children: status.apiStatus })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "Telegram:" }), _jsx("span", { className: "font-medium", children: status.telegramStatus })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0430\u043B\u0435\u0440\u0442:" }), _jsx("span", { className: "font-medium", children: formatTime(status.latestAlert) })] })] }));
};
export default SystemStatusPanel;
