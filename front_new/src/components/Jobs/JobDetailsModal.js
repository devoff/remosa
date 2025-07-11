import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, AlertTriangle, Bell, Terminal, Globe, Clock, CheckCircle, Pause, Edit2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Button } from '../ui/button';
import { useExporterApi } from '../../lib/exporterApi';
import { useNotification } from '../NotificationProvider';
import { PrometheusDeviceSelector, MetricSelector, OperatorSelector, ThresholdInput, ManagementDeviceSelector, CommandTemplateSelector, ActionTypeSelector, ActionParametersInput } from './JobEditors';
const JobDetailsModal = ({ job, onClose }) => {
    const [editBlock, setEditBlock] = useState(null);
    const [editData, setEditData] = useState(job);
    const { updateJob, getJobExecutions } = useExporterApi();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [executions, setExecutions] = useState([]);
    const [execLoading, setExecLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const getJobTypeIcon = (jobType) => {
        switch (jobType) {
            case 'alert':
                return _jsx(AlertTriangle, { className: "text-red-400", size: 20 });
            case 'notification':
                return _jsx(Bell, { className: "text-blue-400", size: 20 });
            case 'command':
                return _jsx(Terminal, { className: "text-green-400", size: 20 });
            default:
                return _jsx(Globe, { className: "text-gray-400", size: 20 });
        }
    };
    const getJobTypeText = (jobType) => {
        switch (jobType) {
            case 'alert':
                return 'Алерт';
            case 'notification':
                return 'Уведомление';
            case 'command':
                return 'Команда';
            default:
                return 'Неизвестно';
        }
    };
    const getOperatorText = (operator) => {
        switch (operator) {
            case 'equals':
                return 'Равно';
            case 'not_equals':
                return 'Не равно';
            case 'contains':
                return 'Содержит';
            case 'greater_than':
                return 'Больше';
            case 'less_than':
                return 'Меньше';
            default:
                return operator;
        }
    };
    const getActionTypeText = (type) => {
        switch (type) {
            case 'send_notification':
                return 'Отправить уведомление';
            case 'execute_command':
                return 'Выполнить команду';
            case 'webhook':
                return 'Webhook';
            default:
                return type;
        }
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };
    const handleSaveBlock = async (block) => {
        setLoading(true);
        setErrors({});
        try {
            let patch = {};
            if (block === 'main') {
                patch = {
                    name: editData.name,
                    description: editData.description,
                    is_active: editData.is_active,
                };
            }
            else if (block === 'conditions') {
                // Валидация условий
                const newErrors = {};
                if (!editData.monitoring_device_mac) {
                    newErrors.monitoring_device_mac = 'Выберите устройство для мониторинга';
                }
                if (!editData.monitoring_metric) {
                    newErrors.monitoring_metric = 'Выберите метрику';
                }
                if (!editData.operator) {
                    newErrors.operator = 'Выберите оператор';
                }
                if (!editData.threshold_value) {
                    newErrors.threshold_value = 'Введите пороговое значение';
                }
                if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    setLoading(false);
                    return;
                }
                // Сохраняем все ключевые поля, чтобы не терялись значения
                patch = {
                    name: editData.name,
                    description: editData.description,
                    is_active: editData.is_active,
                    monitoring_device_mac: editData.monitoring_device_mac,
                    monitoring_metric: editData.monitoring_metric,
                    operator: editData.operator ?? 'equals',
                    threshold_value: editData.threshold_value,
                    // Обновляем условия с информацией о метрике
                    conditions: [{
                            field: editData.monitoring_metric ?? '',
                            operator: editData.operator ?? 'equals',
                            value: editData.threshold_value ?? '',
                            monitoring_device_mac: editData.monitoring_device_mac ?? '',
                            monitoring_metric: editData.monitoring_metric ?? '',
                            metric_human_name: editData.conditions?.[0]?.metric_human_name ?? '',
                            metric_unit: editData.conditions?.[0]?.metric_unit ?? '',
                            metric_description: editData.conditions?.[0]?.metric_description ?? '',
                        }],
                };
            }
            else if (block === 'actions') {
                // Валидация действий
                const newErrors = {};
                if (!editData.device_id) {
                    newErrors.device_id = 'Выберите устройство для управления';
                }
                if (!editData.actions[0]?.type) {
                    newErrors.action_type = 'Выберите тип действия';
                }
                if (!editData.command && !editData.actions[0]?.config?.message) {
                    newErrors.action_parameters = 'Введите параметры действия';
                }
                if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    setLoading(false);
                    return;
                }
                // Сохраняем все ключевые поля, чтобы не терялись значения
                patch = {
                    name: editData.name,
                    description: editData.description,
                    is_active: editData.is_active,
                    monitoring_device_mac: editData.monitoring_device_mac,
                    monitoring_metric: editData.monitoring_metric,
                    operator: editData.operator ?? 'equals',
                    threshold_value: editData.threshold_value,
                    device_id: editData.device_id,
                    command: editData.command,
                    command_template_id: editData.command_template_id,
                    // Обновляем действия с информацией о командах
                    actions: editData.actions.map(action => ({
                        ...action,
                        config: {
                            ...action.config,
                            // Эти поля будут заполнены при выборе команды
                            command_template_name: action.config?.command_template_name,
                            command_template_category: action.config?.command_template_category,
                            command_template_subcategory: action.config?.command_template_subcategory,
                            command_parameters: action.config?.command_parameters,
                            final_command: action.config?.final_command,
                        }
                    })),
                };
            }
            const updated = await updateJob(job.id, patch);
            notify('Изменения сохранены', 'success');
            setEditBlock(null);
            setErrors({});
            setEditData(updated); // Синхронизируем editData с ответом API
        }
        catch (e) {
            notify('Ошибка при сохранении', 'error');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        setExecLoading(true);
        getJobExecutions(job.id)
            .then(setExecutions)
            .finally(() => setExecLoading(false));
    }, [job.id]);
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx("div", { className: "bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-100", children: ["\u0414\u0435\u0442\u0430\u043B\u0438 \u0437\u0430\u0434\u0430\u043D\u0438\u044F: ", job.name] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-200 transition-colors", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-gray-750 rounded-lg p-4 border border-gray-700 relative", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 mb-4 flex items-center", children: [getJobTypeIcon(job.job_type), _jsx("span", { className: "ml-2", children: "\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F" }), _jsx("button", { className: "ml-auto text-gray-400 hover:text-blue-400", onClick: () => { setEditBlock('main'); setEditData(job); }, title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(Edit2, { size: 18 }) })] }), editBlock === 'main' ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx(Input, { value: editData.name, onChange: e => setEditData(d => ({ ...d, name: e.target.value })) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0422\u0438\u043F" }), _jsx("p", { className: "text-gray-100 font-medium", children: getJobTypeText(job.job_type) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsxs(Select, { value: editData.is_active ? 'true' : 'false', onValueChange: v => setEditData(d => ({ ...d, is_active: v === 'true' })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "true", children: "\u0410\u043A\u0442\u0438\u0432\u043D\u043E" }), _jsx(SelectItem, { value: "false", children: "\u041D\u0435\u0430\u043A\u0442\u0438\u0432\u043D\u043E" })] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx(Input, { value: editData.description || '', onChange: e => setEditData(d => ({ ...d, description: e.target.value })) })] }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx(Button, { onClick: () => handleSaveBlock('main'), disabled: loading, children: loading ? 'Сохранение...' : 'Сохранить' }), _jsx(Button, { variant: "outline", onClick: () => setEditBlock(null), children: "\u041E\u0442\u043C\u0435\u043D\u0430" })] })] })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435" }), _jsx("p", { className: "text-gray-100 font-medium", children: job.name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0422\u0438\u043F" }), _jsx("p", { className: "text-gray-100 font-medium", children: getJobTypeText(job.job_type) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsxs("div", { className: "flex items-center", children: [job.is_active ? (_jsx(CheckCircle, { className: "text-green-500", size: 16 })) : (_jsx(Pause, { className: "text-gray-500", size: 16 })), _jsx("span", { className: `ml-2 font-medium ${job.is_active ? 'text-green-400' : 'text-gray-500'}`, children: job.is_active ? 'Активно' : 'Неактивно' })] })] }), job.description && (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-400", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx("p", { className: "text-gray-100", children: job.description })] }))] }))] }), _jsxs("div", { className: "bg-gray-750 rounded-lg p-4 border border-gray-700 relative", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 mb-4 flex items-center", children: [_jsx(AlertTriangle, { className: "text-orange-400", size: 20 }), _jsxs("span", { className: "ml-2", children: ["\u0423\u0441\u043B\u043E\u0432\u0438\u044F (", job.conditions.length, ")"] }), _jsx("button", { className: "ml-auto text-gray-400 hover:text-blue-400", onClick: () => { setEditBlock('conditions'); setEditData(job); }, title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(Edit2, { size: 18 }) })] }), editBlock === 'conditions' ? (_jsxs("div", { className: "space-y-6", children: [_jsx(PrometheusDeviceSelector, { value: editData.monitoring_device_mac || '', onChange: (value) => setEditData(d => ({ ...d, monitoring_device_mac: value })), error: errors.monitoring_device_mac }), _jsx(MetricSelector, { deviceMac: editData.monitoring_device_mac || '', value: editData.monitoring_metric || '', onChange: (value) => setEditData(d => ({ ...d, monitoring_metric: value })), error: errors.monitoring_metric, onMetricSelect: (metric) => {
                                                    // Обновляем условия с информацией о выбранной метрике
                                                    const newConditions = [{
                                                            field: metric.technical_name,
                                                            operator: editData.operator ?? 'equals',
                                                            value: editData.threshold_value || '',
                                                            monitoring_device_mac: editData.monitoring_device_mac,
                                                            monitoring_metric: metric.technical_name,
                                                            metric_human_name: metric.human_name,
                                                            metric_unit: metric.unit,
                                                            metric_description: metric.description,
                                                        }];
                                                    setEditData(d => ({
                                                        ...d,
                                                        monitoring_metric: metric.technical_name,
                                                        conditions: newConditions
                                                    }));
                                                } }), _jsx(OperatorSelector, { value: editData.operator || '', onChange: (value) => setEditData(d => ({ ...d, operator: value })), error: errors.operator }), _jsx(ThresholdInput, { value: editData.threshold_value || '', onChange: (value) => setEditData(d => ({ ...d, threshold_value: value })), error: errors.threshold_value, metric: editData.monitoring_metric, operator: editData.operator }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx(Button, { onClick: () => handleSaveBlock('conditions'), disabled: loading, children: loading ? 'Сохранение...' : 'Сохранить' }), _jsx(Button, { variant: "outline", onClick: () => setEditBlock(null), children: "\u041E\u0442\u043C\u0435\u043D\u0430" })] })] })) : (!job.monitoring_device_mac ? (_jsx("p", { className: "text-gray-400 text-center py-4", children: "\u041D\u0435\u0442 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0445 \u0443\u0441\u043B\u043E\u0432\u0438\u0439 \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430" })) : (_jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "bg-gray-700 p-3 rounded-lg", children: [_jsx("div", { className: "flex items-center justify-between mb-2", children: _jsx("span", { className: "text-sm font-medium text-gray-300", children: "\u0423\u0441\u043B\u043E\u0432\u0438\u0435 \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430" }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E" }), _jsx("p", { className: "text-gray-100 font-mono", children: job.monitoring_device_mac })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u041C\u0435\u0442\u0440\u0438\u043A\u0430" }), _jsxs("p", { className: "text-gray-100", children: [job.monitoring_metric, job.conditions[0]?.metric_human_name && (_jsx("span", { className: "text-xs text-gray-400 block", children: job.conditions[0].metric_human_name })), job.conditions[0]?.metric_unit && (_jsxs("span", { className: "text-xs text-gray-400 block", children: ["\u0415\u0434\u0438\u043D\u0438\u0446\u0430: ", job.conditions[0].metric_unit] }))] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440" }), _jsx("p", { className: "text-gray-100", children: job.operator })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u041F\u043E\u0440\u043E\u0433\u043E\u0432\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435" }), _jsx("p", { className: "text-gray-100 font-mono", children: job.threshold_value })] })] }), job.conditions[0]?.metric_description && (_jsx("div", { className: "mt-2 p-2 bg-gray-800 rounded text-xs", children: _jsx("p", { className: "text-gray-300", children: job.conditions[0].metric_description }) }))] }) })))] }), _jsxs("div", { className: "bg-gray-750 rounded-lg p-4 border border-gray-700 relative", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 mb-4 flex items-center", children: [_jsx(Terminal, { className: "text-green-400", size: 20 }), _jsxs("span", { className: "ml-2", children: ["\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F (", job.actions.length, ")"] }), _jsx("button", { className: "ml-auto text-gray-400 hover:text-blue-400", onClick: () => { setEditBlock('actions'); setEditData(job); }, title: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C", children: _jsx(Edit2, { size: 18 }) })] }), editBlock === 'actions' ? (_jsxs("div", { className: "space-y-6", children: [_jsx(ActionTypeSelector, { value: editData.actions[0]?.type || 'send_notification', onChange: (value) => {
                                                    const newActions = [{ type: value, config: {} }];
                                                    setEditData(d => ({ ...d, actions: newActions }));
                                                }, error: errors.action_type }), _jsx(ManagementDeviceSelector, { value: editData.device_id, onChange: (value) => setEditData(d => ({ ...d, device_id: value })), error: errors.device_id }), editData.actions[0]?.type === 'execute_command' && (_jsx(CommandTemplateSelector, { deviceId: editData.device_id, value: editData.command_template_id, onChange: (value) => setEditData(d => ({ ...d, command_template_id: value })), error: errors.command_template_id, onCommandSelect: (template, parameters, finalCommand) => {
                                                    // Обновляем действия с информацией о выбранной команде
                                                    const newActions = [{
                                                            type: 'execute_command',
                                                            config: {
                                                                command_template_id: template.id,
                                                                command_template_name: template.name,
                                                                command_template_category: template.category,
                                                                command_template_subcategory: template.subcategory,
                                                                command_parameters: parameters,
                                                                final_command: finalCommand,
                                                            }
                                                        }];
                                                    setEditData(d => ({
                                                        ...d,
                                                        command_template_id: template.id,
                                                        command: finalCommand,
                                                        actions: newActions
                                                    }));
                                                } })), _jsx(ActionParametersInput, { actionType: editData.actions[0]?.type || 'send_notification', value: editData.actions[0]?.config?.message || editData.command || '', onChange: (value) => {
                                                    const newActions = [...editData.actions];
                                                    if (newActions[0]) {
                                                        newActions[0].config = { ...newActions[0].config, message: value };
                                                    }
                                                    setEditData(d => ({
                                                        ...d,
                                                        actions: newActions,
                                                        command: value
                                                    }));
                                                }, error: errors.action_parameters }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx(Button, { onClick: () => handleSaveBlock('actions'), disabled: loading, children: loading ? 'Сохранение...' : 'Сохранить' }), _jsx(Button, { variant: "outline", onClick: () => setEditBlock(null), children: "\u041E\u0442\u043C\u0435\u043D\u0430" })] })] })) : (!job.device_id ? (_jsx("p", { className: "text-gray-400 text-center py-4", children: "\u041D\u0435\u0442 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439" })) : (_jsx("div", { className: "space-y-3", children: _jsxs("div", { className: "bg-gray-700 p-3 rounded-lg", children: [_jsx("div", { className: "flex items-center justify-between mb-2", children: _jsx("span", { className: "text-sm font-medium text-gray-300", children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F" }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F" }), _jsxs("p", { className: "text-gray-100 font-mono", children: ["ID: ", job.device_id] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u0422\u0438\u043F \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F" }), _jsx("p", { className: "text-gray-100", children: getActionTypeText(job.actions[0]?.type || 'send_notification') })] }), job.actions[0]?.config?.command_template_name && (_jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u0428\u0430\u0431\u043B\u043E\u043D \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsxs("p", { className: "text-gray-100", children: [job.actions[0].config.command_template_name, job.actions[0].config.command_template_category && (_jsxs("span", { className: "text-xs text-gray-400 block", children: [job.actions[0].config.command_template_category, job.actions[0].config.command_template_subcategory && (_jsxs("span", { children: [" \u2022 ", job.actions[0].config.command_template_subcategory] }))] }))] })] })), job.actions[0]?.config?.final_command && (_jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u0418\u0442\u043E\u0433\u043E\u0432\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430" }), _jsx("p", { className: "text-gray-100 font-mono bg-gray-800 p-2 rounded text-sm break-all", children: job.actions[0].config.final_command })] })), job.actions[0]?.config?.command_parameters && Object.keys(job.actions[0].config.command_parameters).length > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsx("div", { className: "bg-gray-800 p-2 rounded text-xs", children: Object.entries(job.actions[0].config.command_parameters).map(([key, value]) => (_jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { className: "text-gray-400", children: [key, ":"] }), _jsx("span", { className: "text-gray-100", children: String(value) })] }, key))) })] })), job.command && !job.actions[0]?.config?.final_command && (_jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u041A\u043E\u043C\u0430\u043D\u0434\u0430" }), _jsx("p", { className: "text-gray-100 font-mono", children: job.command })] })), job.command_template_id && !job.actions[0]?.config?.command_template_name && (_jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u0428\u0430\u0431\u043B\u043E\u043D \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsxs("p", { className: "text-gray-100 font-mono", children: ["ID: ", job.command_template_id] })] })), job.actions[0]?.config?.message && (_jsxs("div", { children: [_jsx("p", { className: "text-gray-400", children: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435" }), _jsx("p", { className: "text-gray-100 bg-gray-800 p-2 rounded text-sm", children: job.actions[0].config.message })] }))] })] }) })))] }), _jsxs("div", { className: "bg-gray-750 rounded-lg p-4 border border-gray-700", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-100 mb-4 flex items-center", children: [_jsx(Clock, { className: "text-yellow-400", size: 20 }), _jsx("span", { className: "ml-2", children: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0441\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u043D\u0438\u0439" })] }), execLoading ? (_jsx("p", { className: "text-gray-400", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })) : executions.length === 0 ? (_jsx("p", { className: "text-gray-400", children: "\u041D\u0435\u0442 \u0441\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u043D\u0438\u0439" })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-gray-400", children: [_jsx("th", { className: "px-2 py-1 text-left", children: "\u0414\u0430\u0442\u0430" }), _jsx("th", { className: "px-2 py-1 text-left", children: "\u0421\u0442\u0430\u0442\u0443\u0441" }), _jsx("th", { className: "px-2 py-1 text-left", children: "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442" }), _jsx("th", { className: "px-2 py-1 text-left", children: "\u041E\u0448\u0438\u0431\u043A\u0430" })] }) }), _jsx("tbody", { children: executions.map(exec => (_jsxs("tr", { className: "border-b border-gray-700", children: [_jsx("td", { className: "px-2 py-1", children: formatDate(exec.created_at) }), _jsx("td", { className: "px-2 py-1", children: _jsx("span", { className: exec.status === 'completed' && exec.success ? 'text-green-400' :
                                                                        exec.status === 'failed' || exec.success === false ? 'text-red-400' :
                                                                            'text-gray-300', children: exec.status }) }), _jsx("td", { className: "px-2 py-1", children: exec.prometheus_value || exec.output || '-' }), _jsx("td", { className: "px-2 py-1 text-red-400", children: exec.error_message || '-' })] }, exec.id))) })] }) }))] })] })] }) }) }));
};
export default JobDetailsModal;
