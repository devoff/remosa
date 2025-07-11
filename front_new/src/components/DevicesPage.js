import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spin, Alert, message, Tag, Popconfirm, Space, Card, Typography, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useApi } from '../lib/useApi';
import ExecuteCommandModal from './ExecuteCommandModal';
import AddDeviceDialog from './AddDeviceDialog';
import { useAuth } from '../lib/useAuth';
import { canAddDevice } from '../utils/roleUtils';
const { Title } = Typography;
const DevicesPage = () => {
    const { get, post, put, remove } = useApi();
    const { user, currentPlatform, isSuperAdmin } = useAuth();
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('user:', user);
    }
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('currentPlatform:', currentPlatform);
    }
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isCommandModalVisible, setIsCommandModalVisible] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [platformLimits, setPlatformLimits] = useState(null);
    const [editDevice, setEditDevice] = useState(null);
    const [platforms, setPlatforms] = useState([]);
    const [modelFilter, setModelFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [platformFilter, setPlatformFilter] = useState(null);
    const [availableModels, setAvailableModels] = useState([]);
    const fetchDevices = useCallback(async () => {
        // Если пользователь еще не загружен, не делаем запрос
        if (!user) {
            return;
        }
        setLoading(true);
        try {
            let url = '';
            if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
                console.log('DevicesPage fetchDevices:', {
                    isSuperAdmin,
                    currentPlatform: currentPlatform?.id,
                    user: user?.role
                });
            }
            if (isSuperAdmin) {
                url = '/devices/';
                if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
                    console.log('Using superadmin endpoint:', url);
                }
            }
            else if (currentPlatform?.id) {
                url = `/platforms/${currentPlatform.id}/devices/`;
                if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
                    console.log('Using platform endpoint:', url);
                }
            }
            else {
                if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
                    console.log('No platform access, waiting for platform to load...');
                }
                setLoading(false);
                return;
            }
            const data = await get(url);
            setDevices(data);
            setError(null);
        }
        catch (e) {
            if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
                console.log('Fetch devices error:', e);
            }
            setDevices([]);
            if (e.response?.status === 403) {
                setError('Недостаточно прав для просмотра устройств');
            }
            else {
                setError('Ошибка загрузки устройств');
            }
        }
        finally {
            setLoading(false);
        }
    }, [isSuperAdmin, currentPlatform, get, user]);
    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);
    useEffect(() => {
        if (isSuperAdmin) {
            get('/platforms/').then(setPlatforms).catch(() => setPlatforms([]));
        }
    }, [isSuperAdmin, get]);
    useEffect(() => {
        get('/command_templates/').then(res => {
            const models = Array.from(new Set(res.map((t) => String(t.model)).filter(Boolean)));
            setAvailableModels(models);
        }).catch(() => setAvailableModels([]));
    }, [get]);
    const handleAdd = () => {
        setIsAddDialogOpen(true);
    };
    const handleEditDevice = (device) => {
        setEditDevice(device);
        setIsAddDialogOpen(true);
    };
    const handleAddDevice = async (deviceData) => {
        try {
            let url = '';
            if (isSuperAdmin) {
                if (editDevice) {
                    url = `/devices/${editDevice.id}`;
                    await put(url, deviceData);
                    message.success('Устройство успешно обновлено');
                }
                else {
                    url = '/devices/';
                    await post(url, deviceData);
                    message.success('Устройство успешно добавлено');
                }
            }
            else if (currentPlatform?.id) {
                if (editDevice) {
                    url = `/platforms/${currentPlatform.id}/devices/${editDevice.id}`;
                    await put(url, deviceData);
                    message.success('Устройство успешно обновлено');
                }
                else {
                    url = `/platforms/${currentPlatform.id}/devices/`;
                    await post(url, deviceData);
                    message.success('Устройство успешно добавлено');
                }
            }
            else {
                message.error('Платформа не определена');
                return;
            }
            setEditDevice(null);
            fetchDevices();
        }
        catch (e) {
            message.error('Ошибка при сохранении устройства');
            console.error(e);
        }
    };
    const handleDelete = async (deviceId) => {
        try {
            let url = '';
            if (isSuperAdmin) {
                url = `/devices/${deviceId}`;
            }
            else if (currentPlatform?.id) {
                url = `/platforms/${currentPlatform.id}/devices/${deviceId}`;
            }
            else {
                message.error('Платформа не определена');
                return;
            }
            await remove(url);
            message.success('Устройство успешно удалено');
            fetchDevices();
        }
        catch (e) {
            message.error('Не удалось удалить устройство');
        }
    };
    const handleOpenCommandModal = (device) => {
        setSelectedDevice(device);
        setIsCommandModalVisible(true);
    };
    const filteredDevices = devices.filter(device => {
        if (modelFilter && device.model !== modelFilter)
            return false;
        if (statusFilter && device.status !== statusFilter)
            return false;
        if (isSuperAdmin && platformFilter && device.platform_id !== platformFilter)
            return false;
        return true;
    });
    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => Number(a.id) - Number(b.id) },
        { title: 'Имя', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Модель', dataIndex: 'model', key: 'model' },
        { title: 'Телефон', dataIndex: 'phone', key: 'phone' },
        ...(isSuperAdmin
            ? [{
                    title: 'Платформа',
                    dataIndex: 'platform_id',
                    key: 'platform_id',
                    render: (platform_id) => platforms.find(p => p.id === platform_id)?.name || platform_id,
                }]
            : []),
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'geekblue';
                if (status === 'ONLINE')
                    color = 'green';
                if (status === 'OFFLINE')
                    color = 'volcano';
                return _jsx(Tag, { color: color, children: status });
            },
        },
        {
            title: 'Действия',
            key: 'action',
            render: (_, record) => (_jsxs(Space, { size: "middle", children: [_jsx(Button, { icon: _jsx(PlayCircleOutlined, {}), onClick: () => handleOpenCommandModal(record), title: "\u0412\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443" }), _jsx(Button, { icon: _jsx(EditOutlined, {}), onClick: () => handleEditDevice(record), title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" }), _jsx(Popconfirm, { title: "\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u044D\u0442\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E?", onConfirm: () => handleDelete(record.id.toString()), okText: "\u0414\u0430", cancelText: "\u041D\u0435\u0442", children: _jsx(Button, { icon: _jsx(DeleteOutlined, {}), danger: true, title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" }) })] })),
        },
    ];
    if (loading)
        return _jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432..." });
    if (error)
        return _jsx(Alert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error" });
    return (_jsxs("div", { className: "p-4", children: [_jsxs(Card, { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }, children: [_jsx(Title, { level: 3, children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430" }), platformLimits && (_jsx("div", { style: { textAlign: 'right' }, children: _jsxs(Typography.Text, { type: "secondary", children: ["\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430: ", platformLimits.devices.current, " / ", platformLimits.devices.limit || '∞', platformLimits.devices.limit && (_jsxs("span", { style: {
                                                color: platformLimits.devices.available <= 0 ? '#ff4d4f' :
                                                    platformLimits.devices.available <= 2 ? '#faad14' : '#52c41a'
                                            }, children: [' ', "(\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E: ", platformLimits.devices.available, ")"] }))] }) }))] }), _jsxs("div", { style: { display: 'flex', gap: 16, marginBottom: 16 }, children: [_jsx(Select, { allowClear: true, placeholder: "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u043C\u043E\u0434\u0435\u043B\u0438", style: { minWidth: 160 }, value: modelFilter, onChange: setModelFilter, options: availableModels.map(m => ({ value: m, label: m })) }), _jsx(Select, { allowClear: true, placeholder: "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0441\u0442\u0430\u0442\u0443\u0441\u0443", style: { minWidth: 160 }, value: statusFilter, onChange: setStatusFilter, options: [{ value: 'ONLINE', label: 'ONLINE' }, { value: 'WARNING', label: 'WARNING' }, { value: 'OFFLINE', label: 'OFFLINE' }] }), isSuperAdmin && (_jsx(Select, { allowClear: true, placeholder: "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435", style: { minWidth: 180 }, value: platformFilter, onChange: setPlatformFilter, options: platforms.map(p => ({ value: p.id, label: p.name })) }))] }), canAddDevice(user, currentPlatform) && (_jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: handleAdd, disabled: platformLimits && platformLimits.devices.limit && platformLimits.devices.available <= 0, style: { marginBottom: 16 }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E" })), _jsx(Table, { dataSource: filteredDevices, columns: columns, rowKey: "id", loading: loading })] }), _jsx(AddDeviceDialog, { open: isAddDialogOpen, onClose: () => { setIsAddDialogOpen(false); setEditDevice(null); }, onAdd: handleAddDevice, device: editDevice }), selectedDevice && (_jsx(ExecuteCommandModal, { visible: isCommandModalVisible, onClose: () => setIsCommandModalVisible(false), device: selectedDevice }))] }));
};
export default DevicesPage;
