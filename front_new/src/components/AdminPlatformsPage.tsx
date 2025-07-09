import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../lib/useApi';
import { useNotification } from './NotificationProvider';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Typography, LinearProgress, Chip, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import PlatformWizard from './PlatformWizard';
import { useAuth } from '../lib/useAuth';

interface Platform {
  id: number;
  name: string;
  description?: string;
  devices_limit?: number;
  sms_limit?: number;
  devices_count?: number;
  sms_count?: number;
}

const AdminPlatformsPage: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [openWizard, setOpenWizard] = useState(false);
  const [editPlatform, setEditPlatform] = useState<Platform | null>(null);
  const [form, setForm] = useState({ name: '', description: '', devices_limit: '', sms_limit: '' });
  
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { get, post, put, remove } = useApi();
  const { user } = useAuth();

  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (user?.role === 'superadmin') {
        data = await get('/platforms');
      } else {
        data = await get('/platforms/my-platforms');
      }
      setPlatforms(data);
    } catch (e: any) {
      notify(e.message || 'Ошибка загрузки платформ', 'error');
    } finally {
      setLoading(false);
    }
  }, [get, notify, user]);

  useEffect(() => { 
    fetchPlatforms(); 
  }, [fetchPlatforms]);

  const handleOpenDialog = (platform?: Platform) => {
    setEditPlatform(platform || null);
    setForm({
      name: platform?.name || '',
      description: platform?.description || '',
      devices_limit: platform?.devices_limit?.toString() || '',
      sms_limit: platform?.sms_limit?.toString() || '',
    });
  };

  const handleCloseDialog = () => {
    setEditPlatform(null);
    setForm({ name: '', description: '', devices_limit: '', sms_limit: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        devices_limit: form.devices_limit ? Number(form.devices_limit) : undefined,
        sms_limit: form.sms_limit ? Number(form.sms_limit) : undefined,
      };

      if (editPlatform) {
        await put(`/platforms/${editPlatform.id}`, payload);
        notify('Платформа обновлена', 'success');
      } else {
        await post('/platforms', payload);
        notify('Платформа создана', 'success');
      }
      
      handleCloseDialog();
      fetchPlatforms();
    } catch (e: any) {
      notify(e.message || 'Ошибка сохранения', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить платформу?')) return;
    try {
      await remove(`/platforms/${id}`);
      notify('Платформа удалена', 'success');
      fetchPlatforms();
    } catch (e: any) {
      // Извлекаем детальное сообщение об ошибке из ответа API
      const errorMessage = e.response?.data?.detail || e.message || 'Ошибка удаления платформы';
      notify(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Загрузка платформ...</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Платформы
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenWizard(true)}>
        Создать платформу
      </Button>
      <TableContainer sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Лимит устройств</TableCell>
              <TableCell>Лимит SMS</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {platforms.map((p: Platform) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/platforms/${p.id}`)}>{p.name}</TableCell>
                <TableCell>{p.description || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="body2" color="textSecondary">
                      {p.devices_limit ? `до ${p.devices_limit}` : '—'}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={p.devices_limit && p.devices_count !== undefined ? Math.min(100, (p.devices_count / p.devices_limit) * 100) : 0} 
                      sx={{ height: 6, borderRadius: 2, mt: 0.5 }} 
                    />
                    <Typography variant="caption" color="textSecondary">
                      {p.devices_count !== undefined && p.devices_limit ? `${p.devices_count} / ${p.devices_limit}` : ''}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="body2" color="textSecondary">
                      {p.sms_limit ? `до ${p.sms_limit}` : '—'}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={p.sms_limit && p.sms_count !== undefined ? Math.min(100, (p.sms_count / p.sms_limit) * 100) : 0} 
                      sx={{ height: 6, borderRadius: 2, mt: 0.5, bgcolor: '#e0e7ef' }} 
                      color="secondary" 
                    />
                    <Typography variant="caption" color="textSecondary">
                      {p.sms_count !== undefined && p.sms_limit ? `${p.sms_count} / ${p.sms_limit}` : ''}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label="Активна" color="success" size="small" />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(p)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(p.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openWizard} onClose={() => setOpenWizard(false)}>
        <DialogTitle>Создать платформу</DialogTitle>
        <DialogContent>
          <PlatformWizard onComplete={() => { setOpenWizard(false); fetchPlatforms(); }} />
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default AdminPlatformsPage;
