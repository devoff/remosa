import React from 'react';
import { 
  Activity, 
  Server, 
  Clock, 
  Database, 
  AlertCircle, 
  Check, 
  RefreshCcw 
} from 'lucide-react';

const StatusBar: React.FC = () => {
  // В реальном приложении эти данные будут приходить из API
  const stats = {
    uptime: '12ч 45м',
    activeDevices: 24,
    firingAlerts: 2,
    resolvedAlerts: 8,
    lastAlert: '15:42:30',
    dbConnections: 5,
    apiStatus: 'ok',
    telegramStatus: 'ok'
  };
  
  return (
    <div className="bg-gray-850 border-t border-gray-700 py-1 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <div className="flex items-center">
            <Clock size={14} className="mr-1.5" />
            <span>Uptime: {stats.uptime}</span>
          </div>
          
          <div className="flex items-center">
            <Server size={14} className="mr-1.5" />
            <span>Устройства: {stats.activeDevices}</span>
          </div>
          
          <div className="flex items-center">
            <AlertCircle size={14} className="mr-1.5 text-red-500" />
            <span>Активные алерты: {stats.firingAlerts}</span>
          </div>
          
          <div className="flex items-center">
            <Check size={14} className="mr-1.5 text-green-500" />
            <span>Решенные: {stats.resolvedAlerts}</span>
          </div>
          
          <div className="flex items-center">
            <Database size={14} className="mr-1.5" />
            <span>БД: {stats.dbConnections} соединений</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center">
            <span className="mr-2">API:</span>
            <span className={`inline-flex items-center ${
              stats.apiStatus === 'ok' ? 'text-green-500' : 'text-red-500'
            }`}>
              <Activity size={14} className="mr-1" />
              {stats.apiStatus === 'ok' ? 'Онлайн' : 'Ошибка'}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2">Telegram:</span>
            <span className={`inline-flex items-center ${
              stats.telegramStatus === 'ok' ? 'text-green-500' : 'text-red-500'
            }`}>
              <Activity size={14} className="mr-1" />
              {stats.telegramStatus === 'ok' ? 'Подключен' : 'Ошибка'}
            </span>
          </div>
          
          <button className="p-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
            <RefreshCcw size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;