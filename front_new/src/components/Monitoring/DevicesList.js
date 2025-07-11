import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import './DevicesList.css';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/useAuth';
import { DeviceFormModal } from './DeviceFormModal';
import { DeviceCommandsPanel } from '../DeviceCommandsPanel';
import AlertsPanel from './AlertsPanel';
import { canAddDevice, canEditDevice } from '../../utils/roleUtils';
import { message as antdMessage } from 'antd';
const DevicesList = () => {
    const { get, post, put, remove, patch } = useApi();
    const { isSuperAdmin, user, currentPlatform } = useAuth();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentDevice, setCurrentDevice] = useState(null);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [availableModels, setAvailableModels] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const fetchDevices = useCallback(async () => {
        setLoading(true);
        try {
            let url = '';
            if (isSuperAdmin) {
                url = '/devices/';
            }
            else if (currentPlatform?.id) {
                url = `/platforms/${currentPlatform.id}/devices`;
            }
            else {
                setDevices([]);
                return;
            }
            const data = await get(url);
            setDevices(data);
            const models = Array.from(new Set(data.map((d) => d.model).filter(Boolean)));
            setAvailableModels(models);
        }
        catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
        finally {
            setLoading(false);
        }
    }, [get, isSuperAdmin, currentPlatform]);
    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);
    const getStatusColor = (status) => {
        switch (status) {
            case 'ONLINE': return 'text-green-500';
            case 'WARNING': return 'text-yellow-500';
            case 'OFFLINE': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };
    const getDeviceIcon = (type) => {
        const icons = {
            sensor: '🌡️',
            actuator: '⚙️',
            controller: '🖥️',
            default: '❓'
        };
        return icons[type] || icons.default;
    };
    const handleSave = async (deviceData) => {
        if (isSuperAdmin) {
            try {
                const originalDevice = devices.find(d => d.id === deviceData.id);
                const newPlatformId = deviceData.platform_id;
                if (originalDevice && newPlatformId && originalDevice.platform_id !== newPlatformId) {
                    await patch(`/devices/${deviceData.id}/move/${newPlatformId}`, {});
                }
                const { platform_id, ...restOfData } = deviceData;
                if (deviceData.id) {
                    await put(`/devices/${deviceData.id}`, restOfData);
                }
                else {
                    await post('/devices/', deviceData);
                }
                fetchDevices();
            }
            catch (err) {
                if (err?.response?.data?.detail) {
                    antdMessage.error(err.response.data.detail);
                }
                else if (err?.message) {
                    antdMessage.error(err.message);
                }
                else {
                    antdMessage.error('Ошибка при сохранении устройства');
                }
            }
            return;
        }
        if (!deviceData.platform_id) {
            antdMessage.error('Не выбрана платформа для устройства.');
            return;
        }
        try {
            const { platform_id, id, ...rest } = deviceData;
            if (id) {
                await put(`/platforms/${platform_id}/devices/${id}`, rest);
            }
            else {
                await post(`/platforms/${platform_id}/devices/`, rest);
            }
            fetchDevices();
        }
        catch (err) {
            if (err?.response?.data?.detail) {
                antdMessage.error(err.response.data.detail);
            }
            else if (err?.message) {
                antdMessage.error(err.message);
            }
            else {
                antdMessage.error('Ошибка при сохранении устройства');
            }
        }
    };
    const handleOpenCommandsPanel = (device) => {
        setSelectedDevice(device);
    };
    const handleCloseCommandsPanel = () => {
        setSelectedDevice(null);
    };
    // DEBUG LOGS
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('user:', user);
    }
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('currentPlatform:', currentPlatform);
    }
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('platform_roles:', user?.platform_roles);
    }
    if (loading)
        return _jsx("div", { className: "p-4 text-center", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432..." });
    if (error)
        return _jsxs("div", { className: "p-4 text-red-500", children: ["\u041E\u0448\u0438\u0431\u043A\u0430: ", error] });
    return (_jsxs("div", { className: "devices-container p-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "\u0421\u043F\u0438\u0441\u043E\u043A \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: () => setViewMode('grid'), className: `px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-400'}`, children: "\u041F\u043B\u0438\u0442\u043A\u0438" }), _jsx("button", { onClick: () => setViewMode('table'), className: `px-3 py-1 rounded ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-400'}`, children: "\u0422\u0430\u0431\u043B\u0438\u0446\u0430" }), (isSuperAdmin || canAddDevice(user, currentPlatform)) && (_jsx("button", { onClick: () => setIsAddModalOpen(true), className: "bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E" }))] })] }), viewMode === 'grid' ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: devices.map((device) => {
                    const deviceId = Number(device.id);
                    return (_jsx("div", { className: "device-card bg-white dark:bg-gray-800 rounded-lg shadow p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "text-2xl mr-3", children: getDeviceIcon(device.model) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("h3", { className: "font-medium dark:text-gray-100", children: device.name }), _jsxs("div", { className: "flex space-x-2", children: [(isSuperAdmin || canEditDevice(user, currentPlatform)) && (_jsx("button", { onClick: () => {
                                                                setCurrentDevice(device);
                                                                setIsEditModalOpen(true);
                                                            }, className: "text-gray-500 hover:text-gray-700", children: "\u270F\uFE0F" })), _jsx("button", { onClick: () => handleOpenCommandsPanel(device), className: "text-blue-500 hover:text-blue-700 ml-2", children: "\u2699\uFE0F \u041A\u043E\u043C\u0430\u043D\u0434\u044B" })] })] }), _jsxs("div", { className: "mt-2 space-y-1", children: [_jsxs("p", { className: "dark:text-gray-300", children: ["\u0421\u0442\u0430\u0442\u0443\u0441: ", _jsx("span", { className: `${getStatusColor(device.status)} font-medium`, children: device.status })] }), _jsxs("p", { className: "dark:text-gray-300", children: ["ID: ", deviceId] }), device.phone && (_jsxs("p", { className: "dark:text-gray-300", children: ["\u0422\u0435\u043B\u0435\u0444\u043E\u043D: ", device.phone] })), device.model && (_jsxs("p", { className: "dark:text-gray-300", children: ["\u041C\u043E\u0434\u0435\u043B\u044C: ", device.model] })), device.grafana_uid && (_jsxs("p", { className: "dark:text-gray-300", children: ["ID \u043F\u043B\u0435\u0435\u0440\u0430 Grafana: ", device.grafana_uid] })), device.description && (_jsxs("p", { className: "text-gray-600 dark:text-gray-400", children: ["\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435: ", device.description] })), device.platform_id && (_jsxs("p", { className: "dark:text-gray-300 text-sm text-gray-500", children: ["\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430: ", platforms.find(p => p.id === device.platform_id)?.name || device.platform_id] })), _jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-500", children: ["\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ", new Date(device.last_update).toLocaleString()] })] })] })] }) }, deviceId));
                }) })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full bg-gray-800 rounded-lg", children: [_jsx("thead", { className: "bg-gray-700", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E" }), _jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "\u041C\u043E\u0434\u0435\u043B\u044C" }), _jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "ID" }), _jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D" }), _jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "ID \u043F\u043B\u0435\u0435\u0440\u0430 Grafana" }), _jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E" }), _jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430" }), _jsx("th", { className: "px-4 py-2 text-left text-gray-100", children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx("tbody", { children: devices.map((device) => {
                                const deviceId = Number(device.id);
                                return (_jsxs("tr", { className: "border-t border-gray-700 hover:bg-gray-700", children: [_jsx("td", { className: "px-4 py-3 text-gray-100", children: _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-2", children: getDeviceIcon(device.model) }), device.name] }) }), _jsx("td", { className: "px-4 py-3 text-gray-100", children: device.model || '-' }), _jsx("td", { className: `px-4 py-3 ${getStatusColor(device.status)}`, children: device.status }), _jsx("td", { className: "px-4 py-3 text-gray-100", children: deviceId }), _jsx("td", { className: "px-4 py-3 text-gray-300", children: device.phone || '-' }), _jsx("td", { className: "px-4 py-3 text-gray-300", children: device.grafana_uid || '-' }), _jsx("td", { className: "px-4 py-3 text-gray-300", children: device.description || '-' }), _jsx("td", { className: "px-4 py-3 text-sm text-gray-400", children: new Date(device.last_update).toLocaleString() }), _jsx("td", { className: "px-4 py-3 text-gray-100", children: device.platform_id && (platforms.find(p => p.id === device.platform_id)?.name || device.platform_id) }), _jsx("td", { className: "px-4 py-3 text-gray-100", children: _jsxs("div", { className: "flex gap-2", children: [(isSuperAdmin || canEditDevice(user, currentPlatform)) && (_jsx("button", { onClick: () => {
                                                            setCurrentDevice(device);
                                                            setIsEditModalOpen(true);
                                                        }, className: "text-gray-500 hover:text-gray-700", children: "\u270F\uFE0F" })), _jsx("button", { onClick: () => handleOpenCommandsPanel(device), className: "text-blue-500 hover:text-blue-700 ml-2", children: "\u2699\uFE0F \u041A\u043E\u043C\u0430\u043D\u0434\u044B" })] }) })] }, deviceId));
                            }) })] }) })), isAddModalOpen && (_jsx(DeviceFormModal, { device: null, onClose: () => setIsAddModalOpen(false), onSave: handleSave, availableModels: availableModels })), isEditModalOpen && (_jsx(DeviceFormModal, { device: currentDevice, onClose: () => setIsEditModalOpen(false), onSave: handleSave, availableModels: availableModels })), selectedDevice && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto relative", children: [_jsx("button", { onClick: handleCloseCommandsPanel, className: "absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl", children: "\u00D7" }), _jsx(DeviceCommandsPanel, { device: selectedDevice, onClose: handleCloseCommandsPanel })] }) })), _jsx("div", { className: "mt-8", children: _jsx(AlertsPanel, {}) })] }));
};
export default DevicesList;
