import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2, 
  Eye, 
  Settings,
  AlertTriangle,
  Bell,
  Terminal,
  Globe,
  Clock,
  CheckCircle,
  Edit2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useExporterApi } from '../lib/exporterApi';
import { Job } from '../types/exporter';
import { useAuth } from '../lib/useAuth';
import { useNotification } from './NotificationProvider';
import JobDialog from './Jobs/JobDialog';
import JobDetailsModal from './Jobs/JobDetailsModal';

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [executing, setExecuting] = useState<number | null>(null);

  const { getJobs, deleteJob, executeJob } = useExporterApi();
  const { isSuperAdmin } = useAuth();
  const { notify } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const jobsData = await getJobs();
      setJobs(jobsData);
    } catch (error) {
      notify('Ошибка при загрузке данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (jobId: number) => {
    try {
      setExecuting(jobId);
      await executeJob(jobId);
      await loadData();
      notify('Задание выполнено', 'success');
    } catch (error) {
      notify('Ошибка при выполнении задания', 'error');
    } finally {
      setExecuting(null);
    }
  };

  const handleDelete = async (jobId: number) => {
    if (!confirm('Вы уверены, что хотите удалить это задание?')) return;
    
    try {
      await deleteJob(jobId);
      await loadData();
      notify('Задание удалено', 'success');
    } catch (error) {
      notify('Ошибка при удалении', 'error');
    }
  };

  const getJobTypeIcon = (jobType: string) => {
    switch (jobType) {
      case 'alert':
        return <AlertTriangle className="text-red-400" size={16} />;
      case 'notification':
        return <Bell className="text-blue-400" size={16} />;
      case 'command':
        return <Terminal className="text-green-400" size={16} />;
      default:
        return <Settings className="text-gray-400" size={16} />;
    }
  };

  const getJobTypeText = (jobType: string) => {
    switch (jobType) {
      case 'alert':
        return 'Алерт';
      case 'notification':
        return 'Уведомление';
      case 'command':
        return 'Команда';
      default:
        return 'Неизвестно';
    }
  };

  const getStatusIcon = (job: Job) => {
    if (job.is_active) {
      return <CheckCircle className="text-green-500" size={16} />;
    }
    return <Pause className="text-gray-500" size={16} />;
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <h2 className="text-red-400 font-semibold">Доступ запрещен</h2>
          <p className="text-gray-300 mt-2">
            Управление заданиями доступно только супер-администраторам.
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
          <h1 className="text-2xl font-bold text-gray-100">Задания</h1>
          <p className="text-gray-400 mt-1">
            Управление автоматическими заданиями (аналог Grafana alerts)
          </p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Создать задание
        </button>
      </div>

      {/* Список заданий */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-100">Задания</h2>
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
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="text-gray-500 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Нет заданий</h3>
            <p className="text-gray-500 mb-4">
              Создайте первое задание для автоматизации мониторинга
            </p>
            <button
              onClick={() => setShowDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Создать задание
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job)}
                      {getJobTypeIcon(job.job_type)}
                      <div>
                        <h3 className="font-medium text-gray-100">{job.name}</h3>
                        <p className="text-sm text-gray-400">
                          {getJobTypeText(job.job_type)} • {job.conditions.length} условий
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Статус</p>
                      <p className={`text-sm font-medium ${
                        job.is_active ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {job.is_active ? 'Активно' : 'Неактивно'}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Выполнений</p>
                      <p className="text-sm font-medium text-gray-300">
                        {job.execution_count}
                      </p>
                    </div>
                    
                    {job.last_executed_at && (
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Последнее выполнение</p>
                        <p className="text-sm font-medium text-gray-300">
                          {new Date(job.last_executed_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowDetails(true);
                        }}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                        title="Подробности"
                      >
                        <Eye size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleExecute(job.id)}
                        disabled={executing === job.id}
                        className="text-gray-400 hover:text-green-400 transition-colors"
                        title="Выполнить"
                      >
                        <Play size={16} className={executing === job.id ? 'animate-pulse' : ''} />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setShowDialog(true);
                        }}
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {job.description && (
                  <p className="text-sm text-gray-400 mt-2">{job.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Диалоги */}
      {showDialog && (
        <JobDialog
          onClose={() => setShowDialog(false)}
          onSave={async () => {
            setShowDialog(false);
            await loadData();
          }}
        />
      )}

      {showDetails && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => {
            setShowDetails(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
};

export default JobsPage; 