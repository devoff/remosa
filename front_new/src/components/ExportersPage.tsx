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
  Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useExporterApi } from '../lib/exporterApi';
import { Exporter, ExporterStats } from '../types/exporter';
import { useAuth } from '../lib/useAuth';
import { useNotification } from './NotificationProvider';
import ExporterDialog from './Exporters/ExporterDialog';
import ExporterDetailsModal from './Exporters/ExporterDetailsModal';

const ExportersPage: React.FC = () => {
  const [exporters, setExporters] = useState<Exporter[]>([]);
  const [stats, setStats] = useState<ExporterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedExporter, setSelectedExporter] = useState<Exporter | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [detailedExporter, setDetailedExporter] = useState<Exporter | null>(null);

  const { getExporters, getExporterStats, syncExporter, deleteExporter, getExporter } = useExporterApi();
  const { isSuperAdmin } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [exportersData, statsData] = await Promise.all([
        getExporters(),
        getExporterStats()
      ]);
      setExporters(exportersData);
      setStats(statsData);
    } catch (error) {
      notify('Ошибка при загрузке данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (exporterId: number) => {
    try {
      setSyncing(exporterId);
      await syncExporter(exporterId);
      await loadData();
      notify('Синхронизация завершена', 'success');
    } catch (error) {
      notify('Ошибка при синхронизации', 'error');
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (exporterId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот экспортер?')) return;
    
    try {
      await deleteExporter(exporterId);
      await loadData();
      notify('Экспортер удален', 'success');
    } catch (error) {
      notify('Ошибка при удалении', 'error');
    }
  };

  const handleShowDetails = async (exporter: Exporter) => {
    setShowDetails(true);
    setDetailedExporter(null);
    try {
      const data = await getExporter(exporter.id);
      setDetailedExporter(data);
    } catch (e) {
      notify('Ошибка при загрузке деталей экспортёра', 'error');
      setShowDetails(false);
    }
  };

  const getStatusIcon = (exporter: Exporter) => {
    if (exporter.sync_status === 'error') {
      return <AlertCircle className="text-red-500" size={16} />;
    } else if (exporter.sync_status === 'success') {
      return <CheckCircle className="text-green-500" size={16} />;
    } else if (exporter.sync_status === 'pending') {
      return <Clock className="text-yellow-500" size={16} />;
    }
    return <Activity className="text-gray-400" size={16} />;
  };

  const getStatusText = (exporter: Exporter) => {
    if (exporter.sync_status === 'error') {
      return 'Ошибка';
    } else if (exporter.sync_status === 'success') {
      return 'Успешно';
    } else if (exporter.sync_status === 'pending') {
      return 'Синхронизация';
    }
    return 'Неизвестно';
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <h2 className="text-red-400 font-semibold">Доступ запрещен</h2>
          <p className="text-gray-300 mt-2">
            Управление экспортерами доступно только супер-администраторам.
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
          <h1 className="text-2xl font-bold text-gray-100">Экспортеры Prometheus</h1>
          <p className="text-gray-400 mt-1">
            Управление экспортерами для сбора метрик с платформ
          </p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Добавить экспортер
        </button>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Всего экспортеров</p>
                <p className="text-2xl font-bold text-gray-100">{stats.total_exporters}</p>
              </div>
              <Server className="text-blue-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Активные</p>
                <p className="text-2xl font-bold text-green-400">{stats.active_exporters}</p>
              </div>
              <Activity className="text-green-400" size={24} />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Всего устройств</p>
                <p className="text-2xl font-bold text-gray-100">{stats.total_devices}</p>
              </div>
              <Settings className="text-purple-400" size={24} />
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
        </div>
      )}

      {/* Список экспортеров */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-100">Экспортеры</h2>
            <button
              onClick={loadData}
              disabled={loading}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Загрузка...</p>
          </div>
        ) : exporters.length === 0 ? (
          <div className="p-8 text-center">
            <Server className="text-gray-500 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Нет экспортеров</h3>
            <p className="text-gray-500 mb-4">
              Создайте первый экспортер для начала сбора метрик
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
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(exporter)}
                      <div>
                        <h3 className="font-medium text-gray-100">{exporter.name}</h3>
                        <p className="text-sm text-gray-400">
                          ID: {exporter.id} • {exporter.platform_type} • {exporter.platform_id}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Статус</p>
                      <p className={`text-sm font-medium ${
                        exporter.is_active ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {exporter.is_active ? 'Активен' : 'Неактивен'}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Синхронизация</p>
                      <p className="text-sm font-medium text-gray-300">
                        {getStatusText(exporter)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShowDetails(exporter)}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                        title="Подробности"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleSync(exporter.id)}
                        disabled={syncing === exporter.id}
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                        title="Синхронизировать"
                      >
                        <RefreshCw size={16} className={syncing === exporter.id ? 'animate-spin' : ''} />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedExporter(exporter);
                          setShowDialog(true);
                        }}
                        className="text-gray-400 hover:text-yellow-400 transition-colors"
                        title="Редактировать"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit"><path d="M11 4h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M9 2v4"></path></svg>
                      </button>
                      
                      <button
                        onClick={() => handleDelete(exporter.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
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
        <ExporterDialog
          exporter={selectedExporter || undefined}
          onClose={() => {
            setShowDialog(false);
            setSelectedExporter(null);
          }}
          onSave={async () => {
            setShowDialog(false);
            setSelectedExporter(null);
            await loadData();
          }}
        />
      )}

      {showDetails && detailedExporter && (
        <ExporterDetailsModal
          exporter={detailedExporter}
          onClose={() => {
            setShowDetails(false);
            setDetailedExporter(null);
          }}
        />
      )}
    </div>
  );
};

export default ExportersPage; 