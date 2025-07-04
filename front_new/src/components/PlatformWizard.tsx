import React, { useState } from 'react';
import { Button, TextField, Typography, Stepper, Step, StepLabel, Box, Slider, Tooltip, RadioGroup, FormControlLabel, Radio, Paper } from '@mui/material';
import { useApi } from '../lib/useApi';
import { useNotification } from './NotificationProvider';

interface BasicInfo {
  name: string;
  description: string;
}
interface LimitsInfo {
  devices_limit?: number;
  sms_limit?: number;
}
interface User {
  id: number;
  email: string;
}
interface CompleteForm extends BasicInfo, LimitsInfo {
  admin_id?: number;
  admin_role?: string;
}

const steps = ['Основная информация', 'Лимиты', 'Администратор'];

const PlatformWizard: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({ name: '', description: '' });
  const [limits, setLimits] = useState<LimitsInfo>({ devices_limit: 10, sms_limit: 100 });
  const [admin, setAdmin] = useState<{ user?: User; role: string }>({ user: undefined, role: 'admin' });
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { post, get } = useApi();
  const { notify } = useNotification();
  const [submitting, setSubmitting] = useState(false);

  // Step 3: Load users for admin selection
  React.useEffect(() => {
    if (activeStep === 2 && users.length === 0 && !loadingUsers) {
      setLoadingUsers(true);
      get('/users/')
        .then((data: User[]) => setUsers(data))
        .catch(() => notify('Ошибка загрузки пользователей', 'error'))
        .finally(() => setLoadingUsers(false));
    }
  }, [activeStep, get, notify, users.length, loadingUsers]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleCancel = () => {
    setActiveStep(0);
    setBasicInfo({ name: '', description: '' });
    setLimits({ devices_limit: 10, sms_limit: 100 });
    setAdmin({ user: undefined, role: 'admin' });
    if (onComplete) onComplete();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Создать платформу
      const platform = await post('/platforms/', {
        name: basicInfo.name,
        description: basicInfo.description,
        devices_limit: limits.devices_limit,
        sms_limit: limits.sms_limit,
      });
      // 2. Назначить администратора
      if (admin.user) {
        await post(`/platforms/${platform.id}/users/`, {
          user_id: admin.user.id,
          role: admin.role,
        });
      }
      notify('Платформа успешно создана!', 'success');
      if (onComplete) onComplete();
    } catch (e: any) {
      notify(e.message || 'Ошибка создания платформы', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Основная информация
  const Step1 = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Название платформы"
        value={basicInfo.name}
        onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
        required
        fullWidth
      />
      <TextField
        label="Описание (необязательно)"
        value={basicInfo.description}
        onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })}
        multiline
        rows={2}
        fullWidth
      />
    </Box>
  );

  // Step 2: Лимиты (таблица)
  const Step2 = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>Параметр</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Значение</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Описание</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: 8 }}>Лимит устройств</td>
            <td style={{ padding: 8 }}>
              <input
                type="number"
                min={1}
                max={10000}
                value={limits.devices_limit || ''}
                onChange={e => setLimits(l => ({ ...l, devices_limit: Number(e.target.value) }))}
                style={{ width: 100, padding: 4 }}
              />
            </td>
            <td style={{ padding: 8 }}>Максимальное количество устройств, которые можно добавить на платформу</td>
          </tr>
          <tr>
            <td style={{ padding: 8 }}>Лимит SMS</td>
            <td style={{ padding: 8 }}>
              <input
                type="number"
                min={0}
                max={100000}
                value={limits.sms_limit || ''}
                onChange={e => setLimits(l => ({ ...l, sms_limit: Number(e.target.value) }))}
                style={{ width: 100, padding: 4 }}
              />
            </td>
            <td style={{ padding: 8 }}>Максимальное количество SMS, которые можно отправить в месяц</td>
          </tr>
        </tbody>
      </table>
    </Box>
  );

  // Step 3: Назначение администратора
  const Step3 = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography>Выберите администратора платформы</Typography>
      <TextField
        select
        label="Пользователь"
        value={admin.user?.id || ''}
        onChange={e => {
          const user = users.find(u => u.id === Number(e.target.value));
          setAdmin(a => ({ ...a, user }));
        }}
        SelectProps={{ native: true }}
        fullWidth
        disabled={loadingUsers}
      >
        <option value="">Не выбран</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.email}</option>
        ))}
      </TextField>
      <RadioGroup
        row
        value={admin.role}
        onChange={e => setAdmin(a => ({ ...a, role: e.target.value }))}
      >
        <FormControlLabel value="admin" control={<Radio />} label="Администратор" />
        <FormControlLabel value="manager" control={<Radio />} label="Менеджер" />
      </RadioGroup>
      <Paper sx={{ p: 2, mt: 2, background: '#f9fafb' }}>
        <Typography variant="subtitle2">Итог:</Typography>
        <Typography>Платформа: <b>{basicInfo.name}</b></Typography>
        <Typography>Лимит устройств: <b>{limits.devices_limit}</b></Typography>
        <Typography>Лимит SMS: <b>{limits.sms_limit}</b></Typography>
        <Typography>Админ: <b>{admin.user?.email || 'Не выбран'}</b> ({admin.role})</Typography>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ width: 400, p: 3 }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === 0 && Step1}
      {activeStep === 1 && Step2}
      {activeStep === 2 && Step3}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={handleCancel} color="secondary">Отмена</Button>
        {activeStep > 0 && <Button onClick={handleBack}>Назад</Button>}
        {activeStep < 2 && <Button onClick={handleNext} disabled={activeStep === 0 && !basicInfo.name}>Далее</Button>}
        {activeStep === 2 && <Button variant="contained" onClick={handleSubmit} disabled={submitting || !admin.user}>Создать</Button>}
      </Box>
    </Box>
  );
};

export default PlatformWizard; 