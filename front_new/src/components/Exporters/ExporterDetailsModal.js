import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, RefreshCw, Activity, AlertCircle, CheckCircle, Clock, Server, Hash } from 'lucide-react';
import { useExporterApi } from '../../lib/exporterApi';
import { useNotification } from '../NotificationProvider';
const ExporterDetailsModal = ({ exporter, onClose }) => {
    const [devices, setDevices] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const { getExporterDevices, getExporterMetrics, syncExporter } = useExporterApi();
    const { notify } = useNotification();
    useEffect(() => {
        loadData();
    }, [exporter.id]);
    const loadData = async () => {
        try {
            setLoading(true);
            const [devicesData, metricsData] = await Promise.all([
                getExporterDevices(exporter.id),
                getExporterMetrics(exporter.id)
            ]);
            setDevices(devicesData);
            setMetrics(metricsData);
        }
        catch (error) {
            notify('Ошибка при загрузке данных', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSync = async () => {
        try {
            setSyncing(true);
            await syncExporter(exporter.id);
            await loadData();
            notify('Синхронизация завершена', 'success');
        }
        catch (error) {
            notify('Ошибка при синхронизации', 'error');
        }
        finally {
            setSyncing(false);
        }
    };
    const getStatusIcon = () => {
        if (exporter.sync_status === 'error') {
            return _jsx(AlertCircle, { className: "text-red-500", size: 16 });
        }
        else if (exporter.sync_status === 'success') {
            return _jsx(CheckCircle, { className: "text-green-500", size: 16 });
        }
        else if (exporter.sync_status === 'pending') {
            return _jsx(Clock, { className: "text-yellow-500", size: 16 });
        }
        return _jsx(Activity, { className: "text-gray-400", size: 16 });
    };
    const getStatusText = () => {
        if (exporter.sync_status === 'error') {
            return 'Ошибка';
        }
        else if (exporter.sync_status === 'success') {
            return 'Успешно';
        }
        else if (exporter.sync_status === 'pending') {
            return 'Синхронизация';
        }
        return 'Неизвестно';
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx("div", { className: "bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-100", children: ["\u0414\u0435\u0442\u0430\u043B\u0438 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430: ", exporter.name] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-200 transition-colors", children: _jsx(X, { size: 20 }) })] }), loading ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" }), _jsx("p", { className: "text-gray-400 mt-2", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445..." })] })) : (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-gray-750 rounded-lg p-4 border border-gray-700", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 mb-4 flex items-center", children: [_jsx(Server, { className: "mr-2 text-blue-400", size: 20 }), "\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx("p", { className: "text-gray-100 font-medium", children: exporter.name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0422\u0438\u043F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B" }), _jsx("p", { className: "text-gray-100 font-medium capitalize", children: exporter.platform_type })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "Platform ID" }), _jsx("p", { className: "text-gray-100 font-medium", children: exporter.platform_id })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsxs("div", { className: "flex items-center", children: [getStatusIcon(), _jsx("span", { className: `ml-2 font-medium ${exporter.is_active ? 'text-green-400' : 'text-gray-500'}`, children: exporter.is_active ? 'Активен' : 'Неактивен' })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "ID" }), _jsx("p", { className: "text-gray-100 font-medium", children: exporter.id })] })] })] }), _jsxs("div", { className: "bg-gray-750 rounded-lg p-4 border border-gray-700", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 mb-4 flex items-center", children: [_jsx(Hash, { className: "mr-2 text-green-400", size: 20 }), "MAC \u0430\u0434\u0440\u0435\u0441\u0430"] }), _jsx("div", { className: "space-y-3", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "MAC \u0430\u0434\u0440\u0435\u0441\u0430" }), _jsx("div", { className: "space-y-1", children: (exporter.mac_addresses || []).map((mac, index) => (_jsx("p", { className: "text-gray-100 font-mono text-sm", children: mac }, index))) })] }) })] })] }), metrics && (_jsxs("div", { className: "bg-gray-750 rounded-lg p-4 border border-gray-700", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 mb-4 flex items-center", children: [_jsx(Activity, { className: "mr-2 text-purple-400", size: 20 }), "\u041C\u0435\u0442\u0440\u0438\u043A\u0438"] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-gray-100", children: metrics.total_devices }), _jsx("p", { className: "text-sm text-gray-400", children: "\u0412\u0441\u0435\u0433\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-green-400", children: metrics.online_devices }), _jsx("p", { className: "text-sm text-gray-400", children: "\u041E\u043D\u043B\u0430\u0439\u043D" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-red-400", children: metrics.offline_devices }), _jsx("p", { className: "text-sm text-gray-400", children: "\u041E\u0444\u0444\u043B\u0430\u0439\u043D" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm font-medium text-gray-300", children: formatDate(metrics.last_sync) }), _jsx("p", { className: "text-sm text-gray-400", children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F" })] })] })] })), _jsxs("div", { className: "bg-gray-750 rounded-lg p-4 border border-gray-700", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 flex items-center", children: [_jsx(Hash, { className: "mr-2 text-orange-400", size: 20 }), "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 (", devices.length, ")"] }), _jsxs("button", { onClick: handleSync, disabled: syncing, className: "px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50", children: [_jsx(RefreshCw, { size: 14, className: syncing ? 'animate-spin' : '' }), "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C"] })] }), devices.length === 0 ? (_jsx("p", { className: "text-gray-400 text-center py-4", children: "\u041D\u0435\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-700", children: [_jsx("th", { className: "text-left py-2 text-gray-400", children: "MAC \u0430\u0434\u0440\u0435\u0441" }), _jsx("th", { className: "text-left py-2 text-gray-400", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { className: "text-left py-2 text-gray-400", children: "IP \u0430\u0434\u0440\u0435\u0441" }), _jsx("th", { className: "text-left py-2 text-gray-400", children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0440\u0430\u0437" })] }) }), _jsx("tbody", { children: devices.map((device, index) => (_jsxs("tr", { className: "border-b border-gray-700", children: [_jsx("td", { className: "py-2 font-mono text-gray-100", children: device.mac || device.mac_address || '-' }), _jsx("td", { className: "py-2", children: _jsx("span", { className: `px-2 py-1 rounded-full text-xs ${device.status_text === 'online'
                                                                        ? 'bg-green-900/20 text-green-400'
                                                                        : 'bg-red-900/20 text-red-400'}`, children: device.status_text === 'online' ? 'Онлайн' : 'Оффлайн' }) }), _jsx("td", { className: "py-2 text-gray-300", children: device.ip || device.ip_address || '-' }), _jsx("td", { className: "py-2 text-gray-300", children: formatDate(device.last_seen || '') })] }, index))) })] }) }))] }), _jsxs("div", { className: "bg-gray-750 rounded-lg p-4 border border-gray-700", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 mb-4 flex items-center", children: [_jsx(RefreshCw, { className: "mr-2 text-yellow-400", size: 20 }), "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F"] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center", children: [getStatusIcon(), _jsx("span", { className: "ml-2 text-gray-300", children: getStatusText() })] }), exporter.last_sync_at && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F" }), _jsx("p", { className: "text-gray-100", children: formatDate(exporter.last_sync_at) })] })), exporter.error_message && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u041E\u0448\u0438\u0431\u043A\u0430" }), _jsx("p", { className: "text-red-400 text-sm", children: exporter.error_message })] }))] })] })] }))] }) }) }));
};
export default ExporterDetailsModal;
