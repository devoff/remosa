import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../lib/useApi';
import { useNotification } from './NotificationProvider';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

interface Platform {
  id: number;
  name: string;
  description?: string;
  devices_limit?: number;
  sms_limit?: number;
}

const AdminPlatformsPage: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editPlatform, setEditPlatform] = useState<Platform | null>(null);
  const [form, setForm] = useState({ name: '', description: '', devices_limit: '', sms_limit: '' });
  
  const { notify } = useNotification();
  const navigate = useNavigate();
  const { get, post, put, remove } = useApi();

  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get('/platforms/');
      setPlatforms(data);
    } catch (e: any) {
      notify(e.message || 'Ошибка загрузки платформ', 'error');
    } finally {
      setLoading(false);
    }
  }, [get, notify]);

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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
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
        await post('/platforms/', payload);
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
      notify(e.message || 'Ошибка удаления', 'error');
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
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
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
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {platforms.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/platforms/${p.id}`)}>{p.name}</TableCell>
                <TableCell>{p.description || '-'}</TableCell>
                <TableCell>{p.devices_limit ?? '-'}</TableCell>
                <TableCell>{p.sms_limit ?? '-'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(p)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(p.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editPlatform ? 'Редактировать платформу' : 'Создать платформу'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300, pt: '20px !important' }}>
          <TextField label="Название" name="name" value={form.name} onChange={handleChange} fullWidth required />
          <TextField label="Описание" name="description" value={form.description} onChange={handleChange} fullWidth multiline rows={2} />
          <TextField label="Лимит устройств" name="devices_limit" value={form.devices_limit} onChange={handleChange} type="number" fullWidth />
          <TextField label="Лимит SMS" name="sms_limit" value={form.sms_limit} onChange={handleChange} type="number" fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button onClick={handleSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdminPlatformsPage;
