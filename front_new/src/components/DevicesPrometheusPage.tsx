import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Server,
  Wifi,
  WifiOff,
  Globe,
  Hash
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useExporterApi } from '../lib/exporterApi';
import { Device } from '../types/exporter';
import { useAuth } from '../lib/useAuth';
import { useNotification } from './NotificationProvider';

const DevicesPrometheusPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('');

  const { getAllDevices } = useExporterApi();
  const { isSuperAdmin } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const devicesData = await getAllDevices();
      setDevices(devicesData);
    } catch (error) {
      notify('Ошибка при загрузке данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.mac_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (device.ip_address && device.ip_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         device.platform_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    const matchesPlatform = !platformFilter || device.platform_id === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const getStatusIcon = (status: string) => {
    return status === 'online' ? 
      <Wifi className="text-green-500" size={16} /> : 
      <WifiOff className="text-red-500" size={16} />;
  };

  const getStatusText = (status: string) => {
    return status === 'online' ? 'Онлайн' : 'Оффлайн';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const uniquePlatforms = [...new Set(devices.map(d => d.platform_id))];

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <h2 className="text-red-400 font-semibold">Доступ запрещен</h2>
          <p className="text-gray-300 mt-2">
            Просмотр устройств из Prometheus доступен только супер-администраторам.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Устройства из Prometheus</h1>
          <p className="text-gray-400 mt-1">
            Список всех устройств, полученных из метрик Prometheus
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {/* Фильтры */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Поиск
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                placeholder="MAC, IP или Platform ID"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Все</option>
              <option value="online">Онлайн</option>
              <option value="offline">Оффлайн</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Платформа
            </label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Все платформы</option>
              {uniquePlatforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-400">
              Найдено: <span className="text-gray-100 font-medium">{filteredDevices.length}</span> из {devices.length}
            </div>
          </div>
        </div>
      </div>

      {/* Список устройств */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center">
            <Server className="mr-2 text-blue-400" size={20} />
            Устройства
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Загрузка устройств...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="p-8 text-center">
            <Server className="text-gray-500 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Нет устройств</h3>
            <p className="text-gray-500">
              Устройства не найдены в метриках Prometheus
            </p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="p-8 text-center">
            <Filter className="text-gray-500 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Нет результатов</h3>
            <p className="text-gray-500">
              Попробуйте изменить фильтры поиска
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">MAC адрес</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Статус</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">IP адрес</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Платформа</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Последний раз</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Лейблы</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Hash className="text-gray-400 mr-2" size={14} />
                        <span className="font-mono text-gray-100">{device.mac_address}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {getStatusIcon(device.status)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          device.status === 'online' 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-red-900/20 text-red-400'
                        }`}>
                          {getStatusText(device.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Globe className="text-gray-400 mr-2" size={14} />
                        <span className="text-gray-300 font-mono">
                          {device.ip_address || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300">{device.platform_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300 text-sm">
                        {formatDate(device.last_seen)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(device.labels).map(([key, value]) => (
                          <span 
                            key={key}
                            className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                            title={`${key}: ${value}`}
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevicesPrometheusPage; 