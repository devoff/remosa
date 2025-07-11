import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Button, Chip, Typography, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeviceFormModal from './Monitoring/DeviceFormModal';
import { useAuth } from '../lib/useAuth';
import apiClient from '../lib/api';
const PlatformDevicesTable = ({ devices, onAdd, onDelete }) => {
    const [editDevice, setEditDevice] = React.useState(null);
    const [addModalOpen, setAddModalOpen] = React.useState(false);
    const [availableModels, setAvailableModels] = React.useState([]);
    const { currentPlatform } = useAuth();
    const [deviceList, setDeviceList] = React.useState(devices);
    React.useEffect(() => {
        // Fetch models for dropdown
        import('../lib/api').then(({ default: apiClient }) => {
            apiClient.get('/command_templates/').then(res => {
                const models = Array.from(new Set(res.data.map((t) => String(t.model)).filter(Boolean)));
                setAvailableModels(models);
            });
        });
    }, []);
    React.useEffect(() => { setDeviceList(devices); }, [devices]);
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'online':
            case 'active':
                return 'success';
            case 'offline':
            case 'inactive':
                return 'error';
            case 'warning':
                return 'warning';
            default:
                return 'default';
        }
    };
    const formatDate = (dateString) => {
        if (!dateString)
            return '-';
        return new Date(dateString).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const handleDeleteDevice = (deviceId) => {
        if (window.confirm('Удалить устройство из платформы?')) {
            onDelete(deviceId);
        }
    };
    const handleEditDevice = (device) => {
        setEditDevice(device);
        setAddModalOpen(false); // Закрыть окно добавления, если оно вдруг открыто
    };
    const handleSaveEditDevice = async (updated) => {
        setEditDevice(null);
        // fallback: если platform_id не пришёл из формы, взять из оригинального устройства
        const original = deviceList.find(d => d.id === updated.id);
        const platform_id = updated.platform_id || original?.platform_id;
        if (!platform_id)
            return;
        try {
            // Объединить оригинальные данные и изменения, platform_id всегда актуальный
            const payload = { ...original, ...updated, platform_id };
            await apiClient.put(`/platforms/${platform_id}/devices/${payload.id}/`, payload);
            // Обновить список устройств после успешного редактирования
            const res = await apiClient.get(`/platforms/${platform_id}/devices/`);
            setDeviceList(res.data);
        }
        catch (e) {
            alert('Ошибка при сохранении изменений устройства');
        }
    };
    const handleAddDevice = () => {
        setAddModalOpen(true);
    };
    const handleSaveAddDevice = async (newDevice) => {
        setAddModalOpen(false);
        if (!currentPlatform)
            return;
        try {
            await apiClient.post(`/platforms/${currentPlatform.id}/devices/`, newDevice);
            // Обновить список устройств после успешного добавления
            const res = await apiClient.get(`/platforms/${currentPlatform.id}/devices/`);
            setDeviceList(res.data);
        }
        catch (e) {
            alert('Ошибка при добавлении устройства');
        }
    };
    if (devices.length === 0) {
        return (_jsxs(Box, { sx: { textAlign: 'center', py: 4 }, children: [_jsx(Typography, { variant: "h6", color: "text.secondary", gutterBottom: true, children: "\u041D\u0435\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432 \u0432 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 \u0434\u043B\u044F \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0438\u043C\u0438 \u0447\u0435\u0440\u0435\u0437 \u044D\u0442\u0443 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleAddDevice, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E" })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: handleAddDevice, sx: { mb: 2 }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E" }), _jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx(TableCell, { children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(TableCell, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(TableCell, { children: "\u041C\u043E\u0434\u0435\u043B\u044C" }), _jsx(TableCell, { children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D" }), _jsx(TableCell, { children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435" }), _jsx(TableCell, { children: "\u0421\u043E\u0437\u0434\u0430\u043D\u043E" }), _jsx(TableCell, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(TableBody, { children: deviceList.map((device) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: _jsx(Typography, { variant: "subtitle2", children: device.name }) }), _jsx(TableCell, { children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: device.description || '-' }) }), _jsx(TableCell, { children: _jsx(Chip, { label: device.status, color: getStatusColor(device.status), size: "small" }) }), _jsx(TableCell, { children: device.model || '-' }), _jsx(TableCell, { children: device.phone || '-' }), _jsx(TableCell, { children: formatDate(device.last_update) }), _jsx(TableCell, { children: formatDate(device.created_at) }), _jsxs(TableCell, { children: [_jsx(IconButton, { size: "small", title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", onClick: () => handleEditDevice(device), children: _jsx(EditIcon, {}) }), _jsx(IconButton, { size: "small", color: "error", onClick: () => handleDeleteDevice(device.id), title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", children: _jsx(DeleteIcon, {}) })] })] }, device.id))) })] }) }), editDevice && (_jsx(DeviceFormModal, { device: editDevice, availableModels: availableModels, onSave: handleSaveEditDevice, onClose: () => setEditDevice(null) })), addModalOpen && (_jsx(DeviceFormModal, { device: null, availableModels: availableModels, onSave: handleSaveAddDevice, onClose: () => setAddModalOpen(false) }))] }));
};
export default PlatformDevicesTable;
