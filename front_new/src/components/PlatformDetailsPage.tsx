import React, { useEffect, useState, useCallback } from 'react';
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
import AddIcon from '@mui/icons-material/Add';
import type { Device as GlobalDevice } from '../types';

interface Platform {
  id: number;
  name: string;
  description?: string;
  devices_limit?: number;
  sms_limit?: number;
  created_at: string;
  updated_at?: string;
}

interface PlatformUser {
  id: number;
  email: string;
  is_active: boolean;
  platform_role: string;
  created_at: string;
}

interface Device {
  id: number;
  name: string;
  description?: string;
  status: string;
  last_update?: string;
  created_at: string;
}

const PlatformDetailsPage: React.FC = () => {
  const { platformId } = useParams<{ platformId: string }>();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [devices, setDevices] = useState<GlobalDevice[]>([]);
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
    if (!platformId) return;
    setLoading(true);
    try {
      const platformData = await get(`/platforms/${platformId}`);
      setPlatform(platformData);
    } catch (e: any) {
      notify('Ошибка загрузки данных платформы', 'error');
    } finally {
      setLoading(false);
    }
  }, [platformId, get, notify]);
  
  const fetchUsers = useCallback(async () => {
    if (!platformId) return;
    try {
      console.log('PlatformDetailsPage.fetchUsers Debug:', {
        platformId,
        'URL being requested': `/platforms/${platformId}/users`,
        'get function': get
      });
      const usersData = await get(`/platforms/${platformId}/users`);
      setUsers(usersData);
    } catch (e: any) {
      console.error('PlatformDetailsPage.fetchUsers Error:', e);
      notify('Ошибка загрузки пользователей', 'error');
    }
  }, [platformId, get, notify]);

  const fetchDevices = useCallback(async () => {
    if (!platformId) return;
    try {
      const devicesData = await get(`/platforms/${platformId}/devices`);
      setDevices(devicesData);
    } catch (e: any) {
      notify('Ошибка загрузки устройств', 'error');
    }
  }, [platformId, get, notify]);

  const fetchAuditLogs = useCallback(async () => {
    if (!platformId) return;
    try {
      const logs = await get(`/audit-logs/?platform_id=${platformId}`);
      setAuditLogs(logs);
    } catch (e) {
      setAuditLogs([]);
    }
  }, [platformId, get]);

  useEffect(() => {
    fetchPlatformData();
  }, [fetchPlatformData]);

  useEffect(() => {
    if (tab === 0) fetchUsers();
    else if (tab === 1) fetchDevices();
    else if (tab === 2) fetchAuditLogs();
  }, [tab, fetchUsers, fetchDevices, fetchAuditLogs]);

  const handleTabChange = (_: any, newValue: number) => setTab(newValue);

  const handleAddUser = async (userData: { user_id: number; role: string }) => {
    if (!platformId) return;
    try {
      await post(`/platforms/${platformId}/users`, userData);
      notify('Пользователь добавлен', 'success');
      fetchUsers();
    } catch (e: any) {
      notify('Ошибка добавления пользователя', 'error');
    }
  };

  const handleEditUser = async (userId: number, roleData: { role: string }) => {
    if (!platformId) return;
    try {
      await put(`/platforms/${platformId}/users/${userId}`, roleData);
      notify('Роль обновлена', 'success');
      fetchUsers();
    } catch (e: any) {
      notify('Ошибка обновления роли', 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!platformId) return;
    try {
      await remove(`/platforms/${platformId}/users/${userId}`);
      notify('Пользователь удален', 'success');
      fetchUsers();
    } catch (e: any) {
      notify('Ошибка удаления пользователя', 'error');
    }
  };

  const handleAddDevice = () => {
    setAddDeviceDialogOpen(true);
  };

  const handleConfirmAddDevice = async (deviceData: { name: string; description?: string }) => {
    if (!platformId) return;
    try {
      await post(`/platforms/${platformId}/devices`, deviceData);
      notify('Устройство добавлено', 'success');
      fetchDevices();
    } catch (e: any) {
      notify(e.response?.data?.detail || 'Ошибка добавления устройства', 'error');
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!platformId) return;
    if (!window.confirm('Удалить это устройство?')) return;
    try {
      await remove(`/platforms/${platformId}/devices/${deviceId}`);
      notify('Устройство удалено', 'success');
      fetchDevices();
    } catch (e: any) {
      notify('Ошибка удаления устройства', 'error');
    }
  };

  const handleEditPlatform = () => setEditDialogOpen(true);
  const handleEditSave = () => fetchPlatformData();

  if (loading) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Загрузка...</Typography>
      </Paper>
    );
  }

  if (!platform) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>Платформа не найдена</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/platforms')} sx={{ mr: 2 }}>
          Назад
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {platform.name}
        </Typography>
        {currentUserPlatformRole && (
          <Box sx={{ ml: 2, px: 2, py: 1, borderRadius: 2, bgcolor: '#f3f4f6' }}>
            <Typography variant="body2" color="textSecondary">
              Ваша роль: <b>{currentUserPlatformRole}</b>
            </Typography>
          </Box>
        )}
      </Box>

      <PlatformLimitsPanel 
        platform={platform} 
        isAdmin={canManagePlatform} 
        onEdit={canManagePlatform ? handleEditPlatform : () => {}} 
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label={`Пользователи (${users.length})`} />
          <Tab label={`Устройства (${devices.length})`} />
          <Tab label="Журнал" />
        </Tabs>
      </Box>

      <Box sx={{ pt: 2 }}>
        {tab === 0 && (
          <PlatformUsersTable 
            users={users} 
            onAdd={canManagePlatform ? handleAddUser : () => {}}
            onEdit={canManagePlatform ? handleEditUser : () => {}}
            onDelete={canManagePlatform ? handleDeleteUser : () => {}}
          />
        )}
        {tab === 1 && (
          <PlatformDevicesTable 
            devices={devices} 
            onAdd={canManageDevices ? handleAddDevice : () => {}}
            onDelete={canManageDevices ? handleDeleteDevice : () => {}}
          />
        )}
        {tab === 2 && <JournalPanel logs={auditLogs} platformId={platform.id} />}
      </Box>

      <PlatformEditDialog
        open={editDialogOpen}
        platform={platform}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEditSave}
      />

      <AddDeviceDialog 
        open={addDeviceDialogOpen}
        onClose={() => setAddDeviceDialogOpen(false)}
        onAdd={handleConfirmAddDevice}
      />
    </Paper>
  );
};

export default PlatformDetailsPage;
