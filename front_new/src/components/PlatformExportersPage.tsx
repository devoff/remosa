import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  RefreshCw, 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  Play,
  Square,
  BarChart3,
  Docker
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '../lib/useAuth';
import { useNotification } from './NotificationProvider';
import PlatformExporterDialog from './PlatformExporters/PlatformExporterDialog';
import PlatformExporterDetailsModal from './PlatformExporters/PlatformExporterDetailsModal';
import { usePlatformExporterApi } from '../lib/platformExporterApi';

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

interface PlatformStats {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  online_percentage: number;
}

const PlatformExportersPage: React.FC = () => {
  const [exporters, setExporters] = useState<PlatformExporter[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedExporter, setSelectedExporter] = useState<PlatformExporter | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailedExporter, setDetailedExporter] = useState<PlatformExporter | null>(null);
  const [dockerStatuses, setDockerStatuses] = useState<Record<number, any>>({});

  const { user } = useAuth();
  const { notify } = useNotification();
  const { 
    getPlatformExporters, 
    getPlatformStats, 
    getExporterDockerStatus,
    deletePlatformExporter
  } = usePlatformExporterApi();

  const platformId = user?.platform_id;

  useEffect(() => {
    if (platformId) {
      loadData();
    }
  }, [platformId]);

  const loadData = async () => {
    if (!platformId) return;
    
    try {
      setLoading(true);
      const [exportersData, statsData] = await Promise.all([
        getPlatformExporters(platformId),
        getPlatformStats(platformId)
      ]);
      setExporters(exportersData);
      setStats(statsData);
      
      // Загружаем статусы Docker контейнеров
      const dockerStatusesData: Record<number, any> = {};
      for (const exporter of exportersData) {
        try {
          const status = await getExporterDockerStatus(platformId, exporter.id);
          dockerStatusesData[exporter.id] = status;
        } catch (error) {
          console.error(`Ошибка получения статуса Docker для экспортера ${exporter.id}:`, error);
          dockerStatusesData[exporter.id] = { status: 'error', message: 'Ошибка получения статуса' };
        }
      }
      setDockerStatuses(dockerStatusesData);
    } catch (error) {
      notify('Ошибка при загрузке данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (exporterId: number) => {
    if (!platformId || !confirm('Вы уверены, что хотите удалить этот экспортер?')) return;
    
    try {
      await deletePlatformExporter(platformId, exporterId);
      await loadData();
      notify('Экспортер удален', 'success');
    } catch (error) {
      notify('Ошибка при удалении', 'error');
    }
  };



  const handleShowDetails = async (exporter: PlatformExporter) => {
    setShowDetails(true);
    setDetailedExporter(exporter);
  };

  const getStatusIcon = (exporter: PlatformExporter) => {
    const dockerStatus = dockerStatuses[exporter.id]?.status;
    
    if (dockerStatus === 'running') {
      return <CheckCircle className="text-green-500" size={16} />;
    } else if (dockerStatus === 'stopped') {
      return <Square className="text-red-500" size={16} />;
    } else if (dockerStatus === 'error') {
      return <AlertCircle className="text-red-500" size={16} />;
    } else {
      return <Activity className="text-gray-400" size={16} />;
    }
  };

  const getStatusText = (exporter: PlatformExporter) => {
    const dockerStatus = dockerStatuses[exporter.id]?.status;
    
    switch (dockerStatus) {
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

  const getStatusColor = (exporter: PlatformExporter) => {
    const dockerStatus = dockerStatuses[exporter.id]?.status;
    
    switch (dockerStatus) {
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

  if (!platformId) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <h2 className="text-red-400 font-semibold">Ошибка</h2>
          <p className="text-gray-300 mt-2">
            Не удалось определить платформу пользователя.
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
          <h1 className="text-2xl font-bold text-gray-100">Экспортеры платформы</h1>
          <p className="text-gray-400 mt-1">
            Управление экспортерами для сбора метрик с устройств
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw size={16} />
            Обновить
          </button>
          <button
            onClick={() => setShowDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Добавить экспортер
          </button>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Всего устройств</p>
                <p className="text-2xl font-bold text-gray-100">{stats.total_devices}</p>
              </div>
              <Server className="text-blue-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Онлайн</p>
                <p className="text-2xl font-bold text-green-400">{stats.online_devices}</p>
              </div>
              <CheckCircle className="text-green-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Оффлайн</p>
                <p className="text-2xl font-bold text-red-400">{stats.offline_devices}</p>
              </div>
              <AlertCircle className="text-red-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Процент онлайн</p>
                <p className="text-2xl font-bold text-green-400">{stats.online_percentage.toFixed(1)}%</p>
              </div>
              <BarChart3 className="text-green-400" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Список экспортеров */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-100">Экспортеры</h2>
            <span className="text-gray-400 text-sm">{exporters.length} экспортеров</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Загрузка экспортеров...</p>
          </div>
        ) : exporters.length === 0 ? (
          <div className="p-8 text-center">
            <Server className="text-gray-500 mx-auto mb-4" size={48} />
            <h3 className="text-gray-300 font-semibold mb-2">Нет экспортеров</h3>
            <p className="text-gray-500 mb-4">
              Создайте первый экспортер для начала мониторинга устройств
            </p>
            <button
              onClick={() => setShowDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Создать экспортер
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {exporters.map((exporter) => (
              <div key={exporter.id} className="p-4 hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(exporter)}`}></div>
                    <div>
                      <h3 className="text-gray-100 font-medium">{exporter.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {exporter.description || 'Без описания'}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {exporter.platform_type === 'cubicmedia' ? 'CubicMedia' : 'Addreality'}
                        </Badge>
                        <span className="text-gray-500 text-xs">
                          {exporter.config.mac_addresses?.length || 0} MAC-адресов
                        </span>
                        <span className="text-gray-500 text-xs">
                          {exporter.last_metrics_count || 0} устройств
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm">
                      {getStatusIcon(exporter)}
                      <span className="text-gray-400">{getStatusText(exporter)}</span>
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleShowDetails(exporter)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                        title="Детали"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(exporter.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Диалоги */}
      {showDialog && (
        <PlatformExporterDialog
          platformId={platformId}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setShowDialog(false);
            loadData();
          }}
        />
      )}

      {showDetails && detailedExporter && (
        <PlatformExporterDetailsModal
          exporter={detailedExporter}
          platformId={platformId}
          dockerStatus={dockerStatuses[detailedExporter.id]}
          onClose={() => {
            setShowDetails(false);
            setDetailedExporter(null);
          }}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

export default PlatformExportersPage; 