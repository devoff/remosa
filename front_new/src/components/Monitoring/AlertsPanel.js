import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Spin, Alert as AntdAlert, Typography } from 'antd';
const { Title } = Typography;
console.log('AlertsPanel: Компонент загружен');
const AlertItem = ({ alert, onResolve, setParentError }) => {
    const [expanded, setExpanded] = useState(false);
    const handleResolve = async () => {
        try {
            await api.resolveAlert(Number(alert.id));
            onResolve(); // Обновляем список алертов
            setParentError(null); // Очищаем ошибку
        }
        catch (error) {
            console.error("Ошибка при разрешении алерта:", error);
            setParentError("Не удалось разрешить алерт.");
        }
    };
    return (_jsxs("div", { className: "border border-gray-700 rounded-lg mb-2 overflow-hidden bg-gray-800", children: [_jsxs("div", { className: "p-3 flex items-center justify-between cursor-pointer hover:bg-gray-750", onClick: () => setExpanded(!expanded), children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: `w-2 h-2 rounded-full mr-3 ${alert.status === 'firing' ? 'bg-red-500' : 'bg-green-500'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-medium dark:text-gray-100", children: alert.title }), _jsxs("p", { className: "text-xs dark:text-gray-300", children: [format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm:ss'), " \u2022 ", alert.player_name] })] })] }), _jsx("div", { className: `text-xs px-2 py-1 rounded-full ${alert.status === 'firing' ? 'bg-red-900/40 text-red-500' : 'bg-green-900/40 text-green-500'}`, children: alert.status === 'firing' ? 'Активен' : 'Решен' })] }), expanded && (_jsxs("div", { className: "p-3 border-t border-gray-700 bg-gray-750", children: [_jsx("p", { className: "text-sm dark:text-gray-300", children: alert.description }), _jsxs("div", { className: "mt-3 text-xs dark:text-gray-500", children: ["ID: ", alert.id, " \u2022 ", alert.player_id, alert.resolved_at && (_jsxs("p", { className: "text-xs dark:text-gray-400 mt-1", children: ["\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u043E: ", format(new Date(alert.resolved_at), 'dd.MM.yyyy HH:mm:ss')] }))] }), alert.status === 'firing' && (_jsx("button", { onClick: handleResolve, className: "mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300", children: "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043A\u0430\u043A \u0440\u0435\u0448\u0435\u043D\u043D\u044B\u0439" }))] }))] }));
};
const AlertsPanel = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            console.log('AlertsPanel: Отправка запроса на алерты к API_URL:', `${import.meta.env.VITE_API_URL}/alerts`);
            const data = await api.getAlerts();
            setAlerts(data);
            setError(null);
        }
        catch (err) {
            console.error("Ошибка при получении алертов:", err);
            setError("Не удалось загрузить алерты.");
        }
        finally {
            setLoading(false);
        }
    }, [setAlerts, setError, setLoading]);
    useEffect(() => {
        console.log('AlertsPanel: useEffect запущен');
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);
    if (loading) {
        return _jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0430\u043B\u0435\u0440\u0442\u043E\u0432...", style: { margin: '20px' } });
    }
    if (error) {
        return _jsx(AntdAlert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true, style: { margin: '20px' } });
    }
    return (_jsxs("div", { children: [_jsx(Title, { level: 4, className: "dark:text-gray-100", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0410\u043B\u0435\u0440\u0442\u043E\u0432" }), alerts.length === 0 && (_jsx("p", { className: "text-gray-400 text-center", children: "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0430\u043B\u0435\u0440\u0442\u043E\u0432." })), alerts.length > 0 && alerts.map((alert) => (_jsx(AlertItem, { alert: alert, onResolve: fetchAlerts, setParentError: setError }, alert.id)))] }));
};
export default AlertsPanel;
