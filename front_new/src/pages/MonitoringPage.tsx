import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Bell,
  RefreshCw,
  Trash2
} from 'lucide-react';
import apiService from '@/services/apiService';

interface JobStatistics {
  total_jobs: number;
  active_jobs: number;
  recent_executions: number;
  successful_executions: number;
  failed_executions: number;
  success_rate: number;
}

interface SystemHealth {
  jobs: {
    total: number;
    active: number;
    recent_executions: number;
    recent_failures: number;
  };
  notifications: {
    total: number;
    unread: number;
  };
  system_status: string;
}

interface JobExecution {
  id: number;
  executed_at: string;
  success: boolean;
  results: any[];
  error?: string;
}

interface FailedJob {
  job_id: number;
  job_name: string;
  executed_at: string;
  error: string;
  results: any[];
}

interface Notification {
  id: number;
  message: string;
  recipients: string[];
  job_id?: number;
  status: string;
  created_at: string;
}

const MonitoringPage: React.FC = () => {
  const [statistics, setStatistics] = useState<JobStatistics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, healthRes, failedRes, notifRes] = await Promise.all([
        apiService.get('/monitoring/statistics'),
        apiService.get('/monitoring/health'),
        apiService.get('/monitoring/failed-jobs'),
        apiService.get('/monitoring/notifications')
      ]);

      setStatistics(statsRes.data);
      setSystemHealth(healthRes.data);
      setFailedJobs(failedRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      setError('Ошибка при загрузке данных мониторинга');
      console.error('Monitoring data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkNotificationAsRead = async (notificationId: number) => {
    try {
      await apiService.post(`/monitoring/notifications/${notificationId}/mark-read`);
      // Обновляем список уведомлений
      const response = await apiService.get('/monitoring/notifications');
      setNotifications(response.data);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleCleanup = async () => {
    try {
      await apiService.post('/monitoring/cleanup', { days: 30 });
      fetchData(); // Обновляем данные
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Мониторинг системы</h1>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          <Button onClick={handleCleanup} variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Очистка
          </Button>
        </div>
      </div>

      {/* Статус системы */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(systemHealth.system_status)}
              Состояние системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge 
                variant="default" 
                className={`${getStatusColor(systemHealth.system_status)} text-white`}
              >
                {systemHealth.system_status === 'healthy' ? 'Здорово' : 
                 systemHealth.system_status === 'warning' ? 'Предупреждение' : 'Ошибка'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Последнее обновление: {new Date().toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Основная статистика */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего заданий</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_jobs}</div>
              <p className="text-xs text-muted-foreground">
                Активных: {statistics.active_jobs}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Недавние выполнения</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.recent_executions}</div>
              <p className="text-xs text-muted-foreground">
                За последние 24 часа
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Успешных выполнений</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.successful_executions}</div>
              <p className="text-xs text-muted-foreground">
                Процент успеха: {Math.round(statistics.success_rate)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Неудачных выполнений</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.failed_executions}</div>
              <p className="text-xs text-muted-foreground">
                Требуют внимания
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Детальная информация */}
      <Tabs defaultValue="failed-jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="failed-jobs">Неудачные задания</TabsTrigger>
          <TabsTrigger value="notifications">Уведомления</TabsTrigger>
        </TabsList>

        <TabsContent value="failed-jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Неудачные выполнения заданий</CardTitle>
            </CardHeader>
            <CardContent>
              {failedJobs.length === 0 ? (
                <p className="text-muted-foreground">Нет неудачных выполнений</p>
              ) : (
                <div className="space-y-4">
                  {failedJobs.map((job, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{job.job_name}</h4>
                        <Badge variant="error">
                          Ошибка
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(job.executed_at).toLocaleString()}
                      </p>
                      <p className="text-sm text-red-600">{job.error}</p>
                      {job.results && job.results.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm cursor-pointer">Результаты</summary>
                          <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto">
                            {JSON.stringify(job.results, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Системные уведомления</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-muted-foreground">Нет уведомлений</p>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <span className="font-medium">Уведомление #{notification.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            {notification.status}
                          </Badge>
                          {notification.status !== 'read' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkNotificationAsRead(notification.id)}
                            >
                              Отметить как прочитанное
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm mb-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Получатели: {notification.recipients.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringPage; 