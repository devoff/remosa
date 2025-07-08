import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { useApi } from '../lib/useApi';
import { useNotification } from './NotificationProvider';

interface Platform {
  id: number;
  name: string;
  description?: string;
  devices_limit?: number;
  sms_limit?: number;
  created_at: string;
  updated_at?: string;
}

interface PlatformEditDialogProps {
  open: boolean;
  platform: Platform | null;
  onClose: () => void;
  onSave: () => void;
}

const PlatformEditDialog: React.FC<PlatformEditDialogProps> = ({
  open,
  platform,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    devices_limit: '',
    sms_limit: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { put } = useApi();
  const { notify } = useNotification();

  useEffect(() => {
    if (platform) {
      setFormData({
        name: platform.name,
        description: platform.description || '',
        devices_limit: platform.devices_limit?.toString() || '',
        sms_limit: platform.sms_limit?.toString() || ''
      });
      setErrors({});
    }
  }, [platform]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название платформы обязательно';
    }

    if (formData.devices_limit && (isNaN(Number(formData.devices_limit)) || Number(formData.devices_limit) < 0)) {
      newErrors.devices_limit = 'Лимит устройств должен быть положительным числом';
    }

    if (formData.sms_limit && (isNaN(Number(formData.sms_limit)) || Number(formData.sms_limit) < 0)) {
      newErrors.sms_limit = 'Лимит SMS должен быть положительным числом';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !platform) return;

    setLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        devices_limit: formData.devices_limit ? Number(formData.devices_limit) : null,
        sms_limit: formData.sms_limit ? Number(formData.sms_limit) : null
      };

      await put(`/platforms/${platform.id}`, updateData);
      notify('Платформа успешно обновлена', 'success');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error updating platform:', error);
      if (error.response?.data?.detail) {
        notify(`Ошибка: ${error.response.data.detail}`, 'error');
      } else {
        notify('Ошибка при обновлении платформы', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!platform) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Редактировать платформу</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Название платформы"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Описание"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Описание платформы (необязательно)"
          />

          <TextField
            fullWidth
            label="Лимит устройств"
            value={formData.devices_limit}
            onChange={(e) => handleInputChange('devices_limit', e.target.value)}
            error={!!errors.devices_limit}
            helperText={errors.devices_limit || 'Оставьте пустым для снятия ограничений'}
            margin="normal"
            type="number"
            inputProps={{ min: 0 }}
          />

          <TextField
            fullWidth
            label="Лимит SMS"
            value={formData.sms_limit}
            onChange={(e) => handleInputChange('sms_limit', e.target.value)}
            error={!!errors.sms_limit}
            helperText={errors.sms_limit || 'Оставьте пустым для снятия ограничений'}
            margin="normal"
            type="number"
            inputProps={{ min: 0 }}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Текущие настройки:</strong><br />
              Устройств: {platform.devices_limit ? `${platform.devices_limit}` : 'Без ограничений'}<br />
              SMS: {platform.sms_limit ? `${platform.sms_limit}` : 'Без ограничений'}
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlatformEditDialog; 