import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, Eye, Activity, AlertCircle, CheckCircle, Server, Square, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../lib/useAuth';
import { useNotification } from './NotificationProvider';
import PlatformExporterDialog from './PlatformExporters/PlatformExporterDialog';
import PlatformExporterDetailsModal from './PlatformExporters/PlatformExporterDetailsModal';
import { usePlatformExporterApi } from '../lib/platformExporterApi';
const PlatformExportersPage = () => {
    const [exporters, setExporters] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedExporter, setSelectedExporter] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [detailedExporter, setDetailedExporter] = useState(null);
    const [dockerStatuses, setDockerStatuses] = useState({});
    const { user } = useAuth();
    const { notify } = useNotification();
    const { getPlatformExporters, getPlatformStats, getExporterDockerStatus, deletePlatformExporter } = usePlatformExporterApi();
    const platformId = user?.platform_id;
    useEffect(() => {
        if (platformId) {
            loadData();
        }
    }, [platformId]);
    const loadData = async () => {
        if (!platformId)
            return;
        try {
            setLoading(true);
            const [exportersData, statsData] = await Promise.all([
                getPlatformExporters(platformId),
                getPlatformStats(platformId)
            ]);
            setExporters(exportersData);
            setStats(statsData);
            // Загружаем статусы Docker контейнеров
            const dockerStatusesData = {};
            for (const exporter of exportersData) {
                try {
                    const status = await getExporterDockerStatus(platformId, exporter.id);
                    dockerStatusesData[exporter.id] = status;
                }
                catch (error) {
                    console.error(`Ошибка получения статуса Docker для экспортера ${exporter.id}:`, error);
                    dockerStatusesData[exporter.id] = { status: 'error', message: 'Ошибка получения статуса' };
                }
            }
            setDockerStatuses(dockerStatusesData);
        }
        catch (error) {
            notify('Ошибка при загрузке данных', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (exporterId) => {
        if (!platformId || !confirm('Вы уверены, что хотите удалить этот экспортер?'))
            return;
        try {
            await deletePlatformExporter(platformId, exporterId);
            await loadData();
            notify('Экспортер удален', 'success');
        }
        catch (error) {
            notify('Ошибка при удалении', 'error');
        }
    };
    const handleShowDetails = async (exporter) => {
        setShowDetails(true);
        setDetailedExporter(exporter);
    };
    const getStatusIcon = (exporter) => {
        const dockerStatus = dockerStatuses[exporter.id]?.status;
        if (dockerStatus === 'running') {
            return _jsx(CheckCircle, { className: "text-green-500", size: 16 });
        }
        else if (dockerStatus === 'stopped') {
            return _jsx(Square, { className: "text-red-500", size: 16 });
        }
        else if (dockerStatus === 'error') {
            return _jsx(AlertCircle, { className: "text-red-500", size: 16 });
        }
        else {
            return _jsx(Activity, { className: "text-gray-400", size: 16 });
        }
    };
    const getStatusText = (exporter) => {
        const dockerStatus = dockerStatuses[exporter.id]?.status;
        switch (dockerStatus) {
            case 'running':
                return 'Работает';
            case 'stopped':
                return 'Остановлен';
            case 'error':
                return 'Ошибка';
            case 'not_found':
                return 'Не найден';
            default:
                return 'Неизвестно';
        }
    };
    const getStatusColor = (exporter) => {
        const dockerStatus = dockerStatuses[exporter.id]?.status;
        switch (dockerStatus) {
            case 'running':
                return 'bg-green-500';
            case 'stopped':
                return 'bg-red-500';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };
    if (!platformId) {
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-red-900/20 border border-red-500/50 rounded-lg p-4", children: [_jsx("h2", { className: "text-red-400 font-semibold", children: "\u041E\u0448\u0438\u0431\u043A\u0430" }), _jsx("p", { className: "text-gray-300 mt-2", children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F." })] }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-100", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u044B \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B" }), _jsx("p", { className: "text-gray-400 mt-1", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430\u043C\u0438 \u0434\u043B\u044F \u0441\u0431\u043E\u0440\u0430 \u043C\u0435\u0442\u0440\u0438\u043A \u0441 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: loadData, className: "bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors", children: [_jsx(RefreshCw, { size: 16 }), "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C"] }), _jsxs("button", { onClick: () => setShowDialog(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors", children: [_jsx(Plus, { size: 16 }), "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440"] })] })] }), stats && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [_jsx("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "\u0412\u0441\u0435\u0433\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" }), _jsx("p", { className: "text-2xl font-bold text-gray-100", children: stats.total_devices })] }), _jsx(Server, { className: "text-blue-400", size: 24 })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "\u041E\u043D\u043B\u0430\u0439\u043D" }), _jsx("p", { className: "text-2xl font-bold text-green-400", children: stats.online_devices })] }), _jsx(CheckCircle, { className: "text-green-400", size: 24 })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "\u041E\u0444\u0444\u043B\u0430\u0439\u043D" }), _jsx("p", { className: "text-2xl font-bold text-red-400", children: stats.offline_devices })] }), _jsx(AlertCircle, { className: "text-red-400", size: 24 })] }) }), _jsx("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-sm", children: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u043E\u043D\u043B\u0430\u0439\u043D" }), _jsxs("p", { className: "text-2xl font-bold text-green-400", children: [stats.online_percentage.toFixed(1), "%"] })] }), _jsx(BarChart3, { className: "text-green-400", size: 24 })] }) })] })), _jsxs("div", { className: "bg-gray-800 rounded-lg border border-gray-700", children: [_jsx("div", { className: "p-4 border-b border-gray-700", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-100", children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u044B" }), _jsxs("span", { className: "text-gray-400 text-sm", children: [exporters.length, " \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u043E\u0432"] })] }) }), loading ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" }), _jsx("p", { className: "text-gray-400 mt-2", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u043E\u0432..." })] })) : exporters.length === 0 ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx(Server, { className: "text-gray-500 mx-auto mb-4", size: 48 }), _jsx("h3", { className: "text-gray-300 font-semibold mb-2", children: "\u041D\u0435\u0442 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u043E\u0432" }), _jsx("p", { className: "text-gray-500 mb-4", children: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0435\u0440\u0432\u044B\u0439 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440 \u0434\u043B\u044F \u043D\u0430\u0447\u0430\u043B\u0430 \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" }), _jsx("button", { onClick: () => setShowDialog(true), className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440" })] })) : (_jsx("div", { className: "divide-y divide-gray-700", children: exporters.map((exporter) => (_jsx("div", { className: "p-4 hover:bg-gray-750 transition-colors", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${getStatusColor(exporter)}` }), _jsxs("div", { children: [_jsx("h3", { className: "text-gray-100 font-medium", children: exporter.name }), _jsx("p", { className: "text-gray-400 text-sm", children: exporter.description || 'Без описания' }), _jsxs("div", { className: "flex items-center gap-4 mt-1", children: [_jsx(Badge, { variant: "outline", className: "text-xs", children: exporter.platform_type === 'cubicmedia' ? 'CubicMedia' : 'Addreality' }), _jsxs("span", { className: "text-gray-500 text-xs", children: [exporter.config.mac_addresses?.length || 0, " MAC-\u0430\u0434\u0440\u0435\u0441\u043E\u0432"] }), _jsxs("span", { className: "text-gray-500 text-xs", children: [exporter.last_metrics_count || 0, " \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432"] })] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1 text-sm", children: [getStatusIcon(exporter), _jsx("span", { className: "text-gray-400", children: getStatusText(exporter) })] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("button", { onClick: () => handleShowDetails(exporter), className: "p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors", title: "\u0414\u0435\u0442\u0430\u043B\u0438", children: _jsx(Eye, { size: 16 }) }), _jsx("button", { onClick: () => handleDelete(exporter.id), className: "p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors", title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(Trash2, { size: 16 }) })] })] })] }) }, exporter.id))) }))] }), showDialog && (_jsx(PlatformExporterDialog, { platformId: platformId, onClose: () => setShowDialog(false), onSuccess: () => {
                    setShowDialog(false);
                    loadData();
                } })), showDetails && detailedExporter && (_jsx(PlatformExporterDetailsModal, { exporter: detailedExporter, platformId: platformId, dockerStatus: dockerStatuses[detailedExporter.id], onClose: () => {
                    setShowDetails(false);
                    setDetailedExporter(null);
                }, onUpdate: loadData }))] }));
};
export default PlatformExportersPage;
