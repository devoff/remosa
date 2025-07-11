import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Modal, Form, Button, Select, Input, InputNumber, message, Spin } from 'antd';
import { useApi } from '../lib/useApi';
const ExecuteCommandModal = ({ visible, onClose, device }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const api = useApi();
    useEffect(() => {
        if (visible && device) {
            fetchTemplates();
        }
    }, [visible, device]);
    const fetchTemplates = async () => {
        try {
            setLoadingTemplates(true);
            const response = await api.get(`/command_templates?model=${device.model || ''}`);
            const templates = Array.isArray(response) ? response : [];
            setTemplates(templates);
            setLoadingTemplates(false);
        }
        catch (error) {
            console.error('Ошибка при загрузке шаблонов команд:', error);
            message.error('Не удалось загрузить шаблоны команд');
            setLoadingTemplates(false);
        }
    };
    const handleTemplateChange = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(template);
            form.resetFields(['params']);
        }
    };
    const handleExecute = async () => {
        try {
            const values = await form.validateFields();
            const paramsWithCorrectTypes = { ...values.params };
            if (selectedTemplate?.params_schema?.properties) {
                for (const key in selectedTemplate.params_schema.properties) {
                    const paramDef = selectedTemplate.params_schema.properties[key];
                    if (paramDef.type === 'number' && typeof paramsWithCorrectTypes[key] === 'string') {
                        paramsWithCorrectTypes[key] = parseFloat(paramsWithCorrectTypes[key]);
                    }
                }
            }
            const payload = {
                device_id: device.id,
                template_id: selectedTemplate.id,
                params: paramsWithCorrectTypes || {},
            };
            setLoading(true);
            await api.post('/commands/execute', payload);
            message.success('Команда успешно отправлена');
            onClose();
        }
        catch (error) {
            console.error('Ошибка при выполнении команды:', error);
            message.error('Не удалось выполнить команду');
        }
        finally {
            setLoading(false);
        }
    };
    const renderParamInput = (key, param) => {
        const isRequired = selectedTemplate?.params_schema?.required?.includes(key);
        const rules = isRequired ? [{ required: true, message: `Поле '${param.title || key}' обязательно` }] : [];
        if (param.type === 'number') {
            return (_jsx(Form.Item, { name: ['params', key], label: param.title || key, rules: rules, children: _jsx(InputNumber, { min: param.min, max: param.max, style: { width: '100%' } }) }, key));
        }
        return (_jsx(Form.Item, { name: ['params', key], label: param.title || key, rules: rules, children: _jsx(Input, { pattern: param.pattern }) }, key));
    };
    const renderParamsForm = () => {
        if (!selectedTemplate || !selectedTemplate.params_schema) {
            return null;
        }
        const { properties } = selectedTemplate.params_schema;
        if (!properties || Object.keys(properties).length === 0) {
            return _jsx("p", { children: "\u042D\u0442\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u043D\u0435 \u0438\u043C\u0435\u0435\u0442 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u0432" });
        }
        return (_jsxs("div", { children: [_jsx("h4", { className: "mb-4", children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), Object.entries(properties || {}).map(([key, param]) => renderParamInput(key, param))] }));
    };
    return (_jsx(Modal, { open: visible, title: `Выполнить команду на устройстве ${device.name}`, onCancel: onClose, footer: [
            _jsx(Button, { onClick: onClose, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }, "cancel"),
            _jsx(Button, { type: "primary", loading: loading, onClick: handleExecute, disabled: !selectedTemplate, children: "\u0412\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C" }, "submit"),
        ], width: 600, children: _jsxs(Form, { form: form, layout: "vertical", children: [_jsx(Form.Item, { name: "template_id", label: "\u0428\u0430\u0431\u043B\u043E\u043D \u043A\u043E\u043C\u0430\u043D\u0434\u044B", rules: [{ required: true, message: 'Выберите шаблон команды' }], children: _jsx(Select, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0448\u0430\u0431\u043B\u043E\u043D \u043A\u043E\u043C\u0430\u043D\u0434\u044B", onChange: handleTemplateChange, loading: loadingTemplates, disabled: loading, children: templates.map((template) => (_jsx(Select.Option, { value: template.id, children: template.name }, template.id))) }) }), selectedTemplate && (_jsx("div", { className: "mb-4", children: _jsx("p", { children: selectedTemplate.description }) })), loadingTemplates ? _jsx(Spin, {}) : renderParamsForm()] }) }));
};
export default ExecuteCommandModal;
