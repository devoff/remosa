import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Button, Chip, Typography, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeviceFormModal from './Monitoring/DeviceFormModal';
import { useAuth } from '../lib/useAuth';
import apiClient from '../lib/api';
import type { Device as GlobalDevice, DeviceStatus } from '../types';

type Device = GlobalDevice;

interface PlatformDevicesTableProps {
  devices: Device[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const PlatformDevicesTable: React.FC<PlatformDevicesTableProps> = ({ devices, onAdd, onDelete }) => {
  const [editDevice, setEditDevice] = React.useState<Device | null>(null);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);
  const { currentPlatform } = useAuth();
  const [deviceList, setDeviceList] = React.useState<Device[]>(devices);

  React.useEffect(() => {
    // Fetch models for dropdown
    import('../lib/api').then(({ default: apiClient }) => {
      apiClient.get('/command_templates/').then(res => {
        const models = Array.from(new Set(res.data.map((t: any) => String(t.model)).filter(Boolean))) as string[];
        setAvailableModels(models);
      });
    });
  }, []);

  React.useEffect(() => { setDeviceList(devices); }, [devices]);

  const getStatusColor = (status: string) => {
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteDevice = (deviceId: string) => {
    if (window.confirm('Удалить устройство из платформы?')) {
      onDelete(deviceId);
    }
  };

  const handleEditDevice = (device: Device) => {
    setEditDevice(device);
    setAddModalOpen(false); // Закрыть окно добавления, если оно вдруг открыто
  };
  const handleSaveEditDevice = async (updated: Device) => {
    setEditDevice(null);
    // fallback: если platform_id не пришёл из формы, взять из оригинального устройства
    const original = deviceList.find(d => d.id === updated.id);
    const platform_id = updated.platform_id || original?.platform_id;
    if (!platform_id) return;
    try {
      // Объединить оригинальные данные и изменения, platform_id всегда актуальный
      const payload = { ...original, ...updated, platform_id };
      await apiClient.put(`/platforms/${platform_id}/devices/${payload.id}/`, payload);
      // Обновить список устройств после успешного редактирования
      const res = await apiClient.get(`/platforms/${platform_id}/devices/`);
      setDeviceList(res.data);
    } catch (e) { alert('Ошибка при сохранении изменений устройства'); }
  };
  const handleAddDevice = () => {
    setAddModalOpen(true);
  };
  const handleSaveAddDevice = async (newDevice: Device) => {
    setAddModalOpen(false);
    if (!currentPlatform) return;
    try {
      await apiClient.post(`/platforms/${currentPlatform.id}/devices/`, newDevice);
      // Обновить список устройств после успешного добавления
      const res = await apiClient.get(`/platforms/${currentPlatform.id}/devices/`);
      setDeviceList(res.data);
    } catch (e) { alert('Ошибка при добавлении устройства'); }
  };

  if (devices.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Нет устройств в платформе
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Добавьте устройства для управления ими через эту платформу
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddDevice}>
          Добавить устройство
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddDevice} sx={{ mb: 2 }}>
        Добавить устройство
      </Button>
      
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Модель</TableCell>
              <TableCell>Телефон</TableCell>
              <TableCell>Последнее обновление</TableCell>
              <TableCell>Создано</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deviceList.map((device) => (
              <TableRow key={device.id} hover>
                <TableCell>
                  <Typography variant="subtitle2">{device.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {device.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={device.status} 
                    color={getStatusColor(device.status) as any} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{device.model || '-'}</TableCell>
                <TableCell>{device.phone || '-'}</TableCell>
                <TableCell>{formatDate(device.last_update)}</TableCell>
                <TableCell>{formatDate(device.created_at)}</TableCell>
                <TableCell>
                  <IconButton size="small" title="Редактировать" onClick={() => handleEditDevice(device)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDeleteDevice(device.id)}
                    title="Удалить"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {editDevice && (
        <DeviceFormModal
          device={editDevice}
          availableModels={availableModels}
          onSave={handleSaveEditDevice}
          onClose={() => setEditDevice(null)}
        />
      )}
      {addModalOpen && (
        <DeviceFormModal
          device={null}
          availableModels={availableModels}
          onSave={handleSaveAddDevice}
          onClose={() => setAddModalOpen(false)}
        />
      )}
    </>
  );
};

export default PlatformDevicesTable;
