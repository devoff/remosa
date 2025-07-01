import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Paper, Typography, Tabs, Tab, Box, Button, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useApi } from '../lib/useApi';
import { useNotification } from './NotificationProvider';
import PlatformLimitsPanel from './PlatformLimitsPanel';
import PlatformUsersTable from './PlatformUsersTable';
import PlatformDevicesTable from './PlatformDevicesTable';
import AuditLogPanel from './AuditLogPanel';
import PlatformEditDialog from './PlatformEditDialog';

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
  const [devices, setDevices] = useState<Device[]>([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { notify } = useNotification();
  const { get, post, put, remove } = useApi();

  const fetchPlatformData = async () => {
    if (!platformId) return;
    
    console.log('Fetching platform data for ID:', platformId);
    setLoading(true);
    try {
      const platformData = await get(`/platforms/${platformId}`);
      console.log('Platform data received:', platformData);
      setPlatform(platformData);
    } catch (e: any) {
      console.error('Platform fetch error details:', e);
      notify('Ошибка загрузки данных платформы', 'error');
      console.error('Platform fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!platformId) return;
    
    try {
      const usersData = await get(`/platforms/${platformId}/users`);
      setUsers(usersData);
    } catch (e: any) {
      notify('Ошибка загрузки пользователей', 'error');
      console.error('Users fetch error:', e);
    }
  };

  const fetchDevices = async () => {
    if (!platformId) return;
    
    try {
      const devicesData = await get(`/platforms/${platformId}/devices`);
      setDevices(devicesData);
    } catch (e: any) {
      notify('Ошибка загрузки устройств', 'error');
      console.error('Devices fetch error:', e);
    }
  };

  const fetchAuditLogs = async () => {
    // TODO: Реализовать загрузку аудит логов когда endpoint будет готов
    setAuditLogs([]);
  };

  useEffect(() => {
    fetchPlatformData();
  }, [platformId]);

  useEffect(() => {
    if (tab === 0) {
      fetchUsers();
    } else if (tab === 1) {
      fetchDevices();
    } else if (tab === 2) {
      fetchAuditLogs();
    }
  }, [tab, platformId]);

  const handleTabChange = (_: any, newValue: number) => setTab(newValue);

  const handleAddUser = async (userData: { user_id: number; role: string }) => {
    try {
      await post(`/platforms/${platformId}/users`, userData);
      notify('Пользователь добавлен в платформу', 'success');
      fetchUsers();
    } catch (e: any) {
      notify('Ошибка добавления пользователя', 'error');
    }
  };

  const handleEditUser = async (userId: number, roleData: { role: string }) => {
    try {
      await put(`/platforms/${platformId}/users/${userId}`, roleData);
      notify('Роль пользователя обновлена', 'success');
      fetchUsers();
    } catch (e: any) {
      notify('Ошибка обновления роли', 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await remove(`/platforms/${platformId}/users/${userId}`);
      notify('Пользователь удален из платформы', 'success');
      fetchUsers();
    } catch (e: any) {
      notify('Ошибка удаления пользователя', 'error');
    }
  };

  const handleEditPlatform = () => {
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    fetchPlatformData(); // Перезагружаем данные платформы после редактирования
  };

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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/platforms')}
          sx={{ mr: 2 }}
        >
          Назад
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {platform.name}
        </Typography>
      </Box>

      <PlatformLimitsPanel 
        platform={platform} 
        isAdmin={true} 
        onEdit={handleEditPlatform} 
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label={`Пользователи (${users.length})`} />
          <Tab label={`Устройства (${devices.length})`} />
          <Tab label="Аудит" />
        </Tabs>
      </Box>

      <Box sx={{ pt: 2 }}>
        {tab === 0 && (
          <PlatformUsersTable 
            users={users} 
            onAdd={handleAddUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        )}
        {tab === 1 && (
          <PlatformDevicesTable 
            devices={devices} 
            onAdd={() => notify('Добавление устройств в разработке', 'info')}
            onDelete={() => notify('Удаление устройств в разработке', 'info')}
          />
        )}
        {tab === 2 && <AuditLogPanel logs={auditLogs} />}
      </Box>

      <PlatformEditDialog
        open={editDialogOpen}
        platform={platform}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleEditSave}
      />
    </Paper>
  );
};

export default PlatformDetailsPage;
