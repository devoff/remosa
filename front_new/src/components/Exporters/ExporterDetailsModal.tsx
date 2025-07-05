import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Activity, AlertCircle, CheckCircle, Clock, Server, Globe, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useExporterApi } from '../../lib/exporterApi';
import { Exporter, Device, ExporterMetrics } from '../../types/exporter';
import { useNotification } from '../NotificationProvider';

interface ExporterDetailsModalProps {
  exporter: Exporter;
  onClose: () => void;
}

const ExporterDetailsModal: React.FC<ExporterDetailsModalProps> = ({ 
  exporter, 
  onClose 
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [metrics, setMetrics] = useState<ExporterMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const { getExporterDevices, getExporterMetrics, syncExporter } = useExporterApi();
  const { notify } = useNotification();

  useEffect(() => {
    loadData();
  }, [exporter.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesData, metricsData] = await Promise.all([
        getExporterDevices(exporter.id),
        getExporterMetrics(exporter.id)
      ]);
      setDevices(devicesData);
      setMetrics(metricsData);
    } catch (error) {
      notify('Ошибка при загрузке данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncExporter(exporter.id);
      await loadData();
      notify('Синхронизация завершена', 'success');
    } catch (error) {
      notify('Ошибка при синхронизации', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (exporter.sync_status === 'error') {
      return <AlertCircle className="text-red-500" size={16} />;
    } else if (exporter.sync_status === 'success') {
      return <CheckCircle className="text-green-500" size={16} />;
    } else if (exporter.sync_status === 'pending') {
      return <Clock className="text-yellow-500" size={16} />;
    }
    return <Activity className="text-gray-400" size={16} />;
  };

  const getStatusText = () => {
    if (exporter.sync_status === 'error') {
      return 'Ошибка';
    } else if (exporter.sync_status === 'success') {
      return 'Успешно';
    } else if (exporter.sync_status === 'pending') {
      return 'Синхронизация';
    }
    return 'Неизвестно';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-100">
              Детали экспортера: {exporter.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Загрузка данных...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                    <Server className="mr-2 text-blue-400" size={20} />
                    Основная информация
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Название</p>
                      <p className="text-gray-100 font-medium">{exporter.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Тип платформы</p>
                      <p className="text-gray-100 font-medium capitalize">{exporter.platform_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Platform ID</p>
                      <p className="text-gray-100 font-medium">{exporter.platform_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Статус</p>
                      <div className="flex items-center">
                        {getStatusIcon()}
                        <span className={`ml-2 font-medium ${
                          exporter.is_active ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {exporter.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">ID</p>
                      <p className="text-gray-100 font-medium">{exporter.id}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                    <Hash className="mr-2 text-green-400" size={20} />
                    MAC адреса
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">MAC адреса</p>
                      <div className="space-y-1">
                        {(exporter.mac_addresses || []).map((mac, index) => (
                          <p key={index} className="text-gray-100 font-mono text-sm">{mac}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Метрики */}
              {metrics && (
                <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                    <Activity className="mr-2 text-purple-400" size={20} />
                    Метрики
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-100">{metrics.total_devices}</p>
                      <p className="text-sm text-gray-400">Всего устройств</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{metrics.online_devices}</p>
                      <p className="text-sm text-gray-400">Онлайн</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{metrics.offline_devices}</p>
                      <p className="text-sm text-gray-400">Оффлайн</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-300">
                        {formatDate(metrics.last_sync)}
                      </p>
                      <p className="text-sm text-gray-400">Последняя синхронизация</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Устройства */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-100 flex items-center">
                    <Hash className="mr-2 text-orange-400" size={20} />
                    Устройства ({devices.length})
                  </h3>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                    Синхронизировать
                  </button>
                </div>

                {devices.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Нет устройств</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 text-gray-400">MAC адрес</th>
                          <th className="text-left py-2 text-gray-400">Статус</th>
                          <th className="text-left py-2 text-gray-400">IP адрес</th>
                          <th className="text-left py-2 text-gray-400">Последний раз</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.map((device, index) => (
                          <tr key={index} className="border-b border-gray-700">
                            <td className="py-2 font-mono text-gray-100">{device.mac_address}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                device.status === 'online' 
                                  ? 'bg-green-900/20 text-green-400' 
                                  : 'bg-red-900/20 text-red-400'
                              }`}>
                                {device.status === 'online' ? 'Онлайн' : 'Оффлайн'}
                              </span>
                            </td>
                            <td className="py-2 text-gray-300">{device.ip_address || '-'}</td>
                            <td className="py-2 text-gray-300">{formatDate(device.last_seen)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Синхронизация */}
              <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center">
                  <RefreshCw className="mr-2 text-yellow-400" size={20} />
                  Синхронизация
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    {getStatusIcon()}
                    <span className="ml-2 text-gray-300">{getStatusText()}</span>
                  </div>
                  {exporter.last_sync_at && (
                    <div>
                      <p className="text-sm text-gray-400">Последняя синхронизация</p>
                      <p className="text-gray-100">{formatDate(exporter.last_sync_at)}</p>
                    </div>
                  )}
                  {exporter.error_message && (
                    <div>
                      <p className="text-sm text-gray-400">Ошибка</p>
                      <p className="text-red-400 text-sm">{exporter.error_message}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExporterDetailsModal; 