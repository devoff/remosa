import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, Card, Spin, Typography, Alert, Switch, Table, Tag, message } from 'antd';
import { Device, CommandTemplate } from '../types';
import { useApi } from '../lib/useApi';

const { Option, OptGroup } = Select;
const { Title, Text } = Typography;

interface DeviceCommandsPanelProps {
  device: Device;
  onClose: () => void;
}

export const DeviceCommandsPanel: React.FC<DeviceCommandsPanelProps> = ({ device, onClose }: DeviceCommandsPanelProps) => {
  const [form] = Form.useForm();
  const { get, post } = useApi();
  const [commandTemplates, setCommandTemplates] = useState<CommandTemplate[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<CommandTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingCommand, setSendingCommand] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!device) return;
      try {
        setLoading(true);
        if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
          console.log('Загрузка шаблонов команд для модели:', device.model);
        }
        const data = await get(`/commands/templates/${device.model}`);
        setCommandTemplates(data);
        setSelectedCommand(null);
        if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
          console.log('Шаблоны команд успешно загружены:', data);
        }
      } catch (err) {
        console.error('Ошибка при загрузке шаблонов команд:', err);
        setError('Не удалось загрузить шаблоны команд.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [device.model, get]);

  const onCommandSelect = (templateId: string) => {
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
      console.log('Выбрана команда с ID:', templateId);
    }
    const cmd = commandTemplates.find((t: CommandTemplate) => String(t.id) === String(templateId));
    setSelectedCommand(cmd || null);
    form.setFieldsValue({ command_template_id: templateId });
    setResponse(null);
    setError(null);
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
      console.log('Установлена выбранная команда:', cmd);
    }
  };

  const onFinish = async (values: any) => {
    if (!selectedCommand) {
      setError('Выберите команду для отправки.');
      console.error('Ошибка: Попытка отправить команду без выбора шаблона.');
      return;
    }

    setSendingCommand(true);
    setResponse(null);
    setError(null);

    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
      console.log('Значения формы перед отправкой:', values);
    }

    try {
      const { command_template_id, ...commandParams } = values;

      const payload = {
        device_id: device.id,
        template_id: selectedCommand.id,
        params: commandParams,
      };
      if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('Отправка команды с полезной нагрузкой:', payload);
      }
      const result = await post('/commands/execute', payload);
      setResponse(JSON.stringify(result, null, 2));
      if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('Команда успешно отправлена. Ответ:', result);
      }
      message.success('Команда успешно выполнена!');
      onClose();
    } catch (err: any) {
      console.error('Критическая ошибка при отправке команды:', err);
      setError(`Ошибка при отправке команды: ${err.message || 'Неизвестная ошибка'}`);
    } finally {
      setSendingCommand(false);
    }
  };

  if (loading) {
    return <Spin tip="Загрузка команд..." />;
  }

  if (error && !commandTemplates.length) {
    return <Alert message="Ошибка" description={error} type="error" showIcon />;
  }

  return (
    <Card title={`Команды для ${device.name}`} style={{ width: '100%' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item label="Выберите команду" name="command_template_id" rules={[{ required: true, message: 'Пожалуйста, выберите команду!' }]}>
          <Select placeholder="Выберите команду" onChange={onCommandSelect}>
            {Object.entries((commandTemplates || []).reduce((acc: Record<string, CommandTemplate[]>, template: CommandTemplate) => {
              const category = template.category || 'Без категории';
              if (!acc[category]) {
                acc[category] = [];
              }
              acc[category].push(template);
              return acc;
            }, {} as Record<string, CommandTemplate[]>) || {}).map(([category, templates]) => (
              <OptGroup key={category} label={category}>
                {(templates || []).map((template: CommandTemplate) => (
                  <Option key={template.id} value={template.id}>{template.name}</Option>
                ))}
              </OptGroup>
            ))}
          </Select>
        </Form.Item>

        {selectedCommand?.params_schema?.properties && Object.entries(selectedCommand.params_schema.properties || {}).map(([paramName, param]: [string, { type: string; title?: string; pattern?: string; enum?: any[]; }]) => {
          const isRequired = selectedCommand.params_schema.required?.includes(paramName);
          
          let inputComponent;
          if (param.type === 'string') {
            inputComponent = <Input placeholder={param.title || paramName} />;
          } else if (param.type === 'number' || param.type === 'integer') {
            inputComponent = <Input type="number" placeholder={param.title || paramName} />;
          } else if (param.type === 'boolean') {
            inputComponent = <Switch checkedChildren="Вкл" unCheckedChildren="Выкл" />;
          } else if (param.enum) {
            inputComponent = (
              <Select placeholder={param.title || paramName}>
                {param.enum.map((option: any) => (
                  <Option key={option} value={option}>{String(option)}</Option>
                ))}
              </Select>
            );
          }

          return (
            <Form.Item
              key={paramName}
              label={param.title || paramName}
              name={paramName}
              rules={[{ required: isRequired, message: `Пожалуйста, введите ${param.title || paramName}!` }]}
            >
              {inputComponent}
            </Form.Item>
          );
        })}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={sendingCommand} disabled={!selectedCommand}>
            Отправить команду
          </Button>
        </Form.Item>

        {response && (
          <Alert
            message="Ответ API"
            description={<pre>{response}</pre>}
            type="success"
            showIcon
            closable
            onClose={() => setResponse(null)}
          />
        )}

        {error && (
          <Alert
            message="Ошибка"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}
      </Form>
    </Card>
  );
};