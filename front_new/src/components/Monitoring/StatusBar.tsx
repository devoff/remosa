import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Server, 
  Clock, 
  Database, 
  AlertCircle, 
  Check, 
  RefreshCcw 
} from 'lucide-react';
import { useApi } from '../../lib/useApi';
import { SystemStatus } from '../../types/SystemStatus';
import { message } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useAuth } from '../../lib/useAuth';

const StatusBar: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const { get } = useApi();
  const { isAuthenticated, isSuperAdmin, currentPlatform } = useAuth();

  const fetchSystemStatus = async () => {
    try {
      let data: SystemStatus;
      if (isSuperAdmin) {
        data = await get('/stats/dashboard');
      } else if (currentPlatform?.id) {
        data = await get(`/platforms/${currentPlatform.id}/stats`);
      } else {
        setStatus(null);
        return;
      }
      setStatus(data);
    } catch (error: any) {
      console.error('Ошибка при получении статуса системы:', error);
      if (error.response && error.response.status !== 401) {
        message.error('Не удалось загрузить статус системы.');
      }
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString || isoString === "N/A") return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Ошибка форматирования времени:", e);
      return "N/A";
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSystemStatus();
      const interval = setInterval(fetchSystemStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isSuperAdmin, currentPlatform]);

  if (!status) {
    return (
      <div className="bg-gray-850 border-t border-gray-700 py-1 px-4 text-gray-300 flex items-center justify-center">
        <SyncOutlined spin className="mr-2" /> Загрузка статуса...
      </div>
    );
  }

  return (
    <div className="bg-gray-850 border-t border-gray-700 py-1 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <div className="flex items-center">
            <Clock size={14} className="mr-1.5" />
            <span>Uptime: {status.uptime}</span>
          </div>
          
          <div className="flex items-center">
            <Server size={14} className="mr-1.5" />
            <span>Устройства: {status.totalDevices}</span>
          </div>
          
          <div className="flex items-center">
            <AlertCircle size={14} className="mr-1.5 text-red-500" />
            <span>Активные алерты: {status.activeAlerts}</span>
          </div>
          
          <div className="flex items-center">
            <Check size={14} className="mr-1.5 text-green-500" />
            <span>Решенные: {status.resolvedAlerts}</span>
          </div>
          
          <div className="flex items-center">
            <Database size={14} className="mr-1.5" />
            <span>БД: {status.dbConnections} соединений</span>
          </div>
          <div className="flex items-center">
            <Clock size={14} className="mr-1.5" />
            <span>Последний алерт: {formatTime(status.latestAlert)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center">
            <span className="mr-2">API:</span>
            <span className={`inline-flex items-center ${
              status.apiStatus === 'Онлайн' ? 'text-green-500' : 'text-red-500'
            }`}>
              <Activity size={14} className="mr-1" />
              {status.apiStatus === 'Онлайн' ? 'Онлайн' : 'Ошибка'}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2">SMS шлюз:</span>
            <span className={`inline-flex items-center ${
              status.smsStatus === 'Подключен' ? 'text-green-500' : 'text-red-500'
            }`}>
              <Activity size={14} className="mr-1" />
              {status.smsStatus === 'Подключен' ? 'Подключен' : 'Ошибка'}
            </span>
          </div>
          
          <button className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors" onClick={fetchSystemStatus}>
            <RefreshCcw size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;