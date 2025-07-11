import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Typography, Tabs, Tab, Box, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useApi } from '../lib/useApi';
import { useNotification } from './NotificationProvider';
import PlatformLimitsPanel from './PlatformLimitsPanel';
import PlatformUsersTable from './PlatformUsersTable';
import PlatformDevicesTable from './PlatformDevicesTable';
import JournalPanel from './JournalPanel';
import PlatformEditDialog from './PlatformEditDialog';
import { useAuth } from '../lib/useAuth';
import AddDeviceDialog from './AddDeviceDialog';
const PlatformDetailsPage = () => {
    const { platformId } = useParams();
    const navigate = useNavigate();
    const [platform, setPlatform] = useState(null);
    const [users, setUsers] = useState([]);
    const [devices, setDevices] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [addDeviceDialogOpen, setAddDeviceDialogOpen] = useState(false);
    const { notify } = useNotification();
    const { get, post, put, remove } = useApi();
    const { user } = useAuth();
    const currentUserPlatformRole = users.find(u => u.email === user?.email)?.platform_role;
    const canManagePlatform = currentUserPlatformRole === 'admin' || user?.role === 'superadmin';
    const canManageDevices = ['admin', 'manager'].includes(currentUserPlatformRole || '') || user?.role === 'superadmin';
    const fetchPlatformData = useCallback(async () => {
        if (!platformId)
            return;
        setLoading(true);
        try {
            const platformData = await get(`/platforms/${platformId}`);
            setPlatform(platformData);
        }
        catch (e) {
            notify('Ошибка загрузки данных платформы', 'error');
        }
        finally {
            setLoading(false);
        }
    }, [platformId, get, notify]);
    const fetchUsers = useCallback(async () => {
        if (!platformId)
            return;
        try {
            if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
                console.log('PlatformDetailsPage.fetchUsers Debug:', {
                    platformId,
                    'URL being requested': `/platforms/${platformId}/users`,
                    'get function': get
                });
            }
            const usersData = await get(`/platforms/${platformId}/users`);
            setUsers(usersData);
        }
        catch (e) {
            console.error('PlatformDetailsPage.fetchUsers Error:', e);
            notify('Ошибка загрузки пользователей', 'error');
        }
    }, [platformId, get, notify]);
    const fetchDevices = useCallback(async () => {
        if (!platformId)
            return;
        try {
            const devicesData = await get(`/platforms/${platformId}/devices`);
            setDevices(devicesData);
        }
        catch (e) {
            notify('Ошибка загрузки устройств', 'error');
        }
    }, [platformId, get, notify]);
    const fetchAuditLogs = useCallback(async () => {
        if (!platformId)
            return;
        try {
            const logs = await get(`/audit-logs/?platform_id=${platformId}`);
            setAuditLogs(logs);
        }
        catch (e) {
            setAuditLogs([]);
        }
    }, [platformId, get]);
    useEffect(() => {
        fetchPlatformData();
        fetchDevices(); // ДОБАВЛЕНО: всегда загружать устройства при монтировании/смене платформы
    }, [fetchPlatformData, fetchDevices]);
    useEffect(() => {
        if (tab === 0)
            fetchUsers();
        else if (tab === 1)
            fetchDevices();
        else if (tab === 2)
            fetchAuditLogs();
    }, [tab, fetchUsers, fetchDevices, fetchAuditLogs]);
    const handleTabChange = (_, newValue) => setTab(newValue);
    const handleAddUser = async (userData) => {
        if (!platformId)
            return;
        try {
            await post(`/platforms/${platformId}/users`, userData);
            notify('Пользователь добавлен', 'success');
            fetchUsers();
        }
        catch (e) {
            notify('Ошибка добавления пользователя', 'error');
        }
    };
    const handleEditUser = async (userId, roleData) => {
        if (!platformId)
            return;
        try {
            await put(`/platforms/${platformId}/users/${userId}`, roleData);
            notify('Роль обновлена', 'success');
            fetchUsers();
        }
        catch (e) {
            notify('Ошибка обновления роли', 'error');
        }
    };
    const handleDeleteUser = async (userId) => {
        if (!platformId)
            return;
        try {
            await remove(`/platforms/${platformId}/users/${userId}`);
            notify('Пользователь удален', 'success');
            fetchUsers();
        }
        catch (e) {
            notify('Ошибка удаления пользователя', 'error');
        }
    };
    const handleAddDevice = () => {
        setAddDeviceDialogOpen(true);
    };
    const handleConfirmAddDevice = async (deviceData) => {
        if (!platformId)
            return;
        try {
            await post(`/platforms/${platformId}/devices`, deviceData);
            notify('Устройство добавлено', 'success');
            fetchDevices();
        }
        catch (e) {
            notify(e.response?.data?.detail || 'Ошибка добавления устройства', 'error');
        }
    };
    const handleDeleteDevice = async (deviceId) => {
        if (!platformId)
            return;
        if (!window.confirm('Удалить это устройство?'))
            return;
        try {
            await remove(`/platforms/${platformId}/devices/${deviceId}`);
            notify('Устройство удалено', 'success');
            fetchDevices();
        }
        catch (e) {
            notify('Ошибка удаления устройства', 'error');
        }
    };
    const handleEditPlatform = () => setEditDialogOpen(true);
    const handleEditSave = () => fetchPlatformData();
    if (loading) {
        return (_jsxs(Paper, { sx: { p: 2, textAlign: 'center' }, children: [_jsx(CircularProgress, {}), _jsx(Typography, { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })] }));
    }
    if (!platform) {
        return (_jsx(Paper, { sx: { p: 2 }, children: _jsx(Typography, { children: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" }) }));
    }
    return (_jsxs(Paper, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mb: 2 }, children: [_jsx(Button, { startIcon: _jsx(ArrowBackIcon, {}), onClick: () => navigate('/admin/platforms'), sx: { mr: 2 }, children: "\u041D\u0430\u0437\u0430\u0434" }), _jsx(Typography, { variant: "h4", sx: { flexGrow: 1 }, children: platform.name }), currentUserPlatformRole && (_jsx(Box, { sx: { ml: 2, px: 2, py: 1, borderRadius: 2, bgcolor: '#f3f4f6' }, children: _jsxs(Typography, { variant: "body2", color: "textSecondary", children: ["\u0412\u0430\u0448\u0430 \u0440\u043E\u043B\u044C: ", _jsx("b", { children: currentUserPlatformRole })] }) }))] }), _jsx(PlatformLimitsPanel, { platform: platform, isAdmin: canManagePlatform, onEdit: canManagePlatform ? handleEditPlatform : () => { } }), _jsx(Box, { sx: { borderBottom: 1, borderColor: 'divider', mt: 3 }, children: _jsxs(Tabs, { value: tab, onChange: handleTabChange, children: [_jsx(Tab, { label: `Пользователи (${users.length})` }), _jsx(Tab, { label: `Устройства (${devices.length})` }), _jsx(Tab, { label: "\u0416\u0443\u0440\u043D\u0430\u043B" })] }) }), _jsxs(Box, { sx: { pt: 2 }, children: [tab === 0 && (_jsx(PlatformUsersTable, { users: users, onAdd: canManagePlatform ? handleAddUser : () => { }, onEdit: canManagePlatform ? handleEditUser : () => { }, onDelete: canManagePlatform ? handleDeleteUser : () => { } })), tab === 1 && (_jsx(PlatformDevicesTable, { devices: devices, onAdd: canManageDevices ? handleAddDevice : () => { }, onDelete: canManageDevices ? handleDeleteDevice : () => { } })), tab === 2 && _jsx(JournalPanel, { logs: auditLogs, platformId: platform.id })] }), _jsx(PlatformEditDialog, { open: editDialogOpen, platform: platform, onClose: () => setEditDialogOpen(false), onSave: handleEditSave }), _jsx(AddDeviceDialog, { open: addDeviceDialogOpen, onClose: () => setAddDeviceDialogOpen(false), onAdd: handleConfirmAddDevice })] }));
};
export default PlatformDetailsPage;
