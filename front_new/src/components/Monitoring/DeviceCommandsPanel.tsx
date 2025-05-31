import { useState } from 'react';
import { Button, Select, Input, notification } from 'antd';
import { useApi } from '../../lib/useApi';

interface CommandTemplate {
  id: string;
  name: string;
  category: string;
  params_schema: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
}

interface Props {
  deviceId: string;
  deviceModel: string;
  commands: CommandTemplate[];
}

export default function DeviceCommandsPanel({ deviceId, deviceModel, commands }: Props) {
  const [selectedCommand, setSelectedCommand] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleExecute = async () => {
    if (!selectedCommand) return;

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
    } catch (error) {
      notification.error({
        message: 'Ошибка',
        description: 'Не удалось отправить команду'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="device-commands-panel">
      <h3>Управление устройством {deviceModel}</h3>
      
      <div className="command-selector">
        <Select
          placeholder="Выберите команду"
          value={selectedCommand}
          onChange={setSelectedCommand}
          options={commands.map(cmd => ({
            label: `${cmd.name} (${cmd.category})`,
            value: cmd.id
          }))}
          style={{ width: '100%' }}
        />
      </div>

      {selectedCommand && (
        <div className="command-params">
          {commands
            .find(c => c.id === selectedCommand)
            ?.params_schema.map(param => (
              <div key={param.name} className="param-field">
                <label>{param.name}:</label>
                <Input
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={params[param.name] || ''}
                  onChange={(e) => setParams({
                    ...params,
                    [param.name]: e.target.value
                  })}
                  required={param.required}
                />
              </div>
            ))}
        </div>
      )}

      <Button 
        type="primary" 
        onClick={handleExecute}
        loading={loading}
        disabled={!selectedCommand}
      >
        Отправить команду
      </Button>
    </div>
  );
}
