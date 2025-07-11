import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Select, Switch, Input, Button, Modal, Typography, Popconfirm, message } from 'antd';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/useAuth';
import apiClient from '../../lib/api';
import { SaveOutlined, CloseOutlined, MobileOutlined, AppstoreOutlined, ToolOutlined, DeleteOutlined } from '@ant-design/icons';
const { Title } = Typography;
export const DeviceFormModal = ({ device, onSave, onClose, availableModels: _availableModels }) => {
    const { get, remove } = useApi();
    const { user, currentPlatform } = useAuth();
    const [formData, setFormData] = useState({});
    const [commandTemplates, setCommandTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(undefined);
    const [selectedCommandTemplate, setSelectedCommandTemplate] = useState(null);
    const [platforms, setPlatforms] = useState([]);
    const [availableModels, setAvailableModels] = useState([]);
    const isSuperAdmin = user?.role === 'superadmin';
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const validate = () => {
        const errors = {};
        if (!formData.name || formData.name.trim() === '') {
            errors.name = 'Название обязательно';
        }
        if (!formData.phone || formData.phone.trim() === '') {
            errors.phone = 'Телефон обязателен';
        }
        if (!formData.model || formData.model.trim() === '') {
            errors.model = 'Модель обязательна';
        }
        return errors;
    };
    useEffect(() => {
        if (device) {
            setFormData({
                ...device,
                platform_id: typeof device.platform_id === 'number'
                    ? device.platform_id
                    : (isSuperAdmin ? undefined : currentPlatform?.id),
                phone: device.phone || '',
            });
        }
        else {
            setFormData({
                name: '',
                phone: '',
                description: '',
                status: 'ONLINE',
                model: '',
                alert_sms_template_id: undefined,
                send_alert_sms: false,
                alert_sms_template_params: {},
                platform_id: isSuperAdmin ? undefined : currentPlatform?.id,
            });
        }
    }, [device, isSuperAdmin, currentPlatform]);
    useEffect(() => {
        apiClient.get('/command_templates/').then(res => {
            const models = Array.from(new Set(res.data.map((t) => String(t.model)).filter(Boolean)));
            setAvailableModels(models);
        });
    }, []);
    useEffect(() => {
        const fetchCommandTemplates = async () => {
            if (!formData.model) {
                setCommandTemplates([]);
                setSelectedCategory(undefined);
                setSelectedCommandTemplate(null);
                setFormData((prev) => ({ ...prev, alert_sms_template_id: undefined, alert_sms_template_params: {} }));
                return;
            }
            setLoadingTemplates(true);
            try {
                const data = await get(`/commands/templates/${formData.model}`);
                setCommandTemplates(data);
                if (device && device.alert_sms_template_id) {
                    const existingTemplate = data.find((t) => t.id === device.alert_sms_template_id);
                    if (existingTemplate) {
                        setSelectedCategory(existingTemplate.category);
                        setSelectedCommandTemplate(existingTemplate);
                        setFormData((prev) => ({ ...prev, alert_sms_template_params: device.alert_sms_template_params || {} }));
                    }
                    else {
                        setFormData((prev) => ({ ...prev, alert_sms_template_id: undefined, alert_sms_template_params: {} }));
                    }
                }
            }
            catch (error) {
                console.error('Ошибка получения шаблонов команд:', error);
            }
            finally {
                setLoadingTemplates(false);
            }
        };
        fetchCommandTemplates();
    }, [formData.model, get, device]);
    useEffect(() => {
        async function fetchPlatforms() {
            let response;
            if (user?.role === 'superadmin') {
                response = await apiClient.get('/platforms/');
            }
            else {
                response = await apiClient.get('/platforms/my-platforms/');
            }
            setPlatforms(response.data);
        }
        fetchPlatforms();
    }, [user]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validate();
        setFormErrors(errors);
        if (Object.keys(errors).length > 0)
            return;
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        }
        catch (err) {
            if (err?.response?.data?.detail) {
                message.error(err.response.data.detail);
            }
            else if (err?.message) {
                message.error(err.message);
            }
            else {
                message.error('Ошибка при сохранении устройства');
            }
        }
        finally {
            setSaving(false);
        }
    };
    const categories = Array.from(new Set(commandTemplates.map((t) => t.category).filter(Boolean)));
    const filteredCommands = selectedCategory
        ? commandTemplates.filter((t) => t.category === selectedCategory)
        : [];
    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setSelectedCommandTemplate(null);
        setFormData((prev) => ({ ...prev, alert_sms_template_id: undefined, alert_sms_template_params: {} }));
    };
    const handleCommandTemplateChange = (templateId) => {
        const template = commandTemplates.find((t) => t.id === templateId);
        setSelectedCommandTemplate(template || null);
        setFormData((prev) => ({
            ...prev,
            alert_sms_template_id: templateId,
            alert_sms_template_params: {}
        }));
    };
    const handleParamChange = (paramName, value) => {
        setFormData((prev) => ({
            ...prev,
            alert_sms_template_params: {
                ...(prev.alert_sms_template_params || {}),
                [paramName]: value
            }
        }));
    };
    // Удаление устройства
    const handleDelete = async () => {
        if (!device || !device.id)
            return;
        try {
            // Определяем эндпоинт
            let endpoint = `/devices/${device.id}`;
            if (device.platform_id && user?.platform_roles?.some(r => r.platform_id === device.platform_id && (r.role === 'admin' || r.role === 'manager'))) {
                endpoint = `/platforms/${device.platform_id}/devices/${device.id}`;
            }
            await remove(endpoint);
            message.success('Устройство удалено');
            onSave(null); // чтобы обновить список
            onClose();
        }
        catch (err) {
            message.error('Ошибка при удалении устройства');
        }
    };
    // --- Новый современный стиль ---
    return (_jsxs(Modal, { open: true, onCancel: onClose, footer: null, centered: true, width: 480, closeIcon: _jsx(CloseOutlined, { style: { fontSize: 20 } }), bodyStyle: {
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            padding: 32,
            color: '#222',
        }, style: { borderRadius: 16 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', marginBottom: 24 }, children: [_jsx(ToolOutlined, { style: { fontSize: 32, color: '#1890ff', marginRight: 12 } }), _jsx(Title, { level: 4, style: { color: '#222', margin: 0, flex: 1 }, children: device ? 'Редактировать устройство' : 'Добавить устройство' })] }), _jsxs("form", { onSubmit: handleSubmit, children: [platforms.length > 0 && (_jsxs("div", { style: { marginBottom: 18 }, children: [_jsx("label", { style: { color: '#555', marginBottom: 4, display: 'block' }, children: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430" }), isSuperAdmin ? (_jsx(Select, { value: formData.platform_id, onChange: (value) => {
                                    setFormData(prev => ({ ...prev, platform_id: value }));
                                }, options: platforms.map((p) => ({ label: p.name, value: p.id })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443", style: { width: '100%' }, size: "large" })) : (_jsx(Input, { value: platforms.find(p => p.id === formData.platform_id)?.name || '—', disabled: true, size: "large", style: { width: '100%' } }))] })), _jsxs("div", { style: { marginBottom: 18 }, children: [_jsxs("label", { style: { color: '#b0b8c9', marginBottom: 4, display: 'block' }, children: ["\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 ", _jsx("span", { style: { color: 'red' }, children: "*" })] }), _jsx(Input, { prefix: _jsx(AppstoreOutlined, {}), value: formData.name, onChange: e => setFormData({ ...formData, name: e.target.value }), required: true, size: "large", placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430", style: { borderRadius: 8 } }), formErrors.name && _jsx("div", { style: { color: 'red', fontSize: 12, marginTop: 2 }, children: formErrors.name })] }), _jsxs("div", { style: { marginBottom: 18 }, children: [_jsxs("label", { style: { color: '#b0b8c9', marginBottom: 4, display: 'block' }, children: ["\u0422\u0435\u043B\u0435\u0444\u043E\u043D ", _jsx("span", { style: { color: 'red' }, children: "*" })] }), _jsx(Input, { prefix: _jsx(MobileOutlined, {}), value: formData.phone, onChange: e => setFormData({ ...formData, phone: e.target.value }), pattern: "\\+?[0-9\\s\\-\\(\\)]+", size: "large", placeholder: "+7 (999) 123-45-67", style: { borderRadius: 8 } }), formErrors.phone && _jsx("div", { style: { color: 'red', fontSize: 12, marginTop: 2 }, children: formErrors.phone })] }), _jsxs("div", { style: { marginBottom: 18 }, children: [_jsx("label", { style: { color: '#b0b8c9', marginBottom: 4, display: 'block' }, children: "ID \u043F\u043B\u0435\u0435\u0440\u0430 Grafana" }), _jsx(Input, { value: formData.grafana_uid || '', onChange: e => setFormData({ ...formData, grafana_uid: e.target.value }), size: "large", placeholder: "ID Grafana", style: { borderRadius: 8 } })] }), _jsxs("div", { style: { marginBottom: 18 }, children: [_jsxs("label", { style: { color: '#b0b8c9', marginBottom: 4, display: 'block' }, children: ["\u041C\u043E\u0434\u0435\u043B\u044C ", _jsx("span", { style: { color: 'red' }, children: "*" })] }), _jsx(Select, { value: formData.model, onChange: value => setFormData({ ...formData, model: value }), options: availableModels.map((model) => ({ label: model, value: model })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u0435\u043B\u044C", style: { width: '100%' }, size: "large", showSearch: true, filterOption: (input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) }), formErrors.model && _jsx("div", { style: { color: 'red', fontSize: 12, marginTop: 2 }, children: formErrors.model })] }), _jsxs("div", { style: { marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx(Switch, { checked: !!formData.send_alert_sms, onChange: checked => setFormData({ ...formData, send_alert_sms: checked }), style: { background: formData.send_alert_sms ? '#1890ff' : '#444' } }), _jsx("span", { style: { color: '#b0b8c9' }, children: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E \u0421\u041C\u0421" })] }), formData.send_alert_sms && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { marginBottom: 18 }, children: [_jsx("label", { style: { color: '#b0b8c9', marginBottom: 4, display: 'block' }, children: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsx(Select, { value: selectedCategory, onChange: handleCategoryChange, options: categories.map(cat => ({ label: cat, value: cat })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E", style: { width: '100%' }, size: "large" })] }), _jsxs("div", { style: { marginBottom: 18 }, children: [_jsx("label", { style: { color: '#b0b8c9', marginBottom: 4, display: 'block' }, children: "\u041A\u043E\u043C\u0430\u043D\u0434\u0430 SMS-\u043E\u043F\u043E\u0432\u0435\u0449\u0435\u043D\u0438\u044F" }), _jsx(Select, { value: selectedCommandTemplate?.id, onChange: handleCommandTemplateChange, options: filteredCommands.map(cmd => ({ label: cmd.name, value: cmd.id })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443", style: { width: '100%' }, size: "large" })] })] })), _jsxs("div", { style: { marginBottom: 24 }, children: [_jsx("label", { style: { color: '#b0b8c9', marginBottom: 4, display: 'block' }, children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(Input.TextArea, { value: formData.description, onChange: e => setFormData({ ...formData, description: e.target.value }), rows: 3, size: "large", placeholder: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430", style: { borderRadius: 8, resize: 'vertical' } })] }), _jsxs("div", { style: { display: 'flex', justifyContent: device ? 'space-between' : 'flex-end', gap: 12, marginTop: 24 }, children: [device && device.id && (_jsx(Popconfirm, { title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E?", description: "\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u044D\u0442\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E?", onConfirm: handleDelete, okText: "\u0414\u0430", cancelText: "\u041D\u0435\u0442", children: _jsx(Button, { danger: true, icon: _jsx(DeleteOutlined, {}), size: "large", children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" }) })), _jsxs("div", { style: { display: 'flex', gap: 12 }, children: [_jsx(Button, { onClick: onClose, icon: _jsx(CloseOutlined, {}), size: "large", children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "primary", htmlType: "submit", icon: _jsx(SaveOutlined, {}), size: "large", style: { borderRadius: 8 }, disabled: saving, loading: saving, children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" })] })] })] })] }));
};
export default DeviceFormModal;
