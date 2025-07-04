import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import { CommandTemplate } from '../types';

interface CommandTemplateDialogProps {
  open: boolean;
  template: CommandTemplate | null;
  onClose: () => void;
  onSave: (values: any) => void;
}

const CommandTemplateDialog: React.FC<CommandTemplateDialogProps> = ({ open, template, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: '',
    category: '',
    subcategory: '',
    description: '',
    model: '',
    params_schema: '',
    template: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name || '',
        category: template.category || '',
        subcategory: template.subcategory || '',
        description: template.description || '',
        model: template.model || '',
        params_schema: JSON.stringify(template.params_schema, null, 2) || '',
        template: template.template || '',
      });
    } else {
      setForm({
        name: '',
        category: '',
        subcategory: '',
        description: '',
        model: '',
        params_schema: '',
        template: '',
      });
    }
    setErrors({});
  }, [template, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.name) newErrors.name = 'Название обязательно';
    if (!form.category) newErrors.category = 'Категория обязательна';
    if (!form.model) newErrors.model = 'Модель обязательна';
    if (!form.template) newErrors.template = 'Текст шаблона обязателен';
    if (!form.params_schema) newErrors.params_schema = 'Схема параметров обязательна';
    else {
      try {
        JSON.parse(form.params_schema);
      } catch {
        newErrors.params_schema = 'Некорректный JSON';
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSave({ ...form });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{template ? 'Редактировать шаблон' : 'Добавить шаблон'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Название"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
          />
          <TextField
            label="Категория"
            name="category"
            value={form.category}
            onChange={handleChange}
            error={!!errors.category}
            helperText={errors.category}
            fullWidth
          />
          <TextField
            label="Подкатегория"
            name="subcategory"
            value={form.subcategory}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Описание"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Модель"
            name="model"
            value={form.model}
            onChange={handleChange}
            error={!!errors.model}
            helperText={errors.model}
            fullWidth
          />
          <TextField
            label="Схема параметров (JSON)"
            name="params_schema"
            value={form.params_schema}
            onChange={handleChange}
            error={!!errors.params_schema}
            helperText={errors.params_schema}
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            label="Текст шаблона команды"
            name="template"
            value={form.template}
            onChange={handleChange}
            error={!!errors.template}
            helperText={errors.template}
            fullWidth
            multiline
            minRows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        <Button onClick={handleSubmit} variant="contained">Сохранить</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommandTemplateDialog; 