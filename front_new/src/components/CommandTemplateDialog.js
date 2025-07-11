import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
const CommandTemplateDialog = ({ open, template, onClose, onSave }) => {
    const [form, setForm] = useState({
        name: '',
        category: '',
        subcategory: '',
        description: '',
        model: '',
        params_schema: '',
        template: '',
    });
    const [errors, setErrors] = useState({});
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
        }
        else {
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
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = () => {
        const newErrors = {};
        if (!form.name)
            newErrors.name = 'Название обязательно';
        if (!form.category)
            newErrors.category = 'Категория обязательна';
        if (!form.model)
            newErrors.model = 'Модель обязательна';
        if (!form.template)
            newErrors.template = 'Текст шаблона обязателен';
        if (!form.params_schema)
            newErrors.params_schema = 'Схема параметров обязательна';
        else {
            try {
                JSON.parse(form.params_schema);
            }
            catch {
                newErrors.params_schema = 'Некорректный JSON';
            }
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            onSave({ ...form });
        }
    };
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: template ? 'Редактировать шаблон' : 'Добавить шаблон' }), _jsx(DialogContent, { children: _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }, children: [_jsx(TextField, { label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", name: "name", value: form.name, onChange: handleChange, error: !!errors.name, helperText: errors.name, fullWidth: true }), _jsx(TextField, { label: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", name: "category", value: form.category, onChange: handleChange, error: !!errors.category, helperText: errors.category, fullWidth: true }), _jsx(TextField, { label: "\u041F\u043E\u0434\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", name: "subcategory", value: form.subcategory, onChange: handleChange, fullWidth: true }), _jsx(TextField, { label: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", name: "description", value: form.description, onChange: handleChange, fullWidth: true }), _jsx(TextField, { label: "\u041C\u043E\u0434\u0435\u043B\u044C", name: "model", value: form.model, onChange: handleChange, error: !!errors.model, helperText: errors.model, fullWidth: true }), _jsx(TextField, { label: "\u0421\u0445\u0435\u043C\u0430 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u0432 (JSON)", name: "params_schema", value: form.params_schema, onChange: handleChange, error: !!errors.params_schema, helperText: errors.params_schema, fullWidth: true, multiline: true, minRows: 3 }), _jsx(TextField, { label: "\u0422\u0435\u043A\u0441\u0442 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u044B", name: "template", value: form.template, onChange: handleChange, error: !!errors.template, helperText: errors.template, fullWidth: true, multiline: true, minRows: 3 })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" }), _jsx(Button, { onClick: handleSubmit, variant: "contained", children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" })] })] }));
};
export default CommandTemplateDialog;
