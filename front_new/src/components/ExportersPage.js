import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Settings, Trash2, Eye, Activity, AlertCircle, CheckCircle, Clock, Server } from 'lucide-react';
import { useExporterApi } from '../lib/exporterApi';
import { useAuth } from '../lib/useAuth';
import { useNotification } from './NotificationProvider';
import ExporterDialog from './Exporters/ExporterDialog';
import ExporterDetailsModal from './Exporters/ExporterDetailsModal';
const ExportersPage = () => {
    const [exporters, setExporters] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedExporter, setSelectedExporter] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [syncing, setSyncing] = useState(null);
    const [detailedExporter, setDetailedExporter] = useState(null);
    const { getExporters, getExporterStats, syncExporter, deleteExporter, getExporter } = useExporterApi();
    const { isSuperAdmin } = useAuth();
    const { notify } = useNotification();
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [exportersData, statsData] = await Promise.all([
                getExporters(),
                getExporterStats()
            ]);
            setExporters(exportersData);
            setStats(statsData);
        }
        catch (error) {
            notify('Ошибка при загрузке данных', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSync = async (exporterId) => {
        try {
            setSyncing(exporterId);
            await syncExporter(exporterId);
            await loadData();
            notify('Синхронизация завершена', 'success');
        }
        catch (error) {
            notify('Ошибка при синхронизации', 'error');
        }
        finally {
            setSyncing(null);
        }
    };
    const handleDelete = async (exporterId) => {
        if (!confirm('Вы уверены, что хотите удалить этот экспортер?'))
            return;
        try {
            await deleteExporter(exporterId);
            await loadData();
            notify('Экспортер удален', 'success');
        }
        catch (error) {
            notify('Ошибка при удалении', 'error');
        }
    };
    const handleShowDetails = async (exporter) => {
        setShowDetails(true);
        setDetailedExporter(null);
        try {
            const data = await getExporter(exporter.id);
            setDetailedExporter(data);
        }
        catch (e) {
            notify('Ошибка при загрузке деталей экспортёра', 'error');
            setShowDetails(false);
        }
    };
    const getStatusIcon = (exporter) => {
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
    const getStatusText = (exporter) => {
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
    if (!isSuperAdmin) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-red-900/20 border border-red-500/50 rounded-lg p-4", children: [_jsx("h2", { className: "text-red-400 font-semibold", children: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D" }), _jsx("p", { className: "text-gray-300 mt-2", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430\u043C\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u0443\u043F\u0435\u0440-\u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430\u043C." })] }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-100", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u044B Prometheus" }), _jsx("p", { className: "text-gray-400 mt-1", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430\u043C\u0438 \u0434\u043B\u044F \u0441\u0431\u043E\u0440\u0430 \u043C\u0435\u0442\u0440\u0438\u043A \u0441 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C" })] }), _jsxs("button", { onClick: () => setShowDialog(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors", children: [_jsx(Plus, { size: 16 }), "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440"] })] }), stats && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [_jsx("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "\u0412\u0441\u0435\u0433\u043E \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u043E\u0432" }), _jsx("p", { className: "text-2xl font-bold text-gray-100", children: stats.total_exporters })] }), _jsx(Server, { className: "text-blue-400", size: 24 })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435" }), _jsx("p", { className: "text-2xl font-bold text-green-400", children: stats.active_exporters })] }), _jsx(Activity, { className: "text-green-400", size: 24 })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "\u0412\u0441\u0435\u0433\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" }), _jsx("p", { className: "text-2xl font-bold text-gray-100", children: stats.total_devices })] }), _jsx(Settings, { className: "text-purple-400", size: 24 })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "\u041E\u043D\u043B\u0430\u0439\u043D" }), _jsx("p", { className: "text-2xl font-bold text-green-400", children: stats.online_devices })] }), _jsx(CheckCircle, { className: "text-green-400", size: 24 })] }) })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg border border-gray-700", children: [_jsx("div", { className: "p-4 border-b border-gray-700", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-100", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u044B" }), _jsx("button", { onClick: loadData, disabled: loading, className: "text-gray-400 hover:text-gray-200 transition-colors", children: _jsx(RefreshCw, { size: 16, className: loading ? 'animate-spin' : '' }) })] }) }), loading ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" }), _jsx("p", { className: "text-gray-400 mt-2", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })] })) : exporters.length === 0 ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx(Server, { className: "text-gray-500 mx-auto mb-4", size: 48 }), _jsx("h3", { className: "text-lg font-medium text-gray-300 mb-2", children: "\u041D\u0435\u0442 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u043E\u0432" }), _jsx("p", { className: "text-gray-500 mb-4", children: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u0439 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440 \u0434\u043B\u044F \u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u0431\u043E\u0440\u0430 \u043C\u0435\u0442\u0440\u0438\u043A" }), _jsx("button", { onClick: () => setShowDialog(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440" })] })) : (_jsx("div", { className: "divide-y divide-gray-700", children: exporters.map((exporter) => (_jsx("div", { className: "p-4 hover:bg-gray-750 transition-colors", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center space-x-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [getStatusIcon(exporter), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-gray-100", children: exporter.name }), _jsxs("p", { className: "text-sm text-gray-400", children: ["ID: ", exporter.id, " \u2022 ", exporter.platform_type, " \u2022 ", exporter.platform_id] })] })] }) }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("p", { className: `text-sm font-medium ${exporter.is_active ? 'text-green-400' : 'text-gray-500'}`, children: exporter.is_active ? 'Активен' : 'Неактивен' })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F" }), _jsx("p", { className: "text-sm font-medium text-gray-300", children: getStatusText(exporter) })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => handleShowDetails(exporter), className: "text-gray-400 hover:text-gray-200 transition-colors", title: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438", children: _jsx(Eye, { size: 16 }) }), _jsx("button", { onClick: () => handleSync(exporter.id), disabled: syncing === exporter.id, className: "text-gray-400 hover:text-blue-400 transition-colors", title: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(RefreshCw, { size: 16, className: syncing === exporter.id ? 'animate-spin' : '' }) }), _jsx("button", { onClick: () => {
                                                            setSelectedExporter(exporter);
                                                            setShowDialog(true);
                                                        }, className: "text-gray-400 hover:text-yellow-400 transition-colors", title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsxs("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "feather feather-edit", children: [_jsx("path", { d: "M11 4h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" }), _jsx("path", { d: "M9 2v4" })] }) }), _jsx("button", { onClick: () => handleDelete(exporter.id), className: "text-gray-400 hover:text-red-400 transition-colors", title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(Trash2, { size: 16 }) })] })] })] }) }, exporter.id))) }))] }), showDialog && (_jsx(ExporterDialog, { exporter: selectedExporter || undefined, onClose: () => {
                    setShowDialog(false);
                    setSelectedExporter(null);
                }, onSave: async () => {
                    setShowDialog(false);
                    setSelectedExporter(null);
                    await loadData();
                } })), showDetails && detailedExporter && (_jsx(ExporterDetailsModal, { exporter: detailedExporter, onClose: () => {
                    setShowDetails(false);
                    setDetailedExporter(null);
                } }))] }));
};
export default ExportersPage;
