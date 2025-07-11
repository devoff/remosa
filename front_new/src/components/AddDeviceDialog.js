import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Alert, Box, Typography, LinearProgress, MenuItem, } from '@mui/material';
import { useAuth } from '../lib/useAuth';
import apiClient from '../lib/api';
import { canAddDevice } from '../utils/roleUtils';
const AddDeviceDialog = ({ open, onClose, onAdd, device }) => {
    const { token, currentPlatform, isSuperAdmin, user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [phone, setPhone] = useState('');
    const [model, setModel] = useState('');
    const [platformLimits, setPlatformLimits] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [platforms, setPlatforms] = useState([]);
    const [selectedPlatform, setSelectedPlatform] = useState(currentPlatform);
    const [availableModels, setAvailableModels] = useState([]);
    const canAdd = canAddDevice(user, selectedPlatform);
    // Загрузка всех платформ для super admin
    useEffect(() => {
        if (isSuperAdmin && open) {
            apiClient.get('/platforms/').then((res) => {
                setPlatforms(res.data);
                // Если открыли диалог или platforms обновились, выбрать первую платформу если не выбрано
                if ((!selectedPlatform || !res.data.find((p) => p.id === selectedPlatform.id)) && res.data.length > 0) {
                    setSelectedPlatform(res.data[0]);
                }
            });
        }
        else {
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
                const models = Array.from(new Set(res.data.map((t) => String(t.model)).filter(Boolean)));
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
        }
        else {
            setName('');
            setDescription('');
            setPhone('');
            setModel('');
            setSelectedPlatform(currentPlatform);
        }
    }, [device, open]);
    const loadPlatformLimits = async (platformId) => {
        if (!platformId || !token)
            return;
        try {
            const response = await apiClient.get(`/platforms/${platformId}/limits`);
            setPlatformLimits(response.data);
        }
        catch (error) {
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
        }
        catch (error) {
            setError('Ошибка при сохранении устройства');
        }
        finally {
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
    return (_jsxs(Dialog, { open: open, onClose: handleCloseDialog, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043D\u043E\u0432\u043E\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E" }), _jsxs(DialogContent, { children: [_jsx(DialogContentText, { children: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u043E\u0432\u043E\u0433\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430. \u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B \u0434\u043B\u044F \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F." }), isSuperAdmin && (_jsx(TextField, { select: true, margin: "dense", id: "platform", label: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430", fullWidth: true, value: selectedPlatform ? selectedPlatform.id : '', onChange: (e) => {
                            const plat = platforms.find((p) => p.id === Number(e.target.value));
                            setSelectedPlatform(plat || null);
                        }, disabled: loading, sx: { mb: 2 }, children: platforms.map((platform) => (_jsx(MenuItem, { value: platform.id, children: platform.name }, platform.id))) })), platformLimits && (_jsxs(Box, { sx: { mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }, children: [_jsxs(Typography, { variant: "subtitle2", gutterBottom: true, children: ["\u041B\u0438\u043C\u0438\u0442\u044B \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B \"", platformLimits.platform_name, "\""] }), _jsxs(Box, { sx: { mb: 1 }, children: [_jsxs(Typography, { variant: "body2", children: ["\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430: ", platformLimits.devices.current, " / ", platformLimits.devices.limit || '∞', platformLimits.devices.limit && (_jsxs("span", { style: { color: platformLimits.devices.available <= 0 ? 'red' : 'inherit' }, children: [' ', "(\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E: ", platformLimits.devices.available, ")"] }))] }), platformLimits.devices.limit && (_jsx(LinearProgress, { variant: "determinate", value: platformLimits.devices.usage_percentage, sx: {
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: 'grey.300',
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: platformLimits.devices.usage_percentage > 90 ? 'error.main' :
                                                    platformLimits.devices.usage_percentage > 70 ? 'warning.main' : 'success.main'
                                            }
                                        } }))] })] })), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), !canAdd && (_jsx(Alert, { severity: "warning", sx: { mb: 2 }, children: "\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u043F\u0440\u0430\u0432 \u043D\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432 \u0432 \u044D\u0442\u0443 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443." })), _jsx(TextField, { autoFocus: true, margin: "dense", id: "name", label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430", type: "text", fullWidth: true, variant: "standard", value: name, onChange: (e) => setName(e.target.value), required: true, disabled: loading || Boolean(isLimitReached) || !canAdd }), _jsx(TextField, { margin: "dense", id: "phone", label: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", type: "tel", fullWidth: true, variant: "standard", value: phone, onChange: (e) => setPhone(e.target.value), required: true, placeholder: "+7XXXXXXXXXX", disabled: loading || Boolean(isLimitReached) || !canAdd }), _jsx(TextField, { select: true, margin: "dense", id: "model", label: "\u041C\u043E\u0434\u0435\u043B\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430", fullWidth: true, variant: "standard", value: model, onChange: (e) => setModel(e.target.value), disabled: loading || Boolean(isLimitReached) || !canAdd || availableModels.length === 0, children: availableModels.map((m) => (_jsx(MenuItem, { value: m, children: m }, m))) }), _jsx(TextField, { margin: "dense", id: "description", label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", type: "text", fullWidth: true, variant: "standard", value: description, onChange: (e) => setDescription(e.target.value), disabled: loading || Boolean(isLimitReached) || !canAdd })] }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: handleCloseDialog, disabled: loading, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { onClick: handleAddClick, disabled: !isFormValid || loading || Boolean(isLimitReached) || !canAdd, variant: "contained", children: loading ? 'Добавление...' : 'Добавить' })] })] }));
};
export default AddDeviceDialog;
