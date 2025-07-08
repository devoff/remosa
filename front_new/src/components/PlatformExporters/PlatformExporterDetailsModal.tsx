import React, { useState, useEffect } from 'react';
import { X, Play, Square, RefreshCw, Trash2, Activity, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotification } from '../NotificationProvider';
import { usePlatformExporterApi } from '../../lib/platformExporterApi';

interface PlatformExporter {
  id: number;
  name: string;
  description?: string;
  exporter_type: string;
  platform_type: string;
  status: string;
  platform_id: number;
  container_name?: string;
  container_port?: number;
  container_status?: string;
  last_metrics_count?: number;
  last_successful_collection?: string;
  last_error_message?: string;
  created_at: string;
  updated_at: string;
  config: {
    api_endpoint?: string;
    mac_addresses?: string[];
    api_key?: string;
    polling_interval?: number;
    timeout?: number;
    retry_count?: number;
    cache_enabled?: boolean;
    prometheus_labels?: Record<string, string>;
  };
}

interface PlatformExporterDetailsModalProps {
  exporter: PlatformExporter;
  platformId: number;
  dockerStatus?: any;
  onClose: () => void;
  onUpdate: () => void;
}

const PlatformExporterDetailsModal: React.FC<PlatformExporterDetailsModalProps> = ({
  exporter,
  platformId,
  dockerStatus,
  onClose,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const { notify } = useNotification();
  const { 
    getExporterDevices, 
    getExporterStats,
    deletePlatformExporter
  } = usePlatformExporterApi();

  useEffect(() => {
    loadExporterData();
  }, [exporter.id]);

  const loadExporterData = async () => {
    try {
      setLoadingDevices(true);
      const [devicesData, statsData] = await Promise.all([
        getExporterDevices(platformId, exporter.id),
        getExporterStats(platformId, exporter.id)
      ]);
      setDevices(devicesData);
      setStats(statsData);
    } catch (error) {
      console.error('Ошибка загрузки данных экспортера:', error);
    } finally {
      setLoadingDevices(false);
    }
  };



  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот экспортер?')) return;
    
    try {
      setLoading(true);
      await deletePlatformExporter(platformId, exporter.id);
      notify('Экспортер удален', 'success');
      onClose();
      onUpdate();
    } catch (error: any) {
      notify(error.response?.data?.detail || 'Ошибка удаления экспортера', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDockerStatusIcon = () => {
    const status = dockerStatus?.status;
    switch (status) {
      case 'running':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'stopped':
        return <Square className="text-red-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Activity className="text-gray-400" size={20} />;
    }
  };

  const getDockerStatusText = () => {
    const status = dockerStatus?.status;
    switch (status) {
      case 'running':
        return 'Работает';
      case 'stopped':
        return 'Остановлен';
      case 'error':
        return 'Ошибка';
      case 'not_found':
        return 'Не найден';
      default:
        return 'Неизвестно';
    }
  };

  const getDockerStatusColor = () => {
    const status = dockerStatus?.status;
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-red-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-100">Детали экспортера</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Основная информация */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-100">Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Название</label>
                  <p className="text-gray-100 font-medium">{exporter.name}</p>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Описание</label>
                  <p className="text-gray-100">{exporter.description || 'Без описания'}</p>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Тип экспортера</label>
                  <Badge variant="outline" className="mt-1">
                    {exporter.platform_type === 'cubicmedia' ? 'CubicMedia' : 'Addreality'}
                  </Badge>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Статус</label>
                  <Badge variant="outline" className="mt-1">
                    {exporter.status}
                  </Badge>
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm">Создан</label>
                  <p className="text-gray-100">{new Date(exporter.created_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Docker статус */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-100 flex items-center gap-2">
                  <Activity size={18} />
                  Docker контейнер
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getDockerStatusColor()}`}></div>
                  <div className="flex items-center gap-2">
                    {getDockerStatusIcon()}
                    <span className="text-gray-100">{getDockerStatusText()}</span>
                  </div>
                </div>
                
                {dockerStatus?.container_name && (
                  <div>
                    <label className="text-gray-400 text-sm">Имя контейнера</label>
                    <p className="text-gray-100 font-mono text-sm">{dockerStatus.container_name}</p>
                  </div>
                )}
                
                {dockerStatus?.container_info && (
                  <div>
                    <label className="text-gray-400 text-sm">Порт</label>
                    <p className="text-gray-100">{dockerStatus.container_info.ports?.['9000/tcp']?.[0]?.HostPort || 'Не настроен'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Действия */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-100">Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={loadExporterData}
                    disabled={loadingDevices}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Обновить
                  </Button>
                </div>
                
                <Button
                  onClick={handleDelete}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 size={16} />
                  Удалить экспортер
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Статистика и устройства */}
          <div className="space-y-6">
            {/* Статистика */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-100 flex items-center gap-2">
                    <BarChart3 size={18} />
                    Статистика
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-100">{stats.total_devices}</p>
                      <p className="text-gray-400 text-sm">Всего устройств</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{stats.online_devices}</p>
                      <p className="text-gray-400 text-sm">Онлайн</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{stats.offline_devices}</p>
                      <p className="text-gray-400 text-sm">Оффлайн</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{stats.online_percentage.toFixed(1)}%</p>
                      <p className="text-gray-400 text-sm">Процент онлайн</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Устройства */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-100">Устройства ({devices.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDevices ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Загрузка устройств...</p>
                  </div>
                ) : devices.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-400">Нет устройств</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {devices.map((device, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                        <div>
                          <p className="text-gray-100 font-medium">{device.name || device.mac}</p>
                          <p className="text-gray-400 text-sm">{device.mac}</p>
                          {device.ip && <p className="text-gray-400 text-sm">IP: {device.ip}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${device.status === 1 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm text-gray-400">
                            {device.status === 1 ? 'Онлайн' : 'Оффлайн'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformExporterDetailsModal; 