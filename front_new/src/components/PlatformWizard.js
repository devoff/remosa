import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Button, TextField, Typography, Stepper, Step, StepLabel, Box, RadioGroup, FormControlLabel, Radio, Paper } from '@mui/material';
import { useApi } from '../lib/useApi';
import { useNotification } from './NotificationProvider';
const steps = ['Основная информация', 'Лимиты', 'Администратор'];
const PlatformWizard = ({ onComplete }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [basicInfo, setBasicInfo] = useState({ name: '', description: '' });
    const [limits, setLimits] = useState({ devices_limit: 10, sms_limit: 100 });
    const [admin, setAdmin] = useState({ user: undefined, role: 'admin' });
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const { post, get } = useApi();
    const { notify } = useNotification();
    const [submitting, setSubmitting] = useState(false);
    // Step 3: Load users for admin selection
    React.useEffect(() => {
        if (activeStep === 2 && users.length === 0 && !loadingUsers) {
            setLoadingUsers(true);
            get('/users')
                .then((data) => setUsers(data))
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
        if (onComplete)
            onComplete();
    };
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // 1. Создать платформу
            const platform = await post('/platforms', {
                name: basicInfo.name,
                description: basicInfo.description,
                devices_limit: limits.devices_limit,
                sms_limit: limits.sms_limit,
            });
            // 2. Назначить администратора
            if (admin.user) {
                await post(`/platforms/${platform.id}/users`, {
                    user_id: admin.user.id,
                    role: admin.role,
                });
            }
            notify('Платформа успешно создана!', 'success');
            if (onComplete)
                onComplete();
        }
        catch (e) {
            notify(e.message || 'Ошибка создания платформы', 'error');
        }
        finally {
            setSubmitting(false);
        }
    };
    // Step 1: Основная информация
    const Step1 = (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 2 }, children: [_jsx(TextField, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B", value: basicInfo.name, onChange: e => setBasicInfo({ ...basicInfo, name: e.target.value }), required: true, fullWidth: true }), _jsx(TextField, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", value: basicInfo.description, onChange: e => setBasicInfo({ ...basicInfo, description: e.target.value }), multiline: true, rows: 2, fullWidth: true })] }));
    // Step 2: Лимиты (таблица)
    const Step2 = (_jsx(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 2 }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', marginBottom: 16 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { textAlign: 'left', padding: 8 }, children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440" }), _jsx("th", { style: { textAlign: 'left', padding: 8 }, children: "\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435" }), _jsx("th", { style: { textAlign: 'left', padding: 8 }, children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" })] }) }), _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { style: { padding: 8 }, children: "\u041B\u0438\u043C\u0438\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" }), _jsx("td", { style: { padding: 8 }, children: _jsx("input", { type: "number", min: 1, max: 10000, value: limits.devices_limit || '', onChange: e => setLimits(l => ({ ...l, devices_limit: Number(e.target.value) })), style: { width: 100, padding: 4 } }) }), _jsx("td", { style: { padding: 8 }, children: "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043C\u043E\u0436\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043D\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443" })] }), _jsxs("tr", { children: [_jsx("td", { style: { padding: 8 }, children: "\u041B\u0438\u043C\u0438\u0442 SMS" }), _jsx("td", { style: { padding: 8 }, children: _jsx("input", { type: "number", min: 0, max: 100000, value: limits.sms_limit || '', onChange: e => setLimits(l => ({ ...l, sms_limit: Number(e.target.value) })), style: { width: 100, padding: 4 } }) }), _jsx("td", { style: { padding: 8 }, children: "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E SMS, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0432 \u043C\u0435\u0441\u044F\u0446" })] })] })] }) }));
    // Step 3: Назначение администратора
    const Step3 = (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 2 }, children: [_jsx(Typography, { children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B" }), _jsxs(TextField, { select: true, label: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C", value: admin.user?.id || '', onChange: e => {
                    const user = users.find(u => u.id === Number(e.target.value));
                    setAdmin(a => ({ ...a, user }));
                }, SelectProps: { native: true }, fullWidth: true, disabled: loadingUsers, children: [_jsx("option", { value: "", children: "\u041D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D" }), users.map(u => (_jsx("option", { value: u.id, children: u.email }, u.id)))] }), _jsxs(RadioGroup, { row: true, value: admin.role, onChange: e => setAdmin(a => ({ ...a, role: e.target.value })), children: [_jsx(FormControlLabel, { value: "admin", control: _jsx(Radio, {}), label: "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440" }), _jsx(FormControlLabel, { value: "manager", control: _jsx(Radio, {}), label: "\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440" })] }), _jsxs(Paper, { sx: { p: 2, mt: 2, background: '#f9fafb' }, children: [_jsx(Typography, { variant: "subtitle2", children: "\u0418\u0442\u043E\u0433:" }), _jsxs(Typography, { children: ["\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430: ", _jsx("b", { children: basicInfo.name })] }), _jsxs(Typography, { children: ["\u041B\u0438\u043C\u0438\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432: ", _jsx("b", { children: limits.devices_limit })] }), _jsxs(Typography, { children: ["\u041B\u0438\u043C\u0438\u0442 SMS: ", _jsx("b", { children: limits.sms_limit })] }), _jsxs(Typography, { children: ["\u0410\u0434\u043C\u0438\u043D: ", _jsx("b", { children: admin.user?.email || 'Не выбран' }), " (", admin.role, ")"] })] })] }));
    return (_jsxs(Box, { sx: { width: 400, p: 3 }, children: [_jsx(Stepper, { activeStep: activeStep, alternativeLabel: true, sx: { mb: 4 }, children: steps.map(label => (_jsx(Step, { children: _jsx(StepLabel, { children: label }) }, label))) }), activeStep === 0 && Step1, activeStep === 1 && Step2, activeStep === 2 && Step3, _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mt: 4 }, children: [_jsx(Button, { onClick: handleCancel, color: "secondary", children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), activeStep > 0 && _jsx(Button, { onClick: handleBack, children: "\u041D\u0430\u0437\u0430\u0434" }), activeStep < 2 && _jsx(Button, { onClick: handleNext, disabled: activeStep === 0 && !basicInfo.name, children: "\u0414\u0430\u043B\u0435\u0435" }), activeStep === 2 && _jsx(Button, { variant: "contained", onClick: handleSubmit, disabled: submitting || !admin.user, children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }));
};
export default PlatformWizard;
