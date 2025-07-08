import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Select, Switch, Input } from 'antd';
import { useApi } from '../../lib/useApi';
export const DeviceFormModal = ({ device, onSave, onClose, availableModels }) => {
    const { get } = useApi();
    const [formData, setFormData] = useState(device || {
        name: '',
        phone: '',
        description: '',
        status: 'ONLINE',
        model: '',
        alert_sms_template_id: undefined,
        send_alert_sms: false,
        alert_sms_template_params: {},
    });
    const [commandTemplates, setCommandTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(undefined);
    const [selectedCommandTemplate, setSelectedCommandTemplate] = useState(null);
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
                const data = await get(`/api/v1/commands/templates/${formData.model}`);
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
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
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
    const inputClasses = "p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 w-full";
    return (_jsx("div", { className: "modal-overlay", style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }, children: _jsxs("div", { className: "modal-content bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto relative", style: {
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                maxWidth: '90%'
            }, children: [_jsx("h2", { className: "text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100", children: device ? 'Редактировать устройство' : 'Добавить устройство' }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "form-group flex flex-col", children: [_jsx("label", { htmlFor: "name", className: "text-gray-700 dark:text-gray-300 mb-1", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx("input", { id: "name", className: inputClasses, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), required: true })] }), _jsxs("div", { className: "form-group flex flex-col", children: [_jsx("label", { htmlFor: "phone", className: "text-gray-700 dark:text-gray-300 mb-1", children: "\u0422\u0435\u043B\u0435\u0444\u043E\u043D" }), _jsx("input", { id: "phone", type: "tel", className: inputClasses, value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), pattern: "\\+?[0-9\\s\\-\\(\\)]+" })] }), _jsxs("div", { className: "form-group flex flex-col", children: [_jsx("label", { htmlFor: "grafana_player_id", className: "text-gray-700 dark:text-gray-300 mb-1", children: "ID \u043F\u043B\u0435\u0435\u0440\u0430 Grafana" }), _jsx("input", { id: "grafana_player_id", className: inputClasses, value: formData.grafana_uid || '', onChange: (e) => setFormData({ ...formData, grafana_uid: e.target.value }) })] }), _jsxs("div", { className: "form-group flex flex-col", children: [_jsx("label", { htmlFor: "model", className: "text-gray-700 dark:text-gray-300 mb-1", children: "\u041C\u043E\u0434\u0435\u043B\u044C" }), _jsx(Select, { id: "model", value: formData.model, onChange: (value) => setFormData({ ...formData, model: value }), options: availableModels.map((model) => ({ label: model, value: model })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u0435\u043B\u044C", className: inputClasses, styles: {
                                        popup: {
                                            root: { backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px' },
                                        },
                                    }, optionRender: (option) => {
                                        const isSelected = option.value === formData.model;
                                        return (_jsx("div", { style: {
                                                padding: '8px 12px',
                                                color: isSelected ? 'black' : '#e2e8f0',
                                            }, children: option.label }));
                                    }, style: { width: '100%' } })] }), _jsxs("div", { className: "form-group flex items-center justify-between", children: [_jsx("label", { htmlFor: "send_alert_sms", className: "text-gray-700 dark:text-gray-300", children: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E \u0421\u041C\u0421" }), _jsx(Switch, { id: "send_alert_sms", checked: formData.send_alert_sms, onChange: (checked) => setFormData({ ...formData, send_alert_sms: checked }) })] }), formData.send_alert_sms && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "form-group flex flex-col", children: [_jsx("label", { htmlFor: "command_category", className: "text-gray-700 dark:text-gray-300 mb-1", children: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsx(Select, { id: "command_category", value: selectedCategory, onChange: handleCategoryChange, options: categories.map((cat) => ({ label: cat, value: cat })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044E", loading: loadingTemplates, disabled: !formData.model || loadingTemplates, className: inputClasses, style: { width: '100%' }, size: "large", styles: {
                                                popup: {
                                                    root: { backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px' },
                                                },
                                            }, optionRender: (option) => {
                                                const isSelected = option.value === selectedCategory;
                                                return (_jsx("div", { style: {
                                                        padding: '8px 12px',
                                                        color: isSelected ? 'black' : '#e2e8f0',
                                                    }, children: option.label }));
                                            } })] }), selectedCategory && (_jsxs("div", { className: "form-group flex flex-col", children: [_jsx("label", { htmlFor: "alert_sms_template_id", className: "text-gray-700 dark:text-gray-300 mb-1", children: "\u041A\u043E\u043C\u0430\u043D\u0434\u0430 SMS-\u043E\u043F\u043E\u0432\u0435\u0449\u0435\u043D\u0438\u044F" }), _jsx(Select, { id: "alert_sms_template_id", value: formData.alert_sms_template_id, onChange: (value) => handleCommandTemplateChange(value), options: filteredCommands.map((template) => ({
                                                label: template.name,
                                                value: template.id
                                            })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443", loading: loadingTemplates, disabled: !selectedCategory || loadingTemplates, className: inputClasses, style: { width: '100%' }, styles: {
                                                popup: {
                                                    root: { backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px' },
                                                },
                                            }, optionRender: (option) => {
                                                const isSelected = option.value === formData.alert_sms_template_id;
                                                return (_jsx("div", { style: {
                                                        padding: '8px 12px',
                                                        color: isSelected ? 'black' : '#e2e8f0',
                                                    }, children: option.label }));
                                            } })] })), selectedCommandTemplate && selectedCommandTemplate.params_schema?.properties && (_jsxs("div", { className: "space-y-4 border p-3 rounded-md dark:border-gray-600", children: [_jsx("h4", { className: "text-lg font-semibold text-gray-800 dark:text-gray-100", children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u043A\u043E\u043C\u0430\u043D\u0434\u044B:" }), Object.entries(selectedCommandTemplate.params_schema.properties).map(([paramName, param]) => {
                                            const isRequired = selectedCommandTemplate.params_schema.required?.includes(paramName);
                                            let inputComponent;
                                            if (param.type === 'string') {
                                                inputComponent = _jsx(Input, { placeholder: param.title || paramName });
                                            }
                                            else if (param.type === 'number' || param.type === 'integer') {
                                                inputComponent = _jsx(Input, { type: "number", placeholder: param.title || paramName });
                                            }
                                            else if (param.type === 'boolean') {
                                                inputComponent = _jsx(Switch, { checkedChildren: "\u0412\u043A\u043B", unCheckedChildren: "\u0412\u044B\u043A\u043B" });
                                            }
                                            else if (param.enum) {
                                                inputComponent = (_jsx(Select, { placeholder: param.title || paramName, className: inputClasses, style: { width: '100%' }, styles: {
                                                        popup: {
                                                            root: { backgroundColor: '#334155', border: '1px solid #475569', borderRadius: '4px' },
                                                        },
                                                    }, optionRender: (option) => {
                                                        const isSelected = option.value === formData.alert_sms_template_params?.[paramName];
                                                        return (_jsx("div", { style: {
                                                                padding: '8px 12px',
                                                                color: isSelected ? 'black' : '#e2e8f0',
                                                            }, children: option.label }));
                                                    }, children: param.enum.map((option) => (_jsx(Select.Option, { value: option, children: String(option) }, option))) }));
                                            }
                                            else {
                                                inputComponent = _jsx(Input, { placeholder: param.title || paramName });
                                            }
                                            return (_jsxs("div", { className: "form-group flex flex-col", children: [_jsxs("label", { htmlFor: `param-${paramName}`, className: "text-gray-700 dark:text-gray-300 mb-1", children: [param.title || paramName, isRequired ? ' *' : ''] }), React.cloneElement(inputComponent, {
                                                        id: `param-${paramName}`,
                                                        value: formData.alert_sms_template_params?.[paramName] || '',
                                                        onChange: (e) => handleParamChange(paramName, (typeof e === 'object' && 'target' in e) ? e.target.value : e),
                                                        className: inputClasses,
                                                        style: { width: '100%' }
                                                    })] }, paramName));
                                        })] }))] })), _jsxs("div", { className: "form-group flex flex-col", children: [_jsx("label", { htmlFor: "description", className: "text-gray-700 dark:text-gray-300 mb-1", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx("textarea", { id: "description", className: `${inputClasses} h-24`, value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }) })] }), _jsxs("div", { className: "form-actions flex justify-end space-x-2 mt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-700 transition duration-300", children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx("button", { type: "submit", className: "px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition duration-300", children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" })] })] })] }) }));
};
