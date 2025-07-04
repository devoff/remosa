import React, { useState, useEffect, ChangeEvent } from 'react';
import type { FC } from 'react';
import type { DialogProps } from '@mui/material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  Box,
  Typography,
  LinearProgress,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../lib/useAuth';
import apiClient from '../lib/api';
import { Platform, Device as GlobalDevice } from '../types';
import { canAddDevice, getPlatformRole } from '../utils/roleUtils';

interface AddDeviceDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (deviceData: { name: string; description?: string; phone: string; model?: string; platform_id?: number }) => void;
  device?: GlobalDevice | null;
}

interface PlatformLimits {
  platform_id: number;
  platform_name: string;
  devices: {
    current: number;
    limit: number;
    available: number;
    usage_percentage: number;
  };
  sms: {
    current: number;
    limit: number;
    available: number;
    usage_percentage: number;
  };
}

const AddDeviceDialog: FC<AddDeviceDialogProps> = ({ open, onClose, onAdd, device }) => {
  const { token, currentPlatform, isSuperAdmin, user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [model, setModel] = useState('');
  const [platformLimits, setPlatformLimits] = useState<PlatformLimits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(currentPlatform);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const canAdd = canAddDevice(user, selectedPlatform);

  // Загрузка всех платформ для super admin
  useEffect(() => {
    if (isSuperAdmin && open) {
      apiClient.get('/platforms/').then((res: { data: Platform[] }) => {
        setPlatforms(res.data);
        // Если открыли диалог или platforms обновились, выбрать первую платформу если не выбрано
        if ((!selectedPlatform || !res.data.find((p: Platform) => p.id === selectedPlatform.id)) && res.data.length > 0) {
          setSelectedPlatform(res.data[0]);
        }
      });
    } else {
      setSelectedPlatform(currentPlatform);
    }
  }, [isSuperAdmin, open, currentPlatform]);

  useEffect(() => {
    if (open && selectedPlatform && token) {
      loadPlatformLimits(selectedPlatform.id);
    }
  }, [open, selectedPlatform, token]);

  // Fetch available device models from /command_templates/ on open
  useEffect(() => {
    if (open) {
      apiClient.get('/command_templates/').then(res => {
        const models = Array.from(new Set(res.data.map((t: any) => String(t.model)).filter(Boolean))) as string[];
        setAvailableModels(models);
      });
    }
  }, [open]);

  useEffect(() => {
    if (device) {
      setName(device.name || '');
      setDescription(device.description || '');
      setPhone(device.phone || '');
      setModel(device.model || '');
      if (device.platform_id) {
        setSelectedPlatform(platforms.find(p => p.id === device.platform_id) || null);
      }
    } else {
      setName('');
      setDescription('');
      setPhone('');
      setModel('');
      setSelectedPlatform(currentPlatform);
    }
  }, [device, open]);

  const loadPlatformLimits = async (platformId: number) => {
    if (!platformId || !token) return;
    try {
      const response = await apiClient.get(`/platforms/${platformId}/limits`);
      setPlatformLimits(response.data);
    } catch (error) {
      console.error('Ошибка загрузки лимитов:', error);
      setError('Ошибка загрузки лимитов платформы');
    }
  };

  const handleAddClick = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Название и телефон обязательны для заполнения');
      return;
    }
    if (!selectedPlatform) {
      setError('Не указана платформа для устройства');
      return;
    }
    if (platformLimits && platformLimits.devices.limit && platformLimits.devices.available <= 0) {
      setError('Достигнут лимит устройств для этой платформы');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const deviceData = {
        name: name.trim(),
        description: description.trim(),
        phone: phone.trim(),
        model: model.trim(),
        platform_id: selectedPlatform.id
      };
      await onAdd(deviceData);
      handleCloseDialog();
      loadPlatformLimits(selectedPlatform.id);
    } catch (error) {
      setError('Ошибка при сохранении устройства');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setName('');
    setDescription('');
    setPhone('');
    setModel('');
    setError(null);
    setLoading(false);
    setSelectedPlatform(currentPlatform);
    onClose();
  };

  const isFormValid = name.trim() && phone.trim() && !loading;
  const isLimitReached = platformLimits && platformLimits.devices.limit && platformLimits.devices.available <= 0;

  return (
    <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить новое устройство</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Введите данные нового устройства. Название и телефон обязательны для заполнения.
        </DialogContentText>
        {isSuperAdmin && (
          <TextField
            select
            margin="dense"
            id="platform"
            label="Платформа"
            fullWidth
            value={selectedPlatform ? selectedPlatform.id : ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const plat = platforms.find((p: Platform) => p.id === Number(e.target.value));
              setSelectedPlatform(plat || null);
            }}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {platforms.map((platform: Platform) => (
              <MenuItem key={platform.id} value={platform.id}>
                {platform.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        {platformLimits && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Лимиты платформы "{platformLimits.platform_name}"
            </Typography>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">
                Устройства: {platformLimits.devices.current} / {platformLimits.devices.limit || '∞'}
                {platformLimits.devices.limit && (
                  <span style={{ color: platformLimits.devices.available <= 0 ? 'red' : 'inherit' }}>
                    {' '}(доступно: {platformLimits.devices.available})
                  </span>
                )}
              </Typography>
              {platformLimits.devices.limit && (
                <LinearProgress 
                  variant="determinate" 
                  value={platformLimits.devices.usage_percentage} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'grey.300',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: platformLimits.devices.usage_percentage > 90 ? 'error.main' : 
                                     platformLimits.devices.usage_percentage > 70 ? 'warning.main' : 'success.main'
                    }
                  }}
                />
              )}
            </Box>
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {!canAdd && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            У вас нет прав на добавление устройств в эту платформу.
          </Alert>
        )}
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Название устройства"
          type="text"
          fullWidth
          variant="standard"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          required
          disabled={loading || Boolean(isLimitReached) || !canAdd}
        />
        <TextField
          margin="dense"
          id="phone"
          label="Телефон"
          type="tel"
          fullWidth
          variant="standard"
          value={phone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          required
          placeholder="+7XXXXXXXXXX"
          disabled={loading || Boolean(isLimitReached) || !canAdd}
        />
        <TextField
          select
          margin="dense"
          id="model"
          label="Модель устройства"
          fullWidth
          variant="standard"
          value={model}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setModel(e.target.value)}
          disabled={loading || Boolean(isLimitReached) || !canAdd || availableModels.length === 0}
        >
          {availableModels.map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </TextField>
        <TextField
          margin="dense"
          id="description"
          label="Описание"
          type="text"
          fullWidth
          variant="standard"
          value={description}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          disabled={loading || Boolean(isLimitReached) || !canAdd}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} disabled={loading}>
          Отмена
        </Button>
        <Button 
          onClick={handleAddClick} 
          disabled={!isFormValid || loading || Boolean(isLimitReached) || !canAdd}
          variant="contained"
        >
          {loading ? 'Добавление...' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddDeviceDialog; 