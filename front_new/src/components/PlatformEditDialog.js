import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography, Alert } from '@mui/material';
import { useApi } from '../lib/useApi';
import { useNotification } from './NotificationProvider';
const PlatformEditDialog = ({ open, platform, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        devices_limit: '',
        sms_limit: ''
    });
    const [errors, setErrors] = useState({});
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
        const newErrors = {};
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
        if (!validateForm() || !platform)
            return;
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
        }
        catch (error) {
            console.error('Error updating platform:', error);
            if (error.response?.data?.detail) {
                notify(`Ошибка: ${error.response.data.detail}`, 'error');
            }
            else {
                notify('Ошибка при обновлении платформы', 'error');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };
    if (!platform)
        return null;
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443" }), _jsx(DialogContent, { children: _jsxs(Box, { sx: { pt: 1 }, children: [_jsx(TextField, { fullWidth: true, label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B", value: formData.name, onChange: (e) => handleInputChange('name', e.target.value), error: !!errors.name, helperText: errors.name, margin: "normal", required: true }), _jsx(TextField, { fullWidth: true, label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", value: formData.description, onChange: (e) => handleInputChange('description', e.target.value), margin: "normal", multiline: true, rows: 3, placeholder: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)" }), _jsx(TextField, { fullWidth: true, label: "\u041B\u0438\u043C\u0438\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432", value: formData.devices_limit, onChange: (e) => handleInputChange('devices_limit', e.target.value), error: !!errors.devices_limit, helperText: errors.devices_limit || 'Оставьте пустым для снятия ограничений', margin: "normal", type: "number", inputProps: { min: 0 } }), _jsx(TextField, { fullWidth: true, label: "\u041B\u0438\u043C\u0438\u0442 SMS", value: formData.sms_limit, onChange: (e) => handleInputChange('sms_limit', e.target.value), error: !!errors.sms_limit, helperText: errors.sms_limit || 'Оставьте пустым для снятия ограничений', margin: "normal", type: "number", inputProps: { min: 0 } }), _jsx(Alert, { severity: "info", sx: { mt: 2 }, children: _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: "\u0422\u0435\u043A\u0443\u0449\u0438\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438:" }), _jsx("br", {}), "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432: ", platform.devices_limit ? `${platform.devices_limit}` : 'Без ограничений', _jsx("br", {}), "SMS: ", platform.sms_limit ? `${platform.sms_limit}` : 'Без ограничений'] }) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, disabled: loading, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { onClick: handleSubmit, variant: "contained", disabled: loading, children: loading ? 'Сохранение...' : 'Сохранить' })] })] }));
};
export default PlatformEditDialog;
