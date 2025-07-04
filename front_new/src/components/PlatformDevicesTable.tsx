import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Button, Chip, Typography, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface Device {
  id: number;
  name: string;
  description?: string;
  status: string;
  last_update?: string;
  created_at: string;
  model?: string;
  phone?: string;
}

interface PlatformDevicesTableProps {
  devices: Device[];
  onAdd: () => void;
  onDelete: (id: number) => void;
}

const PlatformDevicesTable: React.FC<PlatformDevicesTableProps> = ({ devices, onAdd, onDelete }) => {
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

  const handleDeleteDevice = (deviceId: number) => {
    if (window.confirm('Удалить устройство из платформы?')) {
      onDelete(deviceId);
    }
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
          Добавить устройство
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd} sx={{ mb: 2 }}>
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
            {devices.map((device) => (
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
                  <IconButton size="small" title="Просмотр">
                    <VisibilityIcon />
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
    </>
  );
};

export default PlatformDevicesTable;
