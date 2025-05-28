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