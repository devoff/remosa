import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useApi } from '../../lib/useApi';
export const DeviceCommands = ({ device, commands }) => {
    const [selectedCommand, setSelectedCommand] = useState('');
    const [params, setParams] = useState({});
    const [isSending, setIsSending] = useState(false);
    const api = useApi();
    const handleCommandSubmit = async () => {
        if (!selectedCommand)
            return;
        setIsSending(true);
        try {
            const command = commands.find(c => String(c.id) === String(selectedCommand));
            if (!command)
                return;
            await api.post('/commands/execute', {
                device_id: device.id,
                template_id: command.id,
                params
            });
            alert('Команда успешно отправлена!');
        }
        catch (error) {
            console.error('Ошибка отправки команды:', error);
            alert('Ошибка отправки команды');
        }
        finally {
            setIsSending(false);
        }
    };
    const handleParamChange = (param, value) => {
        setParams({
            ...params,
            [param]: value
        });
    };
    return (_jsxs("div", { className: "device-commands", children: [_jsxs("h3", { children: ["\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E\u043C: ", device.name] }), _jsxs("div", { className: "command-selector", children: [_jsx("label", { children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443:" }), _jsxs("select", { value: selectedCommand, onChange: (e) => setSelectedCommand(e.target.value), children: [_jsx("option", { value: "", children: "-- \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 --" }), commands.map((cmd) => (_jsxs("option", { value: cmd.id, children: [cmd.name, " (", cmd.category, ")"] }, cmd.id)))] })] }), selectedCommand && (_jsxs("div", { className: "command-params", children: [_jsx("h4", { children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), commands
                        .find((c) => String(c.id) === String(selectedCommand))
                        ?.params_schema.properties && Object.keys(commands
                        .find((c) => String(c.id) === String(selectedCommand))
                        ?.params_schema.properties || {}).map((paramName) => {
                        const cmd = commands.find((c) => String(c.id) === String(selectedCommand));
                        const param = cmd?.params_schema.properties?.[paramName];
                        const isRequired = cmd?.params_schema.required?.includes(paramName);
                        if (!param)
                            return null; // Защита от undefined
                        return (_jsxs("div", { className: "param-field", children: [_jsxs("label", { children: [param.title || paramName, isRequired ? ' *' : '', ":"] }), _jsx("input", { type: param.type === 'number' || param.type === 'integer' ? 'number' : 'text', value: params[paramName] || '', onChange: (e) => handleParamChange(paramName, e.target.value) })] }, paramName));
                    })] })), _jsx("button", { onClick: handleCommandSubmit, disabled: !selectedCommand || isSending, children: isSending ? 'Отправка...' : 'Отправить команду' })] }));
};
