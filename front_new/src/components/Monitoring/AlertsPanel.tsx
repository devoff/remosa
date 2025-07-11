import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Alert } from '@/types/alert';
import { api } from '@/lib/api';
import { Spin, Alert as AntdAlert, Typography } from 'antd';
import { config } from '../../config/runtime';
import { Copy, ChevronDown } from 'lucide-react';

const { Title } = Typography;

if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
  console.log('AlertsPanel: Компонент загружен');
}

const AlertItem = ({ alert, onResolve, setParentError }: { alert: Alert; onResolve: () => void; setParentError: (error: string | null) => void; }) => {
  const [expanded, setExpanded] = useState(false);

  // Обработчик разрешения алерта
  const handleResolve = async () => {
    try {
      await api.resolveAlert(Number(alert.id));
      onResolve();
      setParentError(null);
    } catch (error) {
      console.error("Ошибка при разрешении алерта:", error);
      setParentError("Не удалось разрешить алерт.");
    }
  };

  // Цветовые индикаторы статуса для точки слева
  const statusIndicatorColor = alert.status === 'firing' ? 'bg-red-500' : 'bg-green-500';
  
  return (
    <div className="border border-gray-700 rounded-lg mb-2 bg-gray-900/70 hover:bg-gray-800/40 transition-all duration-200 shadow-sm font-inter">
      <div 
        className="flex items-center px-6 py-3 cursor-pointer font-inter text-base text-gray-50" // Inter, основной размер, основной цвет
        onClick={() => setExpanded(!expanded)}
      >
        {/* Статус индикатор - цветная точка слева */}
        <div className={`w-2 h-2 rounded-full ${statusIndicatorColor} mr-6 flex-shrink-0`}></div>
        {/* Основной контент - в одну строку */}
        <div className="flex items-center flex-1 gap-8 min-w-0">
          <span className="text-gray-50 font-semibold">ID: {alert.id}</span>
          <span className="text-gray-200">{alert.platform_id ?? alert.data?.platform ?? 'PlatformA'}</span>
          <span className="text-gray-300">Player: {alert.player_name || '—'}</span>
          <span className="text-gray-400">{format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm:ss')}</span>
        </div>
        {/* Статусы справа */}
        <div className="flex items-center gap-4 ml-6">
          {alert.status === 'resolved' && (
            <span className="text-green-500 font-semibold text-base">РЕШЕН</span>
          )}
          {alert.severity === 'critical' && (
            <span className="text-red-500 font-semibold text-base">CRITICAL</span>
          )}
          <ChevronDown 
            className={`text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} 
            size={18}
          />
        </div>
      </div>
      {expanded && (
        <div className="px-6 pb-4 border-t border-gray-700/50 bg-gray-800/50 text-sm text-gray-200 font-inter">
          {alert.description && <div className="mb-2 text-gray-200"><b>Описание:</b> {alert.description}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-300 mb-2">
            <div><b>Тип:</b> {alert.data?.alert_type || '—'}</div>
            <div><b>Инстанс:</b> {alert.data?.instance || '—'}</div>
            <div><b>Job:</b> {alert.data?.job || '—'}</div>
            <div><b>Телефон:</b> {alert.data?.device_phone_number || '—'}</div>
            <div><b>Fingerprint:</b> {alert.data?.fingerprint || '—'}</div>
            <div><b>Начало:</b> {alert.data?.startsAt || '—'}</div>
            <div><b>Конец:</b> {alert.data?.endsAt || '—'}</div>
            <div><b>Графана папка:</b> {alert.data?.grafana_folder || '—'}</div>
            <div><b>Статус (деталь):</b> {alert.data?.status || '—'}</div>
            <div><b>Сообщение:</b> {alert.data?.summary || '—'}</div>
          </div>
          {/* Универсальный вывод всех data */}
          {alert.data && typeof alert.data === 'object' && (
            <div className="mt-2 text-xs text-gray-400">
              <b>Все детали:</b>
              <table className="w-full mt-1 text-xs bg-gray-900 rounded-lg">
                <tbody>
                  {Object.entries(alert.data).map(([key, value]) => (
                    <tr key={key}>
                      <td className="font-semibold pr-2 align-top text-gray-400" style={{verticalAlign:'top'}}>{key}</td>
                      <td className="text-gray-200">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {alert.status === 'firing' && (
            <button
              onClick={handleResolve}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 shadow"
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
      if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
        console.log('AlertsPanel: Отправка запроса на алерты к API_URL:', `${config.API_URL}/alerts/`);
      }
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
    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
      console.log('AlertsPanel: useEffect запущен');
    }
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
      {alerts.length > 0 && [...alerts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((alert: Alert) => (
          <AlertItem key={alert.id} alert={alert} onResolve={fetchAlerts} setParentError={setError} />
        ))}
    </div>
  );
};

export default AlertsPanel; 