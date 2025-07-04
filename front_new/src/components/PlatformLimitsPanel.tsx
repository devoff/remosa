import React from 'react';
import { Card, CardContent, Typography, Button, Grid, Box, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DevicesIcon from '@mui/icons-material/Devices';
import SmsIcon from '@mui/icons-material/Sms';
import InfoIcon from '@mui/icons-material/Info';

interface Platform {
  id: number;
  name: string;
  description?: string;
  devices_limit?: number;
  sms_limit?: number;
  created_at: string;
  updated_at?: string;
}

interface PlatformLimitsPanelProps {
  platform: Platform;
  isAdmin: boolean;
  onEdit: () => void;
}

const PlatformLimitsPanel: React.FC<PlatformLimitsPanelProps> = ({ platform, isAdmin, onEdit }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Информация о платформе
            </Typography>
            {platform.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {platform.description}
              </Typography>
            )}
          </Box>
          {isAdmin && (
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />} 
              onClick={onEdit}
            >
              Редактировать
            </Button>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DevicesIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Лимит устройств</Typography>
            </Box>
            <Chip 
              label={platform.devices_limit ? `${platform.devices_limit} устройств` : 'Без ограничений'} 
              color={platform.devices_limit ? 'primary' : 'default'}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SmsIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Лимит SMS</Typography>
            </Box>
            <Chip 
              label={platform.sms_limit ? `${platform.sms_limit} SMS` : 'Без ограничений'} 
              color={platform.sms_limit ? 'warning' : 'default'}
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="body2" color="text.secondary">
                Создана: {formatDate(platform.created_at)}
              </Typography>
            </Box>
          </Grid>

          {platform.updated_at && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Обновлена: {formatDate(platform.updated_at)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PlatformLimitsPanel;
