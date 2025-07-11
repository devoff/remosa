import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Paper, Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Typography, TextField, Button } from '@mui/material';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import CommandTemplateDialog from './CommandTemplateDialog';
import { useApi } from '../lib/useApi';
import { useAuth } from '../lib/useAuth';
import { useNotification } from './NotificationProvider';
const CommandTemplatesPage = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [selectedModel, setSelectedModel] = useState('');
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
        }
        catch (error) {
            notify('Не удалось загрузить шаблоны команд', 'error');
        }
        finally {
            setLoading(false);
        }
    }, [api, notify]);
    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);
    const uniqueModels = useMemo(() => {
        const models = templates.map((t) => t.model).filter(Boolean);
        return Array.from(new Set(models));
    }, [templates]);
    const filteredTemplates = templates.filter((t) => {
        if (!selectedModel || t.model !== selectedModel)
            return false;
        if (search && !(t.name?.toLowerCase().includes(search.toLowerCase()) ||
            t.category?.toLowerCase().includes(search.toLowerCase())))
            return false;
        return true;
    });
    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditingTemplate(null);
    };
    const handleDialogSave = async (values) => {
        try {
            const parsedSchema = JSON.parse(values.params_schema);
            const payload = { ...values, params_schema: parsedSchema };
            if (editingTemplate) {
                await api.put(`/command_templates/${editingTemplate.id}`, payload);
                notify('Шаблон успешно обновлен', 'success');
            }
            else {
                await api.post('/command_templates/', payload);
                notify('Шаблон успешно создан', 'success');
            }
            setDialogOpen(false);
            setEditingTemplate(null);
            fetchTemplates();
        }
        catch (error) {
            notify('Ошибка сохранения. Проверьте JSON схемы параметров.', 'error');
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Удалить шаблон команды?'))
            return;
        try {
            await api.remove(`/command_templates/${id}`);
            notify('Шаблон команды успешно удален', 'success');
            fetchTemplates();
        }
        catch (error) {
            notify('Не удалось удалить шаблон команды', 'error');
        }
    };
    if (loading) {
        return (_jsxs(Paper, { sx: { p: 2, textAlign: 'center' }, children: [_jsx(CircularProgress, {}), _jsx(Typography, { children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 \u043A\u043E\u043C\u0430\u043D\u0434..." })] }));
    }
    if (!selectedModel) {
        return (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "h5", component: "h2", sx: { mb: 2 }, children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u0435\u043B\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430" }), _jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "\u041C\u043E\u0434\u0435\u043B\u044C" }), _jsx(TableCell, { children: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432" }), _jsx(TableCell, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(TableBody, { children: uniqueModels.map((m) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: m }), _jsx(TableCell, { children: templates.filter(t => t.model === m).length }), _jsx(TableCell, { children: _jsx(Button, { variant: "outlined", onClick: () => setSelectedModel(m), children: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u044B" }) })] }, m))) })] }) })] }));
    }
    return (_jsxs(Paper, { sx: { p: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }, children: [_jsxs(Typography, { variant: "h5", component: "h2", children: ["\u0428\u0430\u0431\u043B\u043E\u043D\u044B \u043A\u043E\u043C\u0430\u043D\u0434 \u0434\u043B\u044F \u043C\u043E\u0434\u0435\u043B\u0438: ", selectedModel] }), _jsxs(Box, { children: [_jsx(Button, { variant: "outlined", sx: { mr: 2 }, onClick: () => setSelectedModel(''), children: "\u041D\u0430\u0437\u0430\u0434 \u043A \u043C\u043E\u0434\u0435\u043B\u044F\u043C" }), isSuperAdmin && (_jsx(Button, { variant: "contained", startIcon: _jsx(PlusOutlined, {}), onClick: () => { setEditingTemplate(null); setDialogOpen(true); }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D" }))] })] }), _jsx(Box, { sx: { display: 'flex', gap: 2, mb: 2 }, children: _jsx(TextField, { label: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E/\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438", value: search, onChange: (e) => setSearch(e.target.value), size: "small", sx: { minWidth: 220 } }) }), _jsx(TableContainer, { children: _jsxs(Table, { children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { children: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F" }), _jsx(TableCell, { children: "\u041F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F" }), _jsx(TableCell, { children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx(TableCell, { children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(TableCell, { children: "\u0422\u0435\u043A\u0441\u0442 \u0448\u0430\u0431\u043B\u043E\u043D\u0430" }), _jsx(TableCell, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" })] }) }), _jsx(TableBody, { children: filteredTemplates.map((t) => (_jsxs(TableRow, { hover: true, children: [_jsx(TableCell, { children: t.category }), _jsx(TableCell, { children: t.subcategory }), _jsx(TableCell, { children: t.name }), _jsx(TableCell, { children: t.description }), _jsx(TableCell, { style: { maxWidth: 250, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }, children: t.template }), _jsx(TableCell, { children: isSuperAdmin && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "small", onClick: () => { setEditingTemplate(t); setDialogOpen(true); }, children: _jsx(EditOutlined, {}) }), _jsx(Button, { size: "small", color: "error", onClick: () => handleDelete(t.id), children: _jsx(DeleteOutlined, {}) })] })) })] }, t.id))) })] }) }), _jsx(CommandTemplateDialog, { open: dialogOpen, template: editingTemplate, onClose: handleDialogClose, onSave: handleDialogSave })] }));
};
export default CommandTemplatesPage;
