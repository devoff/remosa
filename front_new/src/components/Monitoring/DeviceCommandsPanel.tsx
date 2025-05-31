import { useState, useEffect } from 'react';
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
  deviceModel?: string;
  onClose: () => void;
}

export function DeviceCommandsPanel({ deviceId, deviceModel, onClose }: Props) {
  const [selectedCommand, setSelectedCommand] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [commandTemplates, setCommandTemplates] = useState<CommandTemplate[]>([]);
  const api = useApi();

  // Общие классы для полей ввода и выбора
  const inputClasses = "p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 w-full";

  useEffect(() => {
    const fetchCommandTemplates = async () => {
      if (!deviceModel) return;
      try {
        setLoading(true);
        const data: CommandTemplate[] = await api.get(`/commands/templates/${deviceModel}`);
        setCommandTemplates(data);
      } catch (error) {
        console.error('Ошибка получения шаблонов команд:', error);
        notification.error({
          message: 'Ошибка',
          description: 'Не удалось загрузить шаблоны команд'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCommandTemplates();
  }, [deviceModel, api]);

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
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Управление устройством {(deviceModel || 'Неизвестно').toString()}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
        >
          &times;
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="form-group flex flex-col">
          <label htmlFor="command-select" className="text-gray-700 dark:text-gray-300 mb-1">Выберите команду</label>
          <Select
            id="command-select"
            placeholder="Выберите команду"
            value={selectedCommand}
            onChange={setSelectedCommand}
            options={commandTemplates.map(cmd => ({
              label: `${cmd.name} (${cmd.category})`,
              value: cmd.id
            }))}
            className={inputClasses}
            style={{ width: '100%' }}
          />
        </div>

        {selectedCommand && (
          <div className="space-y-4">
            {commandTemplates
              .find(c => c.id === selectedCommand)
              ?.params_schema.map(param => (
                <div key={param.name} className="form-group flex flex-col">
                  <label htmlFor={`param-${param.name}`} className="text-gray-700 dark:text-gray-300 mb-1">{param.name}:</label>
                  <Input
                    id={`param-${param.name}`}
                    type={param.type === 'number' ? 'number' : 'text'}
                    className={inputClasses}
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
          className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition duration-300 w-full"
        >
          Отправить команду
        </Button>
      </div>
    </div>
  );
}
