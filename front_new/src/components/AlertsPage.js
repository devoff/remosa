import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/lib/api';
import { Card, Spin, Alert as AntdAlert, Typography, Table, Tag, Select, Descriptions } from 'antd';
const { Title } = Typography;
const { Option } = Select;
if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
    console.log('AlertsPage: Компонент загружен');
}
const AlertItem = ({ alert, onResolve, setParentError }) => {
    const [expanded, setExpanded] = useState(false);
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
    // Цвет кружка справа
    const statusColor = alert.status === 'firing' ? 'bg-red-500' : 'bg-green-500';
    // Цвет типа
    const typeColor = alert.severity === 'info' ? 'text-blue-400' : alert.severity === 'warning' ? 'text-yellow-400' : alert.severity === 'critical' ? 'text-red-400' : 'text-gray-400';
    return (_jsxs("div", { className: "border border-gray-700 rounded-lg mb-2 bg-gray-900/70 hover:bg-gray-800/40 transition-all duration-200 shadow-sm font-inter", children: [_jsxs("div", { className: "flex items-center px-6 py-3 cursor-pointer font-inter text-base text-gray-50", onClick: () => setExpanded(!expanded), children: [_jsx("div", { className: `w-2 h-2 rounded-full ${statusColor} mr-6 flex-shrink-0` }), _jsxs("div", { className: "flex items-center flex-1 gap-8 min-w-0", children: [_jsxs("span", { className: "text-gray-50 font-semibold", children: ["ID: ", alert.id] }), _jsx("span", { className: "text-gray-200", children: alert.data?.platform || 'PlatformA' }), _jsxs("span", { className: "text-gray-300", children: ["Player: ", alert.player_name || '—'] }), _jsx("span", { className: "text-gray-400", children: format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm:ss') })] }), _jsxs("div", { className: "flex items-center gap-4 ml-6", children: [alert.status === 'resolved' && (_jsx("span", { className: "text-green-500 font-semibold text-base", children: "\u0420\u0415\u0428\u0415\u041D" })), alert.severity === 'critical' && (_jsx("span", { className: "text-red-500 font-semibold text-base", children: "CRITICAL" })), _jsx(ChevronDown, { className: `text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`, size: 18 })] })] }), expanded && (_jsxs("div", { className: "px-6 pb-4 border-t border-gray-700/50 bg-gray-800/50 text-sm text-gray-200 font-inter", children: [alert.description && _jsxs("p", { className: "text-sm dark:text-gray-300 mb-2", children: ["\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435: ", alert.description] }), _jsxs("div", { className: "mt-2 text-xs dark:text-gray-500", children: [_jsxs("p", { children: ["ID: ", alert.id] }), alert.player_id && _jsxs("p", { children: ["Player ID: ", alert.player_id] }), alert.resolved_at && (_jsxs("p", { className: "text-xs dark:text-gray-400 mt-1", children: ["\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u043E: ", format(new Date(alert.resolved_at), 'dd.MM.yyyy HH:mm:ss')] }))] }), alert.data && typeof alert.data === 'object' && (_jsxs("div", { className: "mt-3 text-xs dark:text-gray-400", children: [_jsx("h4", { className: "font-semibold mb-1", children: "\u0414\u0435\u0442\u0430\u043B\u0438 \u0430\u043B\u0435\u0440\u0442\u0430 \u0438\u0437 Grafana:" }), _jsxs("p", { children: ["\u0421\u0435\u0440\u044C\u0451\u0437\u043D\u043E\u0441\u0442\u044C: ", alert.data.severity || 'Не указано'] }), _jsxs("p", { children: ["\u041D\u0430\u0447\u0430\u043B\u043E: ", alert.data.startsAt || 'Не указано'] }), _jsxs("p", { children: ["\u041A\u043E\u043D\u0435\u0446: ", alert.data.endsAt || 'Не указано'] }), _jsxs("p", { children: ["\u041F\u043B\u0435\u0435\u0440: ", alert.data.player_name || 'Неизвестный'] }), _jsxs("p", { children: ["\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430: ", alert.data.platform || 'Неизвестная'] }), Object.entries(alert.data || {}).map(([key, value]) => (key !== 'severity' && key !== 'startsAt' && key !== 'endsAt' && key !== 'player_name' && key !== 'platform' && _jsxs("p", { children: [key, ": ", JSON.stringify(value)] }, key)))] })), alert.status === 'firing' && (_jsx("button", { onClick: handleResolve, className: "mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300", children: "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043A\u0430\u043A \u0440\u0435\u0448\u0435\u043D\u043D\u044B\u0439" }))] }))] }));
};
const AlertsPage = ({ onStatsChange }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState(undefined);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getAlerts();
            const sortedData = data.sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setAlerts(sortedData);
            setError(null);
            // Вычисляем и пробрасываем статистику
            if (onStatsChange) {
                const activeCount = sortedData.filter(a => a.status === 'firing').length;
                const resolvedCount = sortedData.filter(a => a.status === 'resolved').length;
                onStatsChange(activeCount, resolvedCount);
            }
        }
        catch (err) {
            setError("Не удалось загрузить алерты.");
        }
        finally {
            setLoading(false);
        }
    }, [onStatsChange]);
    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);
    // Фильтрация по статусу
    const filteredAlerts = statusFilter
        ? alerts.filter(a => a.status === statusFilter)
        : alerts;
    // Явная сортировка по времени (от нового к старому)
    const sortedAlerts = [...filteredAlerts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const columns = [
        {
            title: 'Время',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => new Date(text).toLocaleString(),
            sorter: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            sortDirections: ['descend', 'ascend'],
        },
        {
            title: 'Название',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Сообщение',
            dataIndex: 'message',
            key: 'message',
            render: (_, record) => record.data?.summary || '-',
        },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Активен', value: 'firing' },
                { text: 'Решен', value: 'resolved' },
            ],
            onFilter: (value, record) => record.status === String(value),
            render: (status) => status === 'firing' ? (_jsx(Tag, { color: "red", children: "\u0410\u043A\u0442\u0438\u0432\u0435\u043D" })) : (_jsx(Tag, { color: "green", children: "\u0420\u0435\u0448\u0435\u043D" })),
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        // ...добавьте другие нужные поля
    ];
    const expandedRowRender = (alert) => (_jsxs(Descriptions, { column: 1, bordered: true, size: "small", children: [_jsx(Descriptions.Item, { label: "ID", children: alert.id }), _jsx(Descriptions.Item, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", children: alert.title }), _jsx(Descriptions.Item, { label: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435", children: alert.data?.summary || '-' }), _jsx(Descriptions.Item, { label: "\u0421\u0442\u0430\u0442\u0443\u0441", children: alert.status === 'firing' ? 'Активен' : 'Решен' }), alert.description && (_jsx(Descriptions.Item, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", children: alert.description })), alert.player_id && (_jsx(Descriptions.Item, { label: "Player ID", children: alert.player_id })), alert.resolved_at && (_jsx(Descriptions.Item, { label: "\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u043E", children: new Date(alert.resolved_at).toLocaleString() })), alert.data && typeof alert.data === 'object' && (_jsx(Descriptions.Item, { label: "\u0414\u0435\u0442\u0430\u043B\u0438 \u0438\u0437 Grafana", children: _jsxs("div", { children: [_jsxs("div", { children: ["\u0421\u0435\u0440\u044C\u0451\u0437\u043D\u043E\u0441\u0442\u044C: ", alert.data.severity || 'Не указано'] }), _jsxs("div", { children: ["\u041D\u0430\u0447\u0430\u043B\u043E: ", alert.data.startsAt || 'Не указано'] }), _jsxs("div", { children: ["\u041A\u043E\u043D\u0435\u0446: ", alert.data.endsAt || 'Не указано'] }), _jsxs("div", { children: ["\u041F\u043B\u0435\u0435\u0440: ", alert.data.player_name || 'Неизвестный'] }), _jsxs("div", { children: ["\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430: ", alert.data.platform || 'Неизвестная'] }), Object.entries(alert.data || {}).map(([key, value]) => (key !== 'severity' && key !== 'startsAt' && key !== 'endsAt' && key !== 'player_name' && key !== 'platform' && (_jsxs("div", { children: [key, ": ", JSON.stringify(value)] }, key))))] }) }))] }));
    return (_jsxs(Card, { title: _jsx("h2", { className: "text-xl font-semibold dark:text-gray-100", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0410\u043B\u0435\u0440\u0442\u043E\u0432" }), className: "dark:bg-gray-800 rounded-lg", style: { margin: '20px' }, children: [_jsx("div", { style: { marginBottom: 16 }, children: _jsxs(Select, { placeholder: "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0441\u0442\u0430\u0442\u0443\u0441\u0443", style: { width: 200 }, allowClear: true, onChange: (value) => setStatusFilter(value), children: [_jsx(Option, { value: "firing", children: "\u0410\u043A\u0442\u0438\u0432\u0435\u043D" }), _jsx(Option, { value: "resolved", children: "\u0420\u0435\u0448\u0435\u043D" })] }) }), loading ? (_jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0436\u0443\u0440\u043D\u0430\u043B\u0430 \u0430\u043B\u0435\u0440\u0442\u043E\u0432..." })) : error ? (_jsx(AntdAlert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true })) : (_jsx(Table, { dataSource: sortedAlerts, columns: columns, rowKey: "id", pagination: {
                    current: page,
                    pageSize: pageSize,
                    onChange: (p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                    },
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '15', '30', '50'],
                }, expandable: {
                    expandedRowRender,
                    rowExpandable: () => true,
                } }))] }));
};
export default AlertsPage;
