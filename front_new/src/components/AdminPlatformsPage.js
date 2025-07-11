import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../lib/useApi';
import { useNotification } from './NotificationProvider';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, CircularProgress, Typography, LinearProgress, Chip, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import PlatformWizard from './PlatformWizard';
import { useAuth } from '../lib/useAuth';
const AdminPlatformsPage = () => {
    const [platforms, setPlatforms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openWizard, setOpenWizard] = useState(false);
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
            }
            else {
                data = await get('/platforms/my-platforms');
            }
            setPlatforms(data);
        }
        catch (e) {
            notify(e.message || 'Ошибка загрузки платформ', 'error');
        }
        finally {
            setLoading(false);
        }
    }, [get, notify, user]);
    useEffect(() => {
        fetchPlatforms();
    }, [fetchPlatforms]);
    const handleDelete = async (id) => {
        if (!window.confirm('Удалить платформу?'))
            return;
        try {
            await remove(`/platforms/${id}`);
            notify('Платформа удалена', 'success');
            fetchPlatforms();
        }
        catch (e) {
            // Извлекаем детальное сообщение об ошибке из ответа API
            const errorMessage = e.response?.data?.detail || e.message || 'Ошибка удаления платформы';
            notify(errorMessage, 'error');
        }
    };
    if (loading) {
        return (_jsxs(Paper, { sx: { p: 2, textAlign: 'center' }, children: [_jsx(CircularProgress, {}), _jsx(Typography, { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C..." })] }));
    }
    return (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h5", component: "h2", sx: { mb: 2 }, children: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u044B" }), _jsx(Button, { variant: "contained", startIcon: _jsx(AddIcon, {}), onClick: () => setOpenWizard(true), children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443" }), _jsx(TableContainer, { sx: { mt: 2 }, children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx(TableCell, { children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(TableCell, { children: "\u041B\u0438\u043C\u0438\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432" }), _jsx(TableCell, { children: "\u041B\u0438\u043C\u0438\u0442 SMS" }), _jsx(TableCell, { children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx(TableCell, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(TableBody, { children: platforms.map((p) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { sx: { cursor: 'pointer' }, onClick: () => navigate(`/admin/platforms/${p.id}`), children: p.name }), _jsx(TableCell, { children: p.description || '-' }), _jsx(TableCell, { children: _jsxs(Box, { sx: { minWidth: 120 }, children: [_jsx(Typography, { variant: "body2", color: "textSecondary", children: p.devices_limit ? `до ${p.devices_limit}` : '—' }), _jsx(LinearProgress, { variant: "determinate", value: p.devices_limit && p.devices_count !== undefined ? Math.min(100, (p.devices_count / p.devices_limit) * 100) : 0, sx: { height: 6, borderRadius: 2, mt: 0.5 } }), _jsx(Typography, { variant: "caption", color: "textSecondary", children: p.devices_count !== undefined && p.devices_limit ? `${p.devices_count} / ${p.devices_limit}` : '' })] }) }), _jsx(TableCell, { children: _jsxs(Box, { sx: { minWidth: 120 }, children: [_jsx(Typography, { variant: "body2", color: "textSecondary", children: p.sms_limit ? `до ${p.sms_limit}` : '—' }), _jsx(LinearProgress, { variant: "determinate", value: p.sms_limit && p.sms_count !== undefined ? Math.min(100, (p.sms_count / p.sms_limit) * 100) : 0, sx: { height: 6, borderRadius: 2, mt: 0.5, bgcolor: '#e0e7ef' }, color: "secondary" }), _jsx(Typography, { variant: "caption", color: "textSecondary", children: p.sms_count !== undefined && p.sms_limit ? `${p.sms_count} / ${p.sms_limit}` : '' })] }) }), _jsx(TableCell, { children: _jsx(Chip, { label: "\u0410\u043A\u0442\u0438\u0432\u043D\u0430", color: "success", size: "small" }) }), _jsxs(TableCell, { children: [_jsx(IconButton, { onClick: () => navigate(`/admin/platforms/${p.id}`), children: _jsx(EditIcon, {}) }), _jsx(IconButton, { color: "error", onClick: () => handleDelete(p.id), children: _jsx(DeleteIcon, {}) })] })] }, p.id))) })] }) }), _jsxs(Dialog, { open: openWizard, onClose: () => setOpenWizard(false), children: [_jsx(DialogTitle, { children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443" }), _jsx(DialogContent, { children: _jsx(PlatformWizard, { onComplete: () => { setOpenWizard(false); fetchPlatforms(); } }) })] })] }));
};
export default AdminPlatformsPage;
