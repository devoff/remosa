import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Square, RefreshCw, Trash2, Activity, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotification } from '../NotificationProvider';
import { usePlatformExporterApi } from '../../lib/platformExporterApi';
const PlatformExporterDetailsModal = ({ exporter, platformId, dockerStatus, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [devices, setDevices] = useState([]);
    const [stats, setStats] = useState(null);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const { notify } = useNotification();
    const { getExporterDevices, getExporterStats, deletePlatformExporter } = usePlatformExporterApi();
    useEffect(() => {
        loadExporterData();
    }, [exporter.id]);
    const loadExporterData = async () => {
        try {
            setLoadingDevices(true);
            const [devicesData, statsData] = await Promise.all([
                getExporterDevices(platformId, exporter.id),
                getExporterStats(platformId, exporter.id)
            ]);
            setDevices(devicesData);
            setStats(statsData);
        }
        catch (error) {
            console.error('Ошибка загрузки данных экспортера:', error);
        }
        finally {
            setLoadingDevices(false);
        }
    };
    const handleDelete = async () => {
        if (!confirm('Вы уверены, что хотите удалить этот экспортер?'))
            return;
        try {
            setLoading(true);
            await deletePlatformExporter(platformId, exporter.id);
            notify('Экспортер удален', 'success');
            onClose();
            onUpdate();
        }
        catch (error) {
            notify(error.response?.data?.detail || 'Ошибка удаления экспортера', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    const getDockerStatusIcon = () => {
        const status = dockerStatus?.status;
        switch (status) {
            case 'running':
                return _jsx(CheckCircle, { className: "text-green-500", size: 20 });
            case 'stopped':
                return _jsx(Square, { className: "text-red-500", size: 20 });
            case 'error':
                return _jsx(AlertCircle, { className: "text-red-500", size: 20 });
            default:
                return _jsx(Activity, { className: "text-gray-400", size: 20 });
        }
    };
    const getDockerStatusText = () => {
        const status = dockerStatus?.status;
        switch (status) {
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
    const getDockerStatusColor = () => {
        const status = dockerStatus?.status;
        switch (status) {
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
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-100", children: "\u0414\u0435\u0442\u0430\u043B\u0438 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-300 transition-colors", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-gray-100", children: "\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-gray-400 text-sm", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx("p", { className: "text-gray-100 font-medium", children: exporter.name })] }), _jsxs("div", { children: [_jsx("label", { className: "text-gray-400 text-sm", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx("p", { className: "text-gray-100", children: exporter.description || 'Без описания' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-gray-400 text-sm", children: "\u0422\u0438\u043F \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440\u0430" }), _jsx(Badge, { variant: "outline", className: "mt-1", children: exporter.platform_type === 'cubicmedia' ? 'CubicMedia' : 'Addreality' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-gray-400 text-sm", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(Badge, { variant: "outline", className: "mt-1", children: exporter.status })] }), _jsxs("div", { children: [_jsx("label", { className: "text-gray-400 text-sm", children: "\u0421\u043E\u0437\u0434\u0430\u043D" }), _jsx("p", { className: "text-gray-100", children: new Date(exporter.created_at).toLocaleString() })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-gray-100 flex items-center gap-2", children: [_jsx(Activity, { size: 18 }), "Docker \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${getDockerStatusColor()}` }), _jsxs("div", { className: "flex items-center gap-2", children: [getDockerStatusIcon(), _jsx("span", { className: "text-gray-100", children: getDockerStatusText() })] })] }), dockerStatus?.container_name && (_jsxs("div", { children: [_jsx("label", { className: "text-gray-400 text-sm", children: "\u0418\u043C\u044F \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u0430" }), _jsx("p", { className: "text-gray-100 font-mono text-sm", children: dockerStatus.container_name })] })), dockerStatus?.container_info && (_jsxs("div", { children: [_jsx("label", { className: "text-gray-400 text-sm", children: "\u041F\u043E\u0440\u0442" }), _jsx("p", { className: "text-gray-100", children: dockerStatus.container_info.ports?.['9000/tcp']?.[0]?.HostPort || 'Не настроен' })] }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-gray-100", children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx("div", { className: "flex gap-2", children: _jsxs(Button, { onClick: loadExporterData, disabled: loadingDevices, variant: "outline", className: "flex items-center gap-2", children: [_jsx(RefreshCw, { size: 16 }), "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C"] }) }), _jsxs(Button, { onClick: handleDelete, disabled: loading, variant: "outline", className: "flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20", children: [_jsx(Trash2, { size: 16 }), "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435\u0440"] })] })] })] }), _jsxs("div", { className: "space-y-6", children: [stats && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-gray-100 flex items-center gap-2", children: [_jsx(BarChart3, { size: 18 }), "\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-gray-100", children: stats.total_devices }), _jsx("p", { className: "text-gray-400 text-sm", children: "\u0412\u0441\u0435\u0433\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-green-400", children: stats.online_devices }), _jsx("p", { className: "text-gray-400 text-sm", children: "\u041E\u043D\u043B\u0430\u0439\u043D" })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-2xl font-bold text-red-400", children: stats.offline_devices }), _jsx("p", { className: "text-gray-400 text-sm", children: "\u041E\u0444\u0444\u043B\u0430\u0439\u043D" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-2xl font-bold text-green-400", children: [stats.online_percentage.toFixed(1), "%"] }), _jsx("p", { className: "text-gray-400 text-sm", children: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u043E\u043D\u043B\u0430\u0439\u043D" })] })] }) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-gray-100", children: ["\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 (", devices.length, ")"] }) }), _jsx(CardContent, { children: loadingDevices ? (_jsxs("div", { className: "text-center py-4", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" }), _jsx("p", { className: "text-gray-400 mt-2", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432..." })] })) : devices.length === 0 ? (_jsx("div", { className: "text-center py-4", children: _jsx("p", { className: "text-gray-400", children: "\u041D\u0435\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" }) })) : (_jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: devices.map((device, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-750 rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-100 font-medium", children: device.name || device.mac }), _jsx("p", { className: "text-gray-400 text-sm", children: device.mac }), device.ip && _jsxs("p", { className: "text-gray-400 text-sm", children: ["IP: ", device.ip] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${device.status === 1 ? 'bg-green-500' : 'bg-red-500'}` }), _jsx("span", { className: "text-sm text-gray-400", children: device.status === 1 ? 'Онлайн' : 'Оффлайн' })] })] }, index))) })) })] })] })] })] }) }));
};
export default PlatformExporterDetailsModal;
