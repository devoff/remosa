import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Spin, Alert as AntdAlert, Typography } from 'antd';
import { config } from '../../config/runtime';
import { ChevronDown } from 'lucide-react';
const { Title } = Typography;
if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
    console.log('AlertsPanel: Компонент загружен');
}
const AlertItem = ({ alert, onResolve, setParentError }) => {
    const [expanded, setExpanded] = useState(false);
    // Обработчик разрешения алерта
    const handleResolve = async () => {
        try {
            await api.resolveAlert(Number(alert.id));
            onResolve();
            setParentError(null);
        }
        catch (error) {
            console.error("Ошибка при разрешении алерта:", error);
            setParentError("Не удалось разрешить алерт.");
        }
    };
    // Цветовые индикаторы статуса для точки слева
    const statusIndicatorColor = alert.status === 'firing' ? 'bg-red-500' : 'bg-green-500';
    return (_jsxs("div", { className: "border border-gray-700 rounded-lg mb-2 bg-gray-900/70 hover:bg-gray-800/40 transition-all duration-200 shadow-sm font-inter", children: [_jsxs("div", { className: "flex items-center px-6 py-3 cursor-pointer font-inter text-base text-gray-50" // Inter, основной размер, основной цвет
                , onClick: () => setExpanded(!expanded), children: [_jsx("div", { className: `w-2 h-2 rounded-full ${statusIndicatorColor} mr-6 flex-shrink-0` }), _jsxs("div", { className: "flex items-center flex-1 gap-8 min-w-0", children: [_jsxs("span", { className: "text-gray-50 font-semibold", children: ["ID: ", alert.id] }), _jsx("span", { className: "text-gray-200", children: alert.platform_id ?? alert.data?.platform ?? 'PlatformA' }), _jsxs("span", { className: "text-gray-300", children: ["Player: ", alert.player_name || '—'] }), _jsx("span", { className: "text-gray-400", children: format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm:ss') })] }), _jsxs("div", { className: "flex items-center gap-4 ml-6", children: [alert.status === 'resolved' && (_jsx("span", { className: "text-green-500 font-semibold text-base", children: "\u0420\u0415\u0428\u0415\u041D" })), alert.severity === 'critical' && (_jsx("span", { className: "text-red-500 font-semibold text-base", children: "CRITICAL" })), _jsx(ChevronDown, { className: `text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`, size: 18 })] })] }), expanded && (_jsxs("div", { className: "px-6 pb-4 border-t border-gray-700/50 bg-gray-800/50 text-sm text-gray-200 font-inter", children: [alert.description && _jsxs("div", { className: "mb-2 text-gray-200", children: [_jsx("b", { children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435:" }), " ", alert.description] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-300 mb-2", children: [_jsxs("div", { children: [_jsx("b", { children: "\u0422\u0438\u043F:" }), " ", alert.data?.alert_type || '—'] }), _jsxs("div", { children: [_jsx("b", { children: "\u0418\u043D\u0441\u0442\u0430\u043D\u0441:" }), " ", alert.data?.instance || '—'] }), _jsxs("div", { children: [_jsx("b", { children: "Job:" }), " ", alert.data?.job || '—'] }), _jsxs("div", { children: [_jsx("b", { children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D:" }), " ", alert.data?.device_phone_number || '—'] }), _jsxs("div", { children: [_jsx("b", { children: "Fingerprint:" }), " ", alert.data?.fingerprint || '—'] }), _jsxs("div", { children: [_jsx("b", { children: "\u041D\u0430\u0447\u0430\u043B\u043E:" }), " ", alert.data?.startsAt || '—'] }), _jsxs("div", { children: [_jsx("b", { children: "\u041A\u043E\u043D\u0435\u0446:" }), " ", alert.data?.endsAt || '—'] }), _jsxs("div", { children: [_jsx("b", { children: "\u0413\u0440\u0430\u0444\u0430\u043D\u0430 \u043F\u0430\u043F\u043A\u0430:" }), " ", alert.data?.grafana_folder || '—'] }), _jsxs("div", { children: [_jsx("b", { children: "\u0421\u0442\u0430\u0442\u0443\u0441 (\u0434\u0435\u0442\u0430\u043B\u044C):" }), " ", alert.data?.status || '—'] }), _jsxs("div", { children: [_jsx("b", { children: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435:" }), " ", alert.data?.summary || '—'] })] }), alert.data && typeof alert.data === 'object' && (_jsxs("div", { className: "mt-2 text-xs text-gray-400", children: [_jsx("b", { children: "\u0412\u0441\u0435 \u0434\u0435\u0442\u0430\u043B\u0438:" }), _jsx("table", { className: "w-full mt-1 text-xs bg-gray-900 rounded-lg", children: _jsx("tbody", { children: Object.entries(alert.data).map(([key, value]) => (_jsxs("tr", { children: [_jsx("td", { className: "font-semibold pr-2 align-top text-gray-400", style: { verticalAlign: 'top' }, children: key }), _jsx("td", { className: "text-gray-200", children: typeof value === 'object' ? JSON.stringify(value) : String(value) })] }, key))) }) })] })), alert.status === 'firing' && (_jsx("button", { onClick: handleResolve, className: "mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 shadow", children: "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043A\u0430\u043A \u0440\u0435\u0448\u0435\u043D\u043D\u044B\u0439" }))] }))] }));
};
const AlertsPanel = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
                console.log('AlertsPanel: Отправка запроса на алерты к API_URL:', `${config.API_URL}/alerts/`);
            }
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
        if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
            console.log('AlertsPanel: useEffect запущен');
        }
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
    return (_jsxs("div", { children: [_jsx(Title, { level: 4, className: "dark:text-gray-100", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0410\u043B\u0435\u0440\u0442\u043E\u0432" }), alerts.length === 0 && (_jsx("p", { className: "text-gray-400 text-center", children: "\u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0430\u043B\u0435\u0440\u0442\u043E\u0432." })), alerts.length > 0 && [...alerts]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((alert) => (_jsx(AlertItem, { alert: alert, onResolve: fetchAlerts, setParentError: setError }, alert.id)))] }));
};
export default AlertsPanel;
