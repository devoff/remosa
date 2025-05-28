import React from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';

interface Device {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

interface DeviceCardProps {
  device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          {device.name}
        </Typography>
        <Chip 
          label={device.status}
          color={device.status === 'active' ? 'success' : 'error'}
          sx={{ mb: 1 }}
        />
        <Typography color="text.secondary">
          ID: {device.id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Создано: {new Date(device.created_at).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DeviceCard; 
import React from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';

interface Device {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

interface DeviceCardProps {
  device: Device;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent>
        <Typography gutterBottom variant="h6" component="div">
          {device.name}
        </Typography>
        <Chip 
          label={device.status} 
          color={getStatusColor(device.status)}
          size="small"
          sx={{ mb: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          ID: {device.id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Создано: {new Date(device.created_at).toLocaleDateString('ru-RU')}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
