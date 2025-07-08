import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button, Select, Input, notification } from 'antd';
import { useApi } from '../../lib/useApi';
export function DeviceCommandsPanel({ deviceId, deviceModel, onClose }) {
    const [selectedCommand, setSelectedCommand] = useState('');
    const [params, setParams] = useState({});
    const [loading, setLoading] = useState(false);
    const [commandTemplates, setCommandTemplates] = useState([]);
    const api = useApi();
    // Общие классы для полей ввода и выбора
    const inputClasses = "p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 w-full";
    useEffect(() => {
        const fetchCommandTemplates = async () => {
            if (!deviceModel)
                return;
            try {
                setLoading(true);
                const data = await api.get(`/commands/templates/${deviceModel}`);
                setCommandTemplates(data);
            }
            catch (error) {
                console.error('Ошибка получения шаблонов команд:', error);
                notification.error({
                    message: 'Ошибка',
                    description: 'Не удалось загрузить шаблоны команд'
                });
            }
            finally {
                setLoading(false);
            }
        };
        fetchCommandTemplates();
    }, [deviceModel, api]);
    const handleExecute = async () => {
        if (!selectedCommand)
            return;
        setLoading(true);
        try {
            await api.post('/commands/execute', {
                device_id: deviceId,
                template_id: selectedCommand,
                params
            });
            notification.success({
                message: 'Команда отправлена',
                description: `Команда успешно отправлена устройству ${deviceId}`
            });
        }
        catch (error) {
            notification.error({
                message: 'Ошибка',
                description: 'Не удалось отправить команду'
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto relative", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h3", { className: "text-xl font-semibold text-gray-800 dark:text-gray-100", children: ["\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E\u043C ", (deviceModel || 'Неизвестно').toString()] }), _jsx("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700 text-2xl leading-none", children: "\u00D7" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "form-group flex flex-col", children: [_jsx("label", { htmlFor: "command-select", className: "text-gray-700 dark:text-gray-300 mb-1", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443" }), _jsx(Select, { id: "command-select", placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443", value: selectedCommand, onChange: setSelectedCommand, options: commandTemplates.map(cmd => ({
                                    label: `${cmd.name} (${cmd.category})`,
                                    value: cmd.id
                                })), className: inputClasses, style: { width: '100%' } })] }), selectedCommand && (_jsx("div", { className: "space-y-4", children: commandTemplates
                            .find(c => c.id === selectedCommand)
                            ?.params_schema.map(param => (_jsxs("div", { className: "form-group flex flex-col", children: [_jsxs("label", { htmlFor: `param-${param.name}`, className: "text-gray-700 dark:text-gray-300 mb-1", children: [param.name, ":"] }), _jsx(Input, { id: `param-${param.name}`, type: param.type === 'number' ? 'number' : 'text', className: inputClasses, value: params[param.name] || '', onChange: (e) => setParams({
                                        ...params,
                                        [param.name]: e.target.value
                                    }), required: param.required })] }, param.name))) })), _jsx(Button, { type: "primary", onClick: handleExecute, loading: loading, disabled: !selectedCommand, className: "px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition duration-300 w-full", children: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443" })] })] }));
}
