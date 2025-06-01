import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Check, ExternalLink, History } from 'lucide-react';
import { format } from 'date-fns';
import { Alert } from '@/types/alert';
import { api } from '@/lib/api';
import { CommandLog } from '@/types/index';

const AlertItem = ({ alert }: { alert: Alert }) => {
  const [expanded, setExpanded] = useState(false);

  const handleResolve = async () => {
    try {
      // Здесь будет вызов API для разрешения алерта
      await api.resolveAlert(Number(alert.id));
      // После успешного разрешения, обновим список алертов
      window.location.reload(); // Простой способ для обновления, можно улучшить
    } catch (error) {
      console.error("Ошибка при разрешении алерта:", error);
      window.alert("Не удалось разрешить алерт."); // Простой alert для пользователя
    }
  };

  return (
    <div className="border border-gray-700 rounded-md mb-2 overflow-hidden bg-gray-800">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-750"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-3 ${
            alert.status === 'firing' ? 'bg-red-500' : 'bg-green-500'
          }`} />
          <div>
            <h3 className="font-medium">{alert.title}</h3>
            <p className="text-xs text-gray-400">
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
          <p className="text-sm text-gray-300">{alert.description}</p>
          <div className="mt-3 text-xs text-gray-500">
            ID: {alert.id} • {alert.player_id}
            {alert.resolved_at && (
                <p className="text-xs text-gray-400 mt-1">Разрешено: {format(new Date(alert.resolved_at), 'dd.MM.yyyy HH:mm:ss')}</p>
            )}
          </div>
          {alert.status === 'firing' && (
            <button
              onClick={handleResolve}
              className="mt-3 px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 transition duration-300 text-sm"
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
  const [collapsed, setCollapsed] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const fetchedLogs: CommandLog[] = await api.getLogsByLevel('alert');
        const mappedAlerts: Alert[] = fetchedLogs.map(log => {
          let extraDataParsed: any = {};
          try {
            extraDataParsed = log.extra_data || {};
          } catch (e) {
            console.error("Ошибка обработки extra_data:", e);
          }

          // Определяем severity на основе статуса
          let severity: Alert['severity'] = 'info';
          if (log.status === 'firing') {
            severity = 'critical';
          } else if (log.status === 'resolved') {
            severity = 'info';
          }

          return {
            id: log.id,
            title: extraDataParsed.alert_name || 'Неизвестный алерт',
            status: log.status || 'unknown',
            severity: severity,
            player_name: extraDataParsed.player_name || 'Неизвестный плеер',
            player_id: extraDataParsed.player_id || 'N/A',
            created_at: log.created_at,
            updated_at: log.updated_at,
            resolved_at: log.status === 'resolved' && log.updated_at ? log.updated_at : undefined, // Используем updated_at как resolved_at
            description: extraDataParsed.summary || log.message,
          };
        });
        setAlerts(mappedAlerts);
      } catch (err) {
        console.error("Ошибка при получении алертов:", err);
        setError("Не удалось загрузить алерты.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Обновляем каждые 60 секунд
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`border-t border-gray-700 bg-gray-850 ${collapsed ? 'h-10' : 'h-64'}`}>
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center">
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <h3 className="ml-2 font-medium">Алерты {loading ? '(загрузка...)' : error ? '(ошибка)' : ''}</h3>
        </button>
      </div>
      
      {!collapsed && (
        <div className="p-3 overflow-y-auto">
          {error && <p className="text-red-500 text-center">{error}</p>}
          {loading && <p className="text-gray-400 text-center">Загрузка алертов...</p>}
          {!loading && !error && alerts.length === 0 && (
            <p className="text-gray-400 text-center">Нет активных алертов.</p>
          )}
          {!loading && !error && alerts.length > 0 && alerts.map(alert => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;