import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useExporterApi } from '../../lib/exporterApi';
import { PrometheusDevice, ManagementDevice, JobCondition, JobAction } from '../../types/exporter';
import { CommandTemplate } from '../../types/index';
import { MetricSelector as NewMetricSelector } from './MetricSelector';
import { CommandSelector as NewCommandSelector } from './CommandSelector';

// Prometheus Device Selector Component
interface PrometheusDeviceSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onDeviceSelect?: (device: PrometheusDevice) => void;
}

export const PrometheusDeviceSelector: React.FC<PrometheusDeviceSelectorProps> = ({
  value,
  onChange,
  error,
  onDeviceSelect
}) => {
  const [devices, setDevices] = useState<PrometheusDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const { getPrometheusDevices } = useExporterApi();

  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      try {
        const promDevices = await getPrometheusDevices();
        setDevices(promDevices);
      } catch (error) {
        console.error('Error loading prometheus devices:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, []);

  const handleDeviceChange = (deviceMac: string) => {
    onChange(deviceMac);
    const selectedDevice = devices.find(d => d.mac === deviceMac);
    if (selectedDevice && onDeviceSelect) {
      onDeviceSelect(selectedDevice);
    }
  };

  return (
    <div>
      <Label>Устройство для мониторинга</Label>
      <Select
        value={value}
        onValueChange={handleDeviceChange}
      >
        <SelectTrigger>
          {devices.find(d => d.mac === value)?.display_name || (
            <SelectValue placeholder={loading ? "Загрузка..." : "Выберите устройство для мониторинга"} />
          )}
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-auto">
          {devices.map((device) => (
            <SelectItem key={device.mac} value={device.mac}>
              {device.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};



// Metric Selector Component (обновленная версия)
interface MetricSelectorProps {
  deviceMac: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onMetricSelect?: (metric: any) => void;
}

export const MetricSelector: React.FC<MetricSelectorProps> = ({
  deviceMac,
  value,
  onChange,
  error,
  onMetricSelect
}) => {
  // Используем новый компонент с человекочитаемыми названиями
  return (
    <NewMetricSelector
      value={value}
      onChange={onChange}
      error={error}
      onMetricSelect={onMetricSelect}
    />
  );
};

// Operator Selector Component
interface OperatorSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const OperatorSelector: React.FC<OperatorSelectorProps> = ({
  value,
  onChange,
  error
}) => {
  return (
    <div>
      <Label>Оператор</Label>
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Выберите оператор" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value=">">Больше чем</SelectItem>
          <SelectItem value="<">Меньше чем</SelectItem>
          <SelectItem value="=">Равно</SelectItem>
          <SelectItem value="!=">Не равно</SelectItem>
          <SelectItem value=">=">Больше или равно</SelectItem>
          <SelectItem value="<=">Меньше или равно</SelectItem>
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

// Threshold Input Component
interface ThresholdInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  metric?: string;
  operator?: string;
}

export const ThresholdInput: React.FC<ThresholdInputProps> = ({
  value,
  onChange,
  error,
  metric,
  operator
}) => {
  return (
    <div>
      <Label>Пороговое значение</Label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Введите пороговое значение"
      />
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

// Management Device Selector Component
interface ManagementDeviceSelectorProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
  onDeviceSelect?: (device: ManagementDevice) => void;
}

export const ManagementDeviceSelector: React.FC<ManagementDeviceSelectorProps> = ({
  value,
  onChange,
  error,
  onDeviceSelect
}) => {
  const [devices, setDevices] = useState<ManagementDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const { getManagementDevices } = useExporterApi();

  useEffect(() => {
    const loadDevices = async () => {
      setLoading(true);
      try {
        const mgmtDevices = await getManagementDevices();
        setDevices(mgmtDevices);
      } catch (error) {
        console.error('Error loading management devices:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, []);

  const handleDeviceChange = (deviceId: string) => {
    const numDeviceId = parseInt(deviceId);
    onChange(numDeviceId);
    const selectedDevice = devices.find(d => d.id === numDeviceId);
    if (selectedDevice && onDeviceSelect) {
      onDeviceSelect(selectedDevice);
    }
  };

  return (
    <div>
      <Label>Устройство для управления</Label>
      <Select
        value={value?.toString()}
        onValueChange={handleDeviceChange}
      >
        <SelectTrigger>
          {devices.find(d => d.id === value)?.display_name || (
            <SelectValue placeholder={loading ? "Загрузка..." : "Выберите устройство для управления"} />
          )}
        </SelectTrigger>
        <SelectContent className="max-h-60 overflow-auto">
          {devices.map((device) => (
            <SelectItem key={device.id} value={device.id.toString()}>
              {device.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};



// Command Template Selector Component (обновленная версия)
interface CommandTemplateSelectorProps {
  deviceId: number | undefined;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
  onCommandSelect?: (template: any, parameters: Record<string, any>, finalCommand: string) => void;
}

export const CommandTemplateSelector: React.FC<CommandTemplateSelectorProps> = ({
  deviceId,
  value,
  onChange,
  error,
  onCommandSelect
}) => {
  // Используем новый компонент с параметризованными командами
  return (
    <NewCommandSelector
      deviceId={deviceId}
      value={value}
      onChange={onChange}
      error={error}
      onCommandSelect={onCommandSelect}
    />
  );
};

// Action Type Selector Component
interface ActionTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const ActionTypeSelector: React.FC<ActionTypeSelectorProps> = ({
  value,
  onChange,
  error
}) => {
  return (
    <div>
      <Label>Тип действия</Label>
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Выберите тип действия" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="send_notification">SMS уведомление</SelectItem>
          <SelectItem value="execute_command">Выполнить команду</SelectItem>
          <SelectItem value="webhook">Webhook</SelectItem>
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

// Action Parameters Input Component
interface ActionParametersInputProps {
  actionType: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const ActionParametersInput: React.FC<ActionParametersInputProps> = ({
  actionType,
  value,
  onChange,
  error
}) => {
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

  return (
    <div>
      <Label>Параметры</Label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={getPlaceholder()}
      />
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}; 