import React, { useState } from 'react';
import { X, Save, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotification } from '../NotificationProvider';
import { usePlatformExporterApi } from '../../lib/platformExporterApi';

interface PlatformExporterDialogProps {
  platformId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const PlatformExporterDialog: React.FC<PlatformExporterDialogProps> = ({
  platformId,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [exporterType, setExporterType] = useState<'cubicmedia' | 'addreality'>('cubicmedia');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    api_endpoint: '',
    mac_addresses: '',
    api_key: '',
    polling_interval: 30,
    timeout: 15,
    retry_count: 3,
    cache_enabled: true
  });

  const { notify } = useNotification();
  const { createPlatformExporter } = usePlatformExporterApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      notify('Введите название экспортера', 'error');
      return;
    }

    if (exporterType === 'cubicmedia' && !formData.mac_addresses.trim()) {
      notify('Введите MAC-адреса для CubicMedia экспортера', 'error');
      return;
    }

    if (exporterType === 'addreality' && !formData.api_key.trim()) {
      notify('Введите API ключ для Addreality экспортера', 'error');
      return;
    }

    try {
      setLoading(true);

      // Подготавливаем данные конфигурации
      const config: any = {
        polling_interval: formData.polling_interval,
        timeout: formData.timeout,
        retry_count: formData.retry_count,
        cache_enabled: formData.cache_enabled
      };

      if (exporterType === 'cubicmedia') {
        config.api_endpoint = formData.api_endpoint || 'https://vision-cms-api.cubicservice.ru/api/v0.1/players/status-check?mac=';
        config.mac_addresses = formData.mac_addresses
          .split('\n')
          .map(mac => mac.trim())
          .filter(mac => mac.length > 0);
      } else {
        config.api_key = formData.api_key;
        config.api_endpoint = formData.api_endpoint;
      }

      const exporterData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        platform_type: exporterType,
        config
      };

      await createPlatformExporter(platformId, exporterData);
      
      notify('Экспортер успешно создан', 'success');
      onSuccess();
    } catch (error: any) {
      console.error('Ошибка создания экспортера:', error);
      notify(error.response?.data?.detail || 'Ошибка создания экспортера', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Создать экспортер</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Название экспортера *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Мой экспортер"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-300">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Описание экспортера"
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="exporter_type" className="text-gray-300">Тип экспортера *</Label>
              <Select value={exporterType} onValueChange={(value: string) => setExporterType(value as 'cubicmedia' | 'addreality')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cubicmedia">CubicMedia (MAC-адреса)</SelectItem>
                  <SelectItem value="addreality">Addreality (API ключ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Настройки типа экспортера */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
              <Settings size={18} />
              Настройки {exporterType === 'cubicmedia' ? 'CubicMedia' : 'Addreality'}
            </h3>

            {exporterType === 'cubicmedia' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api_endpoint" className="text-gray-300">API Endpoint</Label>
                  <Input
                    id="api_endpoint"
                    value={formData.api_endpoint}
                    onChange={(e) => handleInputChange('api_endpoint', e.target.value)}
                    placeholder="https://vision-cms-api.cubicservice.ru/api/v0.1/players/status-check?mac="
                    className="mt-1"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Оставьте пустым для использования стандартного endpoint
                  </p>
                </div>

                <div>
                  <Label htmlFor="mac_addresses" className="text-gray-300">MAC-адреса *</Label>
                  <Textarea
                    id="mac_addresses"
                    value={formData.mac_addresses}
                    onChange={(e) => handleInputChange('mac_addresses', e.target.value)}
                    placeholder="06:42:40:92:60:B4&#10;06:42:40:92:60:B5&#10;06:42:40:92:60:B6"
                    className="mt-1"
                    rows={5}
                    required
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Введите MAC-адреса устройств, по одному на строку
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api_key" className="text-gray-300">API ключ *</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => handleInputChange('api_key', e.target.value)}
                    placeholder="Ваш API ключ"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="addreality_api_endpoint" className="text-gray-300">API Endpoint</Label>
                  <Input
                    id="addreality_api_endpoint"
                    value={formData.api_endpoint}
                    onChange={(e) => handleInputChange('api_endpoint', e.target.value)}
                    placeholder="https://api.addreality.com/v1"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Общие настройки */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-100 mb-4">Общие настройки</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="polling_interval" className="text-gray-300">Интервал опроса (сек)</Label>
                <Input
                  id="polling_interval"
                  type="number"
                  value={formData.polling_interval}
                  onChange={(e) => handleInputChange('polling_interval', parseInt(e.target.value))}
                  min={10}
                  max={300}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="timeout" className="text-gray-300">Таймаут (сек)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
                  min={5}
                  max={60}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="retry_count" className="text-gray-300">Количество попыток</Label>
                <Input
                  id="retry_count"
                  type="number"
                  value={formData.retry_count}
                  onChange={(e) => handleInputChange('retry_count', parseInt(e.target.value))}
                  min={1}
                  max={10}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              Создать экспортер
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlatformExporterDialog; 