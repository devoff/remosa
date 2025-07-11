import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useExporterApi } from '../../lib/exporterApi';
import { MetricSelector as NewMetricSelector } from './MetricSelector';
import { CommandSelector as NewCommandSelector } from './CommandSelector';
export const PrometheusDeviceSelector = ({ value, onChange, error, onDeviceSelect }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const { getPrometheusDevices } = useExporterApi();
    useEffect(() => {
        const loadDevices = async () => {
            setLoading(true);
            try {
                const promDevices = await getPrometheusDevices();
                setDevices(promDevices);
            }
            catch (error) {
                console.error('Error loading prometheus devices:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadDevices();
    }, []);
    const handleDeviceChange = (deviceMac) => {
        onChange(deviceMac);
        const selectedDevice = devices.find(d => d.mac === deviceMac);
        if (selectedDevice && onDeviceSelect) {
            onDeviceSelect(selectedDevice);
        }
    };
    return (_jsxs("div", { children: [_jsx(Label, { children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430" }), _jsxs(Select, { value: value, onValueChange: handleDeviceChange, children: [_jsx(SelectTrigger, { children: devices.find(d => d.mac === value)?.display_name || (_jsx(SelectValue, { placeholder: loading ? "Загрузка..." : "Выберите устройство для мониторинга" })) }), _jsx(SelectContent, { className: "max-h-60 overflow-auto", children: devices.map((device) => (_jsx(SelectItem, { value: device.mac, children: device.display_name }, device.mac))) })] }), error && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: error }))] }));
};
export const MetricSelector = ({ deviceMac, value, onChange, error, onMetricSelect }) => {
    // Используем новый компонент с человекочитаемыми названиями
    return (_jsx(NewMetricSelector, { value: value, onChange: onChange, error: error, onMetricSelect: onMetricSelect }));
};
export const OperatorSelector = ({ value, onChange, error }) => {
    return (_jsxs("div", { children: [_jsx(Label, { children: "\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440" }), _jsxs(Select, { value: value, onValueChange: onChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043E\u043F\u0435\u0440\u0430\u0442\u043E\u0440" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: ">", children: "\u0411\u043E\u043B\u044C\u0448\u0435 \u0447\u0435\u043C" }), _jsx(SelectItem, { value: "<", children: "\u041C\u0435\u043D\u044C\u0448\u0435 \u0447\u0435\u043C" }), _jsx(SelectItem, { value: "=", children: "\u0420\u0430\u0432\u043D\u043E" }), _jsx(SelectItem, { value: "!=", children: "\u041D\u0435 \u0440\u0430\u0432\u043D\u043E" }), _jsx(SelectItem, { value: ">=", children: "\u0411\u043E\u043B\u044C\u0448\u0435 \u0438\u043B\u0438 \u0440\u0430\u0432\u043D\u043E" }), _jsx(SelectItem, { value: "<=", children: "\u041C\u0435\u043D\u044C\u0448\u0435 \u0438\u043B\u0438 \u0440\u0430\u0432\u043D\u043E" })] })] }), error && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: error }))] }));
};
export const ThresholdInput = ({ value, onChange, error, metric, operator }) => {
    return (_jsxs("div", { children: [_jsx(Label, { children: "\u041F\u043E\u0440\u043E\u0433\u043E\u0432\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435" }), _jsx(Input, { type: "text", value: value, onChange: (e) => onChange(e.target.value), placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u043E\u0440\u043E\u0433\u043E\u0432\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435" }), error && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: error }))] }));
};
export const ManagementDeviceSelector = ({ value, onChange, error, onDeviceSelect }) => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(false);
    const { getManagementDevices } = useExporterApi();
    useEffect(() => {
        const loadDevices = async () => {
            setLoading(true);
            try {
                const mgmtDevices = await getManagementDevices();
                setDevices(mgmtDevices);
            }
            catch (error) {
                console.error('Error loading management devices:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadDevices();
    }, []);
    const handleDeviceChange = (deviceId) => {
        const numDeviceId = parseInt(deviceId);
        onChange(numDeviceId);
        const selectedDevice = devices.find(d => d.id === numDeviceId);
        if (selectedDevice && onDeviceSelect) {
            onDeviceSelect(selectedDevice);
        }
    };
    return (_jsxs("div", { children: [_jsx(Label, { children: "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F" }), _jsxs(Select, { value: value?.toString(), onValueChange: handleDeviceChange, children: [_jsx(SelectTrigger, { children: devices.find(d => d.id === value)?.display_name || (_jsx(SelectValue, { placeholder: loading ? "Загрузка..." : "Выберите устройство для управления" })) }), _jsx(SelectContent, { className: "max-h-60 overflow-auto", children: devices.map((device) => (_jsx(SelectItem, { value: device.id.toString(), children: device.display_name }, device.id))) })] }), error && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: error }))] }));
};
export const CommandTemplateSelector = ({ deviceId, value, onChange, error, onCommandSelect }) => {
    // Используем новый компонент с параметризованными командами
    return (_jsx(NewCommandSelector, { deviceId: deviceId, value: value, onChange: onChange, error: error, onCommandSelect: onCommandSelect }));
};
export const ActionTypeSelector = ({ value, onChange, error }) => {
    return (_jsxs("div", { children: [_jsx(Label, { children: "\u0422\u0438\u043F \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F" }), _jsxs(Select, { value: value, onValueChange: onChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0442\u0438\u043F \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "send_notification", children: "SMS \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435" }), _jsx(SelectItem, { value: "execute_command", children: "\u0412\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443" }), _jsx(SelectItem, { value: "webhook", children: "Webhook" })] })] }), error && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: error }))] }));
};
export const ActionParametersInput = ({ actionType, value, onChange, error }) => {
    const getPlaceholder = () => {
        switch (actionType) {
            case 'send_notification':
                return 'Введите текст SMS сообщения';
            case 'execute_command':
                return 'Введите команду';
            case 'webhook':
                return 'Введите URL webhook';
            default:
                return 'Введите параметры';
        }
    };
    return (_jsxs("div", { children: [_jsx(Label, { children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B" }), _jsx(Input, { type: "text", value: value, onChange: (e) => onChange(e.target.value), placeholder: getPlaceholder() }), error && (_jsx("p", { className: "text-red-400 text-sm mt-1", children: error }))] }));
};
