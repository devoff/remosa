import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Typography,
  TextField,
  MenuItem,
  Button
} from '@mui/material';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CommandTemplateDialog from './CommandTemplateDialog';
import { useApi } from '../lib/useApi';
import { CommandTemplate, CommandTemplateCreate } from '../types';
import { useAuth } from '../lib/useAuth';
import { useNotification } from './NotificationProvider';

interface CommandTemplateFormValues extends Omit<CommandTemplateCreate, 'params_schema'> {
  params_schema: string;
}

const CommandTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<CommandTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<CommandTemplate | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const api = useApi();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const { notify } = useNotification();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/command_templates/');
      const templatesData = Array.isArray(response) ? response : [];
      setTemplates(templatesData);
    } catch (error) {
      notify('Не удалось загрузить шаблоны команд', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const uniqueModels = useMemo(() => {
    const models = templates.map((t: CommandTemplate) => t.model).filter(Boolean);
    return Array.from(new Set(models as string[]));
  }, [templates]);

  const filteredTemplates = templates.filter((t: CommandTemplate) => {
    if (!selectedModel || t.model !== selectedModel) return false;
    if (search && !(
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
    )) return false;
    return true;
  });

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleDialogSave = async (values: any) => {
    try {
      const parsedSchema = JSON.parse(values.params_schema);
      const payload: CommandTemplate = { ...values, params_schema: parsedSchema };
      if (editingTemplate) {
        await api.put(`/command_templates/${editingTemplate.id}`, payload);
        notify('Шаблон успешно обновлен', 'success');
      } else {
        await api.post('/command_templates/', payload);
        notify('Шаблон успешно создан', 'success');
      }
      setDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      notify('Ошибка сохранения. Проверьте JSON схемы параметров.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить шаблон команды?')) return;
    try {
      await api.remove(`/command_templates/${id}`);
      notify('Шаблон команды успешно удален', 'success');
      fetchTemplates();
    } catch (error) {
      notify('Не удалось удалить шаблон команды', 'error');
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Загрузка шаблонов команд...</Typography>
      </Paper>
    );
  }

  if (!selectedModel) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>Выберите модель устройства</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Модель</TableCell>
                <TableCell>Количество шаблонов</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uniqueModels.map((m: string) => (
                <TableRow key={m} hover>
                  <TableCell>{m}</TableCell>
                  <TableCell>{templates.filter(t => t.model === m).length}</TableCell>
                  <TableCell>
                    <Button variant="outlined" onClick={() => setSelectedModel(m)}>Показать шаблоны</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">Шаблоны команд для модели: {selectedModel}</Typography>
        <Box>
          <Button variant="outlined" sx={{ mr: 2 }} onClick={() => setSelectedModel('')}>Назад к моделям</Button>
          {isSuperAdmin && (
            <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => { setEditingTemplate(null); setDialogOpen(true); }}>
              Добавить шаблон
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Поиск по названию/категории"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
        />
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Категория</TableCell>
              <TableCell>Подкатегория</TableCell>
              <TableCell>Название</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Текст шаблона</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTemplates.map((t: CommandTemplate) => (
              <TableRow key={t.id} hover>
                <TableCell>{t.category}</TableCell>
                <TableCell>{t.subcategory}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell style={{ maxWidth: 250, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{t.template}</TableCell>
                <TableCell>
                  {isSuperAdmin && (
                    <>
                      <Button size="small" onClick={() => { setEditingTemplate(t); setDialogOpen(true); }}><EditOutlined /></Button>
                      <Button size="small" color="error" onClick={() => handleDelete(t.id)}><DeleteOutlined /></Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <CommandTemplateDialog
        open={dialogOpen}
        template={editingTemplate}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
      />
    </Paper>
  );
};

export default CommandTemplatesPage; 