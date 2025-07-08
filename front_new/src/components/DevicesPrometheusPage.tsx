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
import { Tooltip } from '@/components/ui/tooltip';
import { Modal } from '@/components/ui/modal';

const DevicesPrometheusPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [exporterTypeFilter, setExporterTypeFilter] = useState<'all' | 'cubicmedia' | 'addreality'>('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

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
    const matchesSearch = 
      (device.mac || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.device_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.ip && device.ip.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (device.platform_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status_text === statusFilter;
    const matchesPlatform = !platformFilter || device.platform_id === platformFilter;
    const matchesType = exporterTypeFilter === 'all' || (device.platform_type || getDeviceType(device)) === exporterTypeFilter;
    return matchesSearch && matchesStatus && matchesPlatform && matchesType;
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

  function getDeviceType(device: Device): 'cubicmedia' | 'addreality' {
    if (device.device_id || device.player_version || device.activation_state) return 'addreality';
    return 'cubicmedia';
  }

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
      {/* Заголовок и описание */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Устройства из Prometheus</h1>
          <p className="text-gray-400 mt-1">
            Список всех устройств, полученных из метрик Prometheus.<br/>
            <span className="text-blue-400">CubicMedia</span> — по MAC-адресу, <span className="text-orange-400">AddReality</span> — по device_id. Поддерживаются оба типа экспортёров.
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Тип экспортёра
            </label>
            <select
              value={exporterTypeFilter}
              onChange={e => setExporterTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Все</option>
              <option value="cubicmedia">CubicMedia</option>
              <option value="addreality">AddReality</option>
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
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Источник</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">ID/MAC</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Имя</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Статус</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">IP</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Платформа</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Подробнее</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device, index) => {
                  const type = (device.platform_type || getDeviceType(device));
                  return (
                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer" onClick={() => setSelectedDevice(device)}>
                    <td className="py-3 px-4">
                        {type === 'cubicmedia' ? (
                          <Badge className="bg-blue-900/30 text-blue-400 flex items-center gap-1"><Server size={12}/> CubicMedia</Badge>
                        ) : (
                          <Badge className="bg-orange-900/30 text-orange-400 flex items-center gap-1"><Globe size={12}/> AddReality</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {type === 'addreality' ? (device.device_id || '-') : (device.mac || device.mac_address || '-')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300">{device.name || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {getStatusIcon(device.status_text)}
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          device.status_text === 'online' 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-red-900/20 text-red-400'
                        }`}>
                          {getStatusText(device.status_text)}
                        </span>
                      </div>
                    </td>
                      <td className="py-3 px-4 font-mono">
                          {device.ip || device.ip_address || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300">{device.platform_id || '-'}</span>
                    </td>
                      <td className="py-3 px-4">
                        <Tooltip content={type === 'addreality' ? (
                          <div>
                            <div><b>Версия плеера:</b> {device.player_version || '-'}</div>
                            <div><b>TimeZone:</b> {device.time_zone || '-'}</div>
                            <div><b>Activation:</b> {device.activation_state || '-'}</div>
                            <div><b>Last online:</b> {device.last_online || '-'}</div>
                          </div>
                        ) : (
                          <div>
                            <div><b>MAC:</b> {device.mac || device.mac_address || '-'}</div>
                            <div><b>IP:</b> {device.ip || device.ip_address || '-'}</div>
                            <div><b>Last seen:</b> {device.last_seen || '-'}</div>
                          </div>
                        )}>
                          <Eye className="text-gray-400 hover:text-blue-400 cursor-pointer" size={18}/>
                        </Tooltip>
                      </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Модальное окно с подробностями */}
        {selectedDevice && (
          <Modal open={!!selectedDevice} onClose={() => setSelectedDevice(null)}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Детали устройства</h2>
              <div className="space-y-2">
                <div><b>Источник:</b> {(selectedDevice.platform_type || getDeviceType(selectedDevice)) === 'addreality' ? 'AddReality' : 'CubicMedia'}</div>
                <div><b>ID/MAC:</b> {selectedDevice.device_id || selectedDevice.mac || selectedDevice.mac_address || '-'}</div>
                <div><b>Имя:</b> {selectedDevice.name || '-'}</div>
                <div><b>Платформа:</b> {selectedDevice.platform_id || '-'}</div>
                <div><b>Статус:</b> {getStatusText(selectedDevice.status_text)}</div>
                {getDeviceType(selectedDevice) === 'addreality' ? (
                  <>
                    <div><b>Версия плеера:</b> {selectedDevice.player_version || '-'}</div>
                    <div><b>TimeZone:</b> {selectedDevice.time_zone || '-'}</div>
                    <div><b>Activation:</b> {selectedDevice.activation_state || '-'}</div>
                    <div><b>Last online:</b> {selectedDevice.last_online || '-'}</div>
                  </>
                ) : (
                  <>
                    <div><b>IP:</b> {selectedDevice.ip || selectedDevice.ip_address || '-'}</div>
                    <div><b>Внешний IP:</b> {selectedDevice.outip || '-'}</div>
                    <div><b>Last seen:</b> {selectedDevice.last_seen || '-'}</div>
                  </>
                )}
              </div>
              <div className="mt-6 text-right">
                <Button onClick={() => setSelectedDevice(null)} variant="secondary">Закрыть</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default DevicesPrometheusPage; 