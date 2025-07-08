import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Alert } from '@/types/alert';
import { api } from '@/lib/api';
import { Spin, Alert as AntdAlert, Typography } from 'antd';
import { config } from '../../config/runtime';
import { CheckCircle, AlertCircle, Info, Copy, ChevronDown } from 'lucide-react';

const { Title } = Typography;

console.log('AlertsPanel: Компонент загружен');

const AlertItem = ({ alert, onResolve, setParentError }: { alert: Alert; onResolve: () => void; setParentError: (error: string | null) => void; }) => {
  const [expanded, setExpanded] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  useEffect(() => { setFadeIn(true); }, []);

  // Цвета для статусов
  const statusColor = alert.status === 'firing' ? 'bg-red-500 text-red-100' : 'bg-green-500 text-green-100';
  const statusIcon = alert.status === 'firing' ? <AlertCircle className="inline mr-1 text-red-400" size={18}/> : <CheckCircle className="inline mr-1 text-green-400" size={18}/>;
  const severityColor = alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400';

  return (
    <div className={`border border-gray-700 rounded-xl mb-4 overflow-hidden bg-gray-900 shadow-lg fade-in-alert${fadeIn ? ' show' : ''} transition-all duration-300`}
         style={{ boxShadow: expanded ? '0 4px 32px rgba(0,0,0,0.25)' : undefined }}>
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-3 h-3 rounded-full ${alert.status === 'firing' ? 'bg-red-500' : 'bg-green-500'}`}></span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg dark:text-gray-100 truncate">{alert.title}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold ml-2 bg-green-600/20 text-green-400 border border-green-400">{statusIcon}{alert.status === 'firing' ? 'Активен' : 'Решен'}</span>
              <span className={`ml-2 text-xs font-semibold uppercase ${severityColor}`}>{alert.severity}</span>
            </div>
            <div className="text-xs text-gray-400 flex flex-wrap gap-4 mt-1">
              <span><b>Плеер:</b> {alert.player_name || '—'}{alert.player_id ? ` (${alert.player_id})` : ''}</span>
              <span><b>Платформа:</b> {alert.platform_id ?? alert.data?.platform ?? '—'}</span>
              <span><b>ID:</b> {alert.id} <Copy className="inline ml-1 cursor-pointer opacity-60 hover:opacity-100" size={14} onClick={e => {e.stopPropagation(); navigator.clipboard.writeText(String(alert.id));}} /></span>
              <span><b>Время:</b> {format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm:ss')}</span>
            </div>
          </div>
        </div>
        <div className="ml-4 text-gray-400">{expanded ? <Info size={20}/> : <ChevronDown size={20}/>}</div>
      </div>
      {expanded && (
        <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl animate-fade-in">
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
              onClick={onResolve}
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
      {alerts.length > 0 && [...alerts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((alert: Alert) => (
          <AlertItem key={alert.id} alert={alert} onResolve={fetchAlerts} setParentError={setError} />
        ))}
    </div>
  );
};

export default AlertsPanel; 