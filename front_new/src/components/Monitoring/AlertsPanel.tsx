import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Alert } from '@/types/alert';
import { api } from '@/lib/api';
import { Spin, Alert as AntdAlert, Typography } from 'antd';
import { config } from '../../config/runtime';

const { Title } = Typography;

console.log('AlertsPanel: Компонент загружен');

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
              {format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm:ss')} • {alert.player_name}
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
          <p className="text-sm dark:text-gray-300">{alert.description}</p>
          <div className="mt-3 text-xs dark:text-gray-500">
            ID: {alert.id} • {alert.player_id}
            {alert.resolved_at && (
                <p className="text-xs dark:text-gray-400 mt-1">Разрешено: {format(new Date(alert.resolved_at), 'dd.MM.yyyy HH:mm:ss')}</p>
            )}
          </div>
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

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('AlertsPanel: Отправка запроса на алерты к API_URL:', `${config.API_URL}/alerts/`);
      const data = await api.getAlerts();
      setAlerts(data);
      setError(null);
    } catch (err) {
      console.error("Ошибка при получении алертов:", err);
      setError("Не удалось загрузить алерты.");
    } finally {
      setLoading(false);
    }
  }, [setAlerts, setError, setLoading]);

  useEffect(() => {
    console.log('AlertsPanel: useEffect запущен');
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
    <div>
      <Title level={4} className="dark:text-gray-100">Журнал Алертов</Title>
      {alerts.length === 0 && (
        <p className="text-gray-400 text-center">Нет активных алертов.</p>
      )}
      {alerts.length > 0 && alerts.map((alert: Alert) => (
        <AlertItem key={alert.id} alert={alert} onResolve={fetchAlerts} setParentError={setError} />
      ))}
    </div>
  );
};

export default AlertsPanel; 