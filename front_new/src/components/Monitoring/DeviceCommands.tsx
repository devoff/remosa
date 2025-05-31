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
      const command = commands.find(c => c.id === selectedCommand);
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
            .find((c: CommandTemplate) => c.id === selectedCommand)
            ?.params_schema.map((param: { name: string; type: string; required: boolean }) => (
              <div key={param.name} className="param-field">
                <label>{param.name}:</label>
                <input
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={params[param.name] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleParamChange(param.name, e.target.value)}
                />
              </div>
            ))
          }
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
