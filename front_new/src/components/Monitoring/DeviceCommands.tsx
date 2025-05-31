import React, { useState } from 'react';
import { useApi } from '../../lib/useApi';
import { Device, CommandTemplate } from '../../types';

interface Props {
  device: Device;
  commands: CommandTemplate[];
}

export const DeviceCommands: React.FC<Props> = ({ device, commands }: Props) => {
  const [selectedCommand, setSelectedCommand] = useState<string>('');
  const [params, setParams] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const api = useApi();

  const handleCommandSubmit = async () => {
    if (!selectedCommand) return;
    
    setIsSending(true);
    try {
      const command = commands.find(c => String(c.id) === String(selectedCommand));
      if (!command) return;

      await api.post('/commands/execute', {
        device_id: device.id,
        template_id: command.id,
        params
      });
      
      alert('Команда успешно отправлена!');
    } catch (error) {
      console.error('Ошибка отправки команды:', error);
      alert('Ошибка отправки команды');
    } finally {
      setIsSending(false);
    }
  };

  const handleParamChange = (param: string, value: string) => {
    setParams({
      ...params,
      [param]: value
    });
  };

  return (
    <div className="device-commands">
      <h3>Управление устройством: {device.name}</h3>
      
      <div className="command-selector">
        <label>Выберите команду:</label>
        <select 
          value={selectedCommand}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCommand(e.target.value)}
        >
          <option value="">-- Выберите команду --</option>
          {commands.map((cmd: CommandTemplate) => (
            <option key={cmd.id} value={cmd.id}>
              {cmd.name} ({cmd.category})
            </option>
          ))}
        </select>
      </div>

      {selectedCommand && (
        <div className="command-params">
          <h4>Параметры команды</h4>
          {commands
            .find((c: CommandTemplate) => String(c.id) === String(selectedCommand))
            ?.params_schema.properties && Object.keys(commands
            .find((c: CommandTemplate) => String(c.id) === String(selectedCommand))
            ?.params_schema.properties || {}).map((paramName: string) => {
              const cmd = commands.find((c: CommandTemplate) => String(c.id) === String(selectedCommand));
              const param = cmd?.params_schema.properties?.[paramName];
              const isRequired = cmd?.params_schema.required?.includes(paramName);

              if (!param) return null; // Защита от undefined

              return (
                <div key={paramName} className="param-field">
                  <label>{param.title || paramName}{isRequired ? ' *' : ''}:</label>
                  <input
                    type={param.type === 'number' || param.type === 'integer' ? 'number' : 'text'}
                    value={params[paramName] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParamChange(paramName, e.target.value)}
                  />
                </div>
              );
            })}
        </div>
      )}

      <button 
        onClick={handleCommandSubmit}
        disabled={!selectedCommand || isSending}
      >
        {isSending ? 'Отправка...' : 'Отправить команду'}
      </button>
    </div>
  );
};
