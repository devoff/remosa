import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExporterApi } from '../../lib/exporterApi';
import { useNotification } from '../NotificationProvider';
import { api } from '../../lib/api';
const JobDialog = ({ job, onClose, onSave }) => {
    const [currentStep, setCurrentStep] = useState('monitoring');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        job_type: 'alert',
        conditions: [],
        actions: [],
        is_active: true,
        platform_id: 1, // Будет получено из контекста пользователя
        monitoring_device_mac: '',
        monitoring_metric: '',
        operator: '',
        threshold_value: '',
        device_id: undefined,
        command: '',
        command_template_id: undefined
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [prometheusDevices, setPrometheusDevices] = useState([]);
    const [managementDevices, setManagementDevices] = useState([]);
    const [availableMetrics, setAvailableMetrics] = useState([]);
    const [selectedDeviceMetrics, setSelectedDeviceMetrics] = useState({});
    const [deviceCommands, setDeviceCommands] = useState([]);
    const [selectedCommandTemplate, setSelectedCommandTemplate] = useState(null);
    const { createJob, updateJob, getPrometheusDevices, getManagementDevices, getDeviceMetrics, generateJobName } = useExporterApi();
    const { notify } = useNotification();
    useEffect(() => {
        if (job) {
            setFormData({
                name: job.name,
                description: job.description || '',
                job_type: job.job_type,
                conditions: job.conditions,
                actions: job.actions,
                is_active: job.is_active,
                platform_id: job.platform_id,
                monitoring_device_mac: job.monitoring_device_mac || '',
                monitoring_metric: job.monitoring_metric || '',
                operator: job.operator || '',
                threshold_value: job.threshold_value || '',
                device_id: job.device_id,
                command: job.command || '',
                command_template_id: job.command_template_id
            });
        }
        loadDevices();
    }, [job]);
    const loadDevices = async () => {
        try {
            const [promDevices, mgmtDevices] = await Promise.all([
                getPrometheusDevices(),
                getManagementDevices()
            ]);
            console.log('Loaded prometheus devices:', promDevices);
            setPrometheusDevices(promDevices);
            setManagementDevices(mgmtDevices);
        }
        catch (error) {
            console.error('Error loading devices:', error);
            notify('Ошибка загрузки устройств', 'error');
        }
    };
    const loadDeviceMetrics = async (deviceMac) => {
        try {
            const metrics = await getDeviceMetrics(deviceMac);
            console.log('Ответ бэкенда на getDeviceMetrics:', metrics);
            setSelectedDeviceMetrics(metrics.metrics);
            setAvailableMetrics(Object.keys(metrics.metrics));
        }
        catch (error) {
            notify('Ошибка загрузки метрик устройства', 'error');
        }
    };
    const generateName = async () => {
        if (!formData.monitoring_device_mac || !formData.monitoring_metric || !formData.operator || !formData.threshold_value) {
            return;
        }
        try {
            const result = await generateJobName(formData.monitoring_device_mac, formData.monitoring_metric, formData.operator, formData.threshold_value);
            setFormData(prev => ({ ...prev, name: result.name }));
        }
        catch (error) {
            notify('Ошибка генерации имени', 'error');
        }
    };
    const validateStep = (step) => {
        const newErrors = {};
        switch (step) {
            case 'monitoring':
                if (!formData.monitoring_device_mac) {
                    newErrors.monitoring_device_mac = 'Выберите устройство для мониторинга';
                }
                break;
            case 'condition':
                if (!formData.monitoring_metric) {
                    newErrors.monitoring_metric = 'Выберите метрику';
                }
                if (!formData.operator) {
                    newErrors.operator = 'Выберите оператор';
                }
                if (!formData.threshold_value) {
                    newErrors.threshold_value = 'Введите пороговое значение';
                }
                break;
            case 'action':
                if (!formData.device_id) {
                    newErrors.device_id = 'Выберите устройство для управления';
                }
                if (!formData.command) {
                    newErrors.command = 'Введите команду';
                }
                break;
            case 'review':
                if (!formData.name)
                    newErrors.name = 'Название обязательно';
                if (!formData.device_id)
                    newErrors.device_id = 'Устройство обязательно';
                if (!formData.command)
                    newErrors.command = 'Команда обязательна';
                if (!formData.monitoring_device_mac)
                    newErrors.monitoring_device_mac = 'Устройство мониторинга обязательно';
                if (!formData.monitoring_metric)
                    newErrors.monitoring_metric = 'Метрика обязательна';
                if (!formData.operator)
                    newErrors.operator = 'Оператор обязателен';
                if (!formData.threshold_value)
                    newErrors.threshold_value = 'Порог обязателен';
                break;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const nextStep = () => {
        if (validateStep(currentStep)) {
            switch (currentStep) {
                case 'monitoring':
                    setCurrentStep('condition');
                    break;
                case 'condition':
                    setCurrentStep('action');
                    break;
                case 'action':
                    setCurrentStep('review');
                    break;
            }
        }
    };
    const prevStep = () => {
        switch (currentStep) {
            case 'condition':
                setCurrentStep('monitoring');
                break;
            case 'action':
                setCurrentStep('condition');
                break;
            case 'review':
                setCurrentStep('action');
                break;
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('[JobDialog] handleSubmit', { currentStep, formData });
        if (!validateStep(currentStep))
            return;
        try {
            setLoading(true);
            let result;
            if (job) {
                console.log('[JobDialog] updateJob called', { id: job.id, formData });
                result = await updateJob(job.id, formData);
                console.log('[JobDialog] updateJob result:', result);
                notify('Задание обновлено', 'success');
            }
            else {
                console.log('[JobDialog] createJob called', formData);
                result = await createJob(formData);
                console.log('[JobDialog] createJob result:', result);
                notify('Задание создано', 'success');
            }
            onSave();
            onClose();
        }
        catch (error) {
            notify('Ошибка при сохранении', 'error');
            console.error('[JobDialog] error:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getStepProgress = () => {
        const steps = ['monitoring', 'condition', 'action', 'review'];
        const currentIndex = steps.indexOf(currentStep);
        return ((currentIndex + 1) / steps.length) * 100;
    };
    const renderMonitoringStep = () => {
        console.log('Rendering monitoring step with:', {
            prometheusDevices: prometheusDevices.length,
            selectedValue: formData.monitoring_device_mac,
            devices: prometheusDevices.slice(0, 3) // первые 3 устройства для проверки
        });
        return (_jsx("div", { className: "space-y-6", children: _jsxs("div", { children: [_jsx(Label, { children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430" }), _jsxs(Select, { value: formData.monitoring_device_mac, onValueChange: (value) => {
                            setFormData(prev => {
                                const newData = { ...prev, monitoring_device_mac: value };
                                return newData;
                            });
                            if (value) {
                                loadDeviceMetrics(value);
                            }
                        }, children: [_jsx(SelectTrigger, { children: prometheusDevices.find(d => d.mac === formData.monitoring_device_mac)?.display_name || (_jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430" })) }), _jsx(SelectContent, { className: "max-h-60 overflow-auto", children: prometheusDevices.map((device) => (_jsx(SelectItem, { value: device.mac, children: device.display_name }, device.mac))) })] }), errors.monitoring_device_mac && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.monitoring_device_mac }))] }) }));
    };
    const renderConditionStep = () => (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx(Label, { children: "\u041C\u0435\u0442\u0440\u0438\u043A\u0430" }), _jsxs(Select, { value: formData.monitoring_metric, onValueChange: (value) => setFormData(prev => ({ ...prev, monitoring_metric: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u0435\u0442\u0440\u0438\u043A\u0443" }) }), _jsx(SelectContent, { children: availableMetrics.map((metric) => (_jsx(SelectItem, { value: metric, children: metric === 'device_status'
                                        ? _jsxs(_Fragment, { children: ["\u0421\u0442\u0430\u0442\u0443\u0441 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 (1 \u2014 \u043E\u043D\u043B\u0430\u0439\u043D, 0 \u2014 \u043E\u0444\u043B\u0430\u0439\u043D)", _jsx("span", { title: "1 \u2014 \u043E\u043D\u043B\u0430\u0439\u043D, 0 \u2014 \u043E\u0444\u043B\u0430\u0439\u043D. \u0415\u0441\u043B\u0438 \u043E\u0444\u043B\u0430\u0439\u043D, \u043C\u043E\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C.", style: { marginLeft: 6, color: '#aaa', cursor: 'help' }, children: "?" }), selectedDeviceMetrics[metric] ? ` (${selectedDeviceMetrics[metric]})` : ''] })
                                        : metric }, metric))) })] }), errors.monitoring_metric && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.monitoring_metric }))] }), _jsxs("div", { children: [_jsx(Label, { children: "\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440" }), _jsxs(Select, { value: formData.operator, onValueChange: (value) => {
                            setFormData(prev => {
                                // Автоматическая подстановка действия 'перезагрузить' при выборе 'Равно 0' для статуса
                                if (prev.monitoring_metric === 'device_status' &&
                                    value === '=' &&
                                    prev.threshold_value === '0') {
                                    return { ...prev, operator: value, command: 'перезагрузить' };
                                }
                                return { ...prev, operator: value };
                            });
                        }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043E\u043F\u0435\u0440\u0430\u0442\u043E\u0440" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: ">", children: "\u0411\u043E\u043B\u044C\u0448\u0435 \u0447\u0435\u043C" }), _jsx(SelectItem, { value: "<", children: "\u041C\u0435\u043D\u044C\u0448\u0435 \u0447\u0435\u043C" }), _jsx(SelectItem, { value: "=", children: "\u0420\u0430\u0432\u043D\u043E" }), _jsx(SelectItem, { value: "!=", children: "\u041D\u0435 \u0440\u0430\u0432\u043D\u043E" }), _jsx(SelectItem, { value: ">=", children: "\u0411\u043E\u043B\u044C\u0448\u0435 \u0438\u043B\u0438 \u0440\u0430\u0432\u043D\u043E" }), _jsx(SelectItem, { value: "<=", children: "\u041C\u0435\u043D\u044C\u0448\u0435 \u0438\u043B\u0438 \u0440\u0430\u0432\u043D\u043E" })] })] }), errors.operator && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.operator }))] }), _jsxs("div", { children: [_jsx(Label, { children: "\u041F\u043E\u0440\u043E\u0433\u043E\u0432\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435" }), _jsx(Input, { type: "text", value: formData.threshold_value, onChange: (e) => {
                            const value = e.target.value;
                            setFormData(prev => {
                                // Автоматическая подстановка действия 'перезагрузить' при выборе 'Равно 0' для статуса
                                if (prev.monitoring_metric === 'device_status' &&
                                    prev.operator === '=' &&
                                    value === '0') {
                                    return { ...prev, threshold_value: value, command: 'перезагрузить' };
                                }
                                return { ...prev, threshold_value: value };
                            });
                        }, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u043E\u0440\u043E\u0433\u043E\u0432\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435" }), errors.threshold_value && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.threshold_value }))] }), _jsxs("div", { children: [_jsx(Label, { children: "\u0423\u0441\u043B\u043E\u0432\u0438\u044F" }), formData.conditions.map((cond, idx) => (_jsxs("div", { className: "flex gap-2 items-center mb-2", children: [_jsx(Input, { value: cond.field, onChange: e => {
                                    const newConds = [...formData.conditions];
                                    newConds[idx].field = e.target.value;
                                    setFormData(prev => ({ ...prev, conditions: newConds }));
                                }, placeholder: "\u041F\u043E\u043B\u0435" }), _jsxs(Select, { value: cond.operator, onValueChange: value => {
                                    const newConds = [...formData.conditions];
                                    newConds[idx].operator = value;
                                    setFormData(prev => ({ ...prev, conditions: newConds }));
                                }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "equals", children: "\u0420\u0430\u0432\u043D\u043E" }), _jsx(SelectItem, { value: "not_equals", children: "\u041D\u0435 \u0440\u0430\u0432\u043D\u043E" }), _jsx(SelectItem, { value: "contains", children: "\u0421\u043E\u0434\u0435\u0440\u0436\u0438\u0442" }), _jsx(SelectItem, { value: "greater_than", children: "\u0411\u043E\u043B\u044C\u0448\u0435" }), _jsx(SelectItem, { value: "less_than", children: "\u041C\u0435\u043D\u044C\u0448\u0435" })] })] }), _jsx(Input, { value: cond.value, onChange: e => {
                                    const newConds = [...formData.conditions];
                                    newConds[idx].value = e.target.value;
                                    setFormData(prev => ({ ...prev, conditions: newConds }));
                                }, placeholder: "\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435" }), _jsx(Button, { type: "button", onClick: () => {
                                    setFormData(prev => ({
                                        ...prev,
                                        conditions: prev.conditions.filter((_, i) => i !== idx)
                                    }));
                                }, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] }, idx))), _jsx(Button, { type: "button", onClick: () => setFormData(prev => ({
                            ...prev,
                            conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }]
                        })), children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0441\u043B\u043E\u0432\u0438\u0435" })] })] }));
    const renderActionStep = () => (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx(Label, { children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F" }), _jsxs(Select, { value: formData.device_id?.toString(), onValueChange: async (value) => {
                            const selectedDevice = managementDevices.find(d => d.id.toString() === value);
                            setFormData(prev => ({ ...prev, device_id: parseInt(value), command: '' }));
                            setSelectedCommandTemplate(null);
                            setDeviceCommands([]);
                            if (selectedDevice && selectedDevice.model) {
                                try {
                                    const templates = await api.getCommandTemplatesByModel(selectedDevice.model);
                                    setDeviceCommands(templates);
                                }
                                catch (e) {
                                    setDeviceCommands([]);
                                }
                            }
                        }, children: [_jsx(SelectTrigger, { children: managementDevices.find(d => d.id?.toString() === formData.device_id?.toString())?.display_name || (_jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F" })) }), _jsx(SelectContent, { className: "max-h-60 overflow-auto", children: managementDevices.map((device) => (_jsx(SelectItem, { value: device.id.toString(), children: device.display_name }, device.id))) })] }), errors.device_id && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.device_id }))] }), deviceCommands.length > 0 && (_jsxs("div", { children: [_jsx(Label, { children: "\u0428\u0430\u0431\u043B\u043E\u043D \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsxs(Select, { value: selectedCommandTemplate?.id?.toString() || '', onValueChange: (value) => {
                            const template = deviceCommands.find(cmd => cmd.id.toString() === value);
                            setSelectedCommandTemplate(template || null);
                            setFormData(prev => ({
                                ...prev,
                                command: template ? template.template : ''
                            }));
                        }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443" }) }), _jsx(SelectContent, { className: "max-h-60 overflow-auto", children: deviceCommands.map(cmd => (_jsxs(SelectItem, { value: cmd.id.toString(), children: [cmd.name, " ", cmd.description ? `— ${cmd.description}` : ''] }, cmd.id))) })] })] })), _jsxs("div", { children: [_jsx(Label, { children: "SMS \u043A\u043E\u043C\u0430\u043D\u0434\u0430" }), _jsx(Input, { type: "text", value: formData.command, onChange: (e) => setFormData(prev => ({ ...prev, command: e.target.value })), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 SMS \u043A\u043E\u043C\u0430\u043D\u0434\u0443" }), errors.command && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: errors.command }))] }), _jsxs("div", { children: [_jsx(Label, { children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F" }), formData.actions.map((act, idx) => (_jsxs("div", { className: "flex gap-2 items-center mb-2", children: [_jsxs(Select, { value: act.type, onValueChange: value => {
                                    const newActs = [...formData.actions];
                                    newActs[idx].type = value;
                                    setFormData(prev => ({ ...prev, actions: newActs }));
                                }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0422\u0438\u043F" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "send_notification", children: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435" }), _jsx(SelectItem, { value: "execute_command", children: "\u041A\u043E\u043C\u0430\u043D\u0434\u0430" }), _jsx(SelectItem, { value: "webhook", children: "Webhook" })] })] }), _jsx(Input, { value: act.config?.message || '', onChange: e => {
                                    const newActs = [...formData.actions];
                                    newActs[idx].config = { ...newActs[idx].config, message: e.target.value };
                                    setFormData(prev => ({ ...prev, actions: newActs }));
                                }, placeholder: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435/\u043A\u043E\u043C\u0430\u043D\u0434\u0430" }), _jsx(Button, { type: "button", onClick: () => {
                                    setFormData(prev => ({
                                        ...prev,
                                        actions: prev.actions.filter((_, i) => i !== idx)
                                    }));
                                }, children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] }, idx))), _jsx(Button, { type: "button", onClick: () => setFormData(prev => ({
                            ...prev,
                            actions: [...prev.actions, { type: 'send_notification', config: { message: '' } }]
                        })), children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435" })] })] }));
    const renderReviewStep = () => (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx(Label, { children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u043D\u0438\u044F" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "text", value: formData.name, onChange: (e) => setFormData(prev => ({ ...prev, name: e.target.value })), placeholder: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u043D\u0438\u044F" }), _jsx(Button, { type: "button", onClick: generateName, variant: "outline", children: "\u0421\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C" })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)" }), _jsx(Input, { type: "text", value: formData.description || '', onChange: (e) => setFormData(prev => ({ ...prev, description: e.target.value })), placeholder: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u043D\u0438\u044F" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm", children: "\u0421\u0432\u043E\u0434\u043A\u0430 \u0437\u0430\u0434\u0430\u043D\u0438\u044F" }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430:" }), _jsx("span", { className: "font-medium", children: prometheusDevices.find(d => d.mac === formData.monitoring_device_mac)?.display_name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u0423\u0441\u043B\u043E\u0432\u0438\u0435:" }), _jsxs("span", { className: "font-medium", children: [formData.monitoring_metric, " ", formData.operator, " ", formData.threshold_value] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F:" }), _jsx("span", { className: "font-medium", children: managementDevices.find(d => d.id === formData.device_id)?.display_name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "\u041A\u043E\u043C\u0430\u043D\u0434\u0430:" }), _jsx("span", { className: "font-medium", children: formData.command })] })] })] })] }));
    const renderStepContent = () => {
        switch (currentStep) {
            case 'monitoring':
                return renderMonitoringStep();
            case 'condition':
                return renderConditionStep();
            case 'action':
                return renderActionStep();
            case 'review':
                return renderReviewStep();
            default:
                return null;
        }
    };
    const getStepTitle = () => {
        switch (currentStep) {
            case 'monitoring':
                return 'Выбор устройства для мониторинга';
            case 'condition':
                return 'Настройка условия';
            case 'action':
                return 'Настройка действия';
            case 'review':
                return 'Проверка и сохранение';
            default:
                return '';
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx("div", { className: "bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-100", children: job ? 'Редактировать задание' : 'Создать задание' }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-200 transition-colors", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex justify-between text-sm text-gray-400 mb-2", children: [_jsxs("span", { children: ["\u0428\u0430\u0433 ", ['monitoring', 'condition', 'action', 'review'].indexOf(currentStep) + 1, " \u0438\u0437 4"] }), _jsx("span", { children: getStepTitle() })] }), _jsx(Progress, { value: getStepProgress(), className: "h-2" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [renderStepContent(), _jsxs("div", { className: "flex justify-between pt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: prevStep, disabled: currentStep === 'monitoring', children: "\u041D\u0430\u0437\u0430\u0434" }), _jsx("div", { className: "flex gap-2", children: currentStep !== 'review' ? (_jsx(Button, { type: "button", onClick: nextStep, children: "\u0414\u0430\u043B\u0435\u0435" })) : (_jsx(Button, { type: "submit", disabled: loading, children: loading ? 'Сохранение...' : (job ? 'Обновить' : 'Создать') })) })] })] })] }) }) }));
};
export default JobDialog;
