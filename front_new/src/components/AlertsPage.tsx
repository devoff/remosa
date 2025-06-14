import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Check, ExternalLink, History } from 'lucide-react';
import { format } from 'date-fns';
import { Alert } from '@/types/alert';
import { api } from '@/lib/api';
import { Card, Spin, Alert as AntdAlert, Typography } from 'antd';

const { Title } = Typography;

console.log('AlertsPage: Компонент загружен');

const AlertItem = ({ alert, onResolve, setParentError }: { alert: Alert; onResolve: () => void; setParentError: (error: string | null) => void; }) => {
  const [expanded, setExpanded] = useState(false);

  const handleResolve = async () => {
    try {
      await api.resolveAlert(Number(alert.id));
      onResolve(); // Обновляем список алертов
      setParentError(null); // Очищаем ошибку
    } catch (error) {
      console.error("Ошибка при разрешении алерта:", error);
      setParentError("Не удалось разрешить алерт.");
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg mb-2 overflow-hidden bg-gray-800">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-750"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-3 ${
            alert.status === 'firing' ? 'bg-red-500' : 'bg-green-500'
          }`} />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium dark:text-gray-100">{alert.title}</h3>
            <p className="text-xs dark:text-gray-300">
              {format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm:ss')} • {alert.data?.summary || 'Нет описания'}
            </p>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${
          alert.status === 'firing' ? 'bg-red-900/40 text-red-500' : 'bg-green-900/40 text-green-500'
        }`}>
          {alert.status === 'firing' ? 'Активен' : 'Решен'}
        </div>
      </div>
      
      {expanded && (
        <div className="p-3 border-t border-gray-700 bg-gray-750">
          {alert.description && <p className="text-sm dark:text-gray-300 mb-2">Описание: {alert.description}</p>}
          <div className="mt-2 text-xs dark:text-gray-500">
            <p>ID: {alert.id}</p>
            {alert.player_id && <p>Player ID: {alert.player_id}</p>}
            {alert.resolved_at && (
                <p className="text-xs dark:text-gray-400 mt-1">Разрешено: {format(new Date(alert.resolved_at), 'dd.MM.yyyy HH:mm:ss')}</p>
            )}
          </div>

          {/* Дополнительная информация из поля data */}
          {alert.data && typeof alert.data === 'object' && (
            <div className="mt-3 text-xs dark:text-gray-400">
              <h4 className="font-semibold mb-1">Детали алерта из Grafana:</h4>
              <p>Серьёзность: {alert.data.severity || 'Не указано'}</p>
              <p>Начало: {alert.data.startsAt || 'Не указано'}</p>
              <p>Конец: {alert.data.endsAt || 'Не указано'}</p>
              <p>Плеер: {alert.data.player_name || 'Неизвестный'}</p>
              <p>Платформа: {alert.data.platform || 'Неизвестная'}</p>
              {/* Добавляем остальные поля по необходимости */}
              {Object.entries(alert.data).map(([key, value]) => (
                key !== 'severity' && key !== 'startsAt' && key !== 'endsAt' && key !== 'player_name' && key !== 'platform' && <p key={key}>{key}: {JSON.stringify(value)}</p>
              ))}
            </div>
          )}

          {alert.status === 'firing' && (
            <button
              onClick={handleResolve}
              className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
            >
              Отметить как решенный
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('AlertsPage: Отправка запроса на алерты к API_URL:', `${import.meta.env.VITE_API_URL}/alerts`);
      const data = await api.getAlerts();
      // Сортируем алерты от новых к старым (по убыванию created_at)
      const sortedData = data.sort((a: Alert, b: Alert) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setAlerts(sortedData);
      setError(null);
    } catch (err) {
      console.error("Ошибка при получении алертов:", err);
      setError("Не удалось загрузить алерты.");
    } finally {
      setLoading(false);
    }
  }, [setAlerts, setError, setLoading]);

  useEffect(() => {
    console.log('AlertsPage: useEffect запущен');
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  if (loading) {
    return <Spin tip="Загрузка алертов..." style={{ margin: '20px' }}/>;
  }

  if (error) {
    return <AntdAlert message="Ошибка" description={error} type="error" showIcon style={{ margin: '20px' }}/>;
  }

  return (
    <Card 
      title={<h2 className="text-xl font-semibold dark:text-gray-100">Журнал Алертов</h2>} 
      style={{ margin: '20px' }} 
      className="dark:bg-gray-800 rounded-lg" 
      bodyStyle={{ padding: '16px' }} 
    >
      {alerts.length === 0 && (
        <p className="text-gray-400 text-center">Нет активных алертов.</p>
      )}
      {alerts.length > 0 && alerts.map(alert => (
        <AlertItem key={alert.id} alert={alert} onResolve={fetchAlerts} setParentError={setError} />
      ))}
    </Card>
  );
};

export default AlertsPage; 