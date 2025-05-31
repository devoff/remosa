import React, { useEffect, useState } from 'react';
import { useApi } from '../lib/useApi';
import { SystemStatus } from '../types/SystemStatus';
import { SyncOutlined } from '@ant-design/icons';
import { message } from 'antd';

const SystemStatusPanel: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const { get } = useApi();

  const fetchSystemStatus = async () => {
    try {
      const data: SystemStatus = await get('/api/v1/stats/dashboard');
      setStatus(data);
    } catch (error) {
      console.error('Ошибка при получении статуса системы:', error);
      message.error('Не удалось загрузить статус системы.');
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
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 60000); // Обновляем каждые 60 секунд
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return (
      <div className="p-4 text-gray-300 flex items-center">
        <SyncOutlined spin className="mr-2" /> Загрузка статуса...
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2 text-gray-300 text-sm">
      <div className="flex items-center justify-between">
        <span>Uptime:</span>
        <span className="font-medium">{status.uptime}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Устройства:</span>
        <span className="font-medium">{status.totalDevices}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Активные алерты:</span>
        <span className="font-medium text-red-400">{status.activeAlerts}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Решенные:</span>
        <span className="font-medium text-green-400">{status.resolvedAlerts}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>БД:</span>
        <span className="font-medium">{status.dbConnections} соединений</span>
      </div>
      <div className="flex items-center justify-between">
        <span>API:</span>
        <span className="font-medium">{status.apiStatus}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Telegram:</span>
        <span className="font-medium">{status.telegramStatus}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Последний алерт:</span>
        <span className="font-medium">{formatTime(status.latestAlert)}</span>
      </div>
    </div>
  );
};

export default SystemStatusPanel; 