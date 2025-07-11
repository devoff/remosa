import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Card, Spin, Typography, Alert, Switch } from 'antd';
import { useApi } from '../lib/useApi';
const { Option, OptGroup } = Select;
const { Title, Text } = Typography;
export const DeviceCommandsPanel = ({ device, onClose }) => {
    const [form] = Form.useForm();
    const { get, post } = useApi();
    const [commandTemplates, setCommandTemplates] = useState([]);
    const [selectedCommand, setSelectedCommand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sendingCommand, setSendingCommand] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchCommandTemplates = async () => {
            try {
                setLoading(true);
                console.log('Загрузка шаблонов команд для модели:', device.model);
                const data = await get(`/api/v1/commands/templates/${device.model}`);
                setCommandTemplates(data);
                console.log('Шаблоны команд успешно загружены:', data);
            }
            catch (err) {
                console.error('Ошибка при загрузке шаблонов команд:', err);
                setError('Не удалось загрузить шаблоны команд.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchCommandTemplates();
    }, [device.model, get]);
    const onCommandSelect = (templateId) => {
        console.log('Выбрана команда с ID:', templateId);
        const cmd = commandTemplates.find((t) => String(t.id) === String(templateId));
        setSelectedCommand(cmd || null);
        form.setFieldsValue({ command_template_id: templateId });
        setResponse(null);
        setError(null);
        console.log('Установлена выбранная команда:', cmd);
    };
    const onFinish = async (values) => {
        if (!selectedCommand) {
            setError('Выберите команду для отправки.');
            console.error('Ошибка: Попытка отправить команду без выбора шаблона.');
            return;
        }
        setSendingCommand(true);
        setResponse(null);
        setError(null);
        console.log('Значения формы перед отправкой:', values);
        try {
            const { command_template_id, ...commandParams } = values;
            const payload = {
                device_id: device.id,
                template_id: selectedCommand.id,
                params: commandParams,
            };
            console.log('Отправка команды с полезной нагрузкой:', payload);
            const result = await post('/api/v1/commands/execute', payload);
            setResponse(JSON.stringify(result, null, 2));
            console.log('Команда успешно отправлена. Ответ:', result);
        }
        catch (err) {
            console.error('Критическая ошибка при отправке команды:', err);
            setError(`Ошибка при отправке команды: ${err.message || 'Неизвестная ошибка'}`);
        }
        finally {
            setSendingCommand(false);
        }
    };
    if (loading) {
        return _jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043E\u043C\u0430\u043D\u0434..." });
    }
    if (error && !commandTemplates.length) {
        return _jsx(Alert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true });
    }
    return (_jsx(Card, { title: `Команды для ${device.name}`, style: { width: '100%' }, children: _jsxs(Form, { form: form, layout: "vertical", onFinish: onFinish, children: [_jsx(Form.Item, { label: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443", name: "command_template_id", rules: [{ required: true, message: 'Пожалуйста, выберите команду!' }], children: _jsx(Select, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443", onChange: onCommandSelect, children: Object.entries(commandTemplates.reduce((acc, template) => {
                            const category = template.category || 'Без категории';
                            if (!acc[category]) {
                                acc[category] = [];
                            }
                            acc[category].push(template);
                            return acc;
                        }, {})).map(([category, templates]) => (_jsx(OptGroup, { label: category, children: (templates || []).map((template) => (_jsx(Option, { value: template.id, children: template.name }, template.id))) }, category))) }) }), selectedCommand?.params_schema?.properties && Object.entries(selectedCommand.params_schema.properties).map(([paramName, param]) => {
                    const isRequired = selectedCommand.params_schema.required?.includes(paramName);
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
                        inputComponent = (_jsx(Select, { placeholder: param.title || paramName, children: param.enum.map((option) => (_jsx(Option, { value: option, children: String(option) }, option))) }));
                    }
                    return (_jsx(Form.Item, { label: param.title || paramName, name: paramName, rules: [{ required: isRequired, message: `Пожалуйста, введите ${param.title || paramName}!` }], children: inputComponent }, paramName));
                }), _jsx(Form.Item, { children: _jsx(Button, { type: "primary", htmlType: "submit", loading: sendingCommand, disabled: !selectedCommand, children: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443" }) }), response && (_jsx(Alert, { message: "\u041E\u0442\u0432\u0435\u0442 API", description: _jsx("pre", { children: response }), type: "success", showIcon: true, closable: true, onClose: () => setResponse(null) })), error && (_jsx(Alert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true, closable: true, onClose: () => setError(null) }))] }) }));
};
