import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Check, ExternalLink, History } from 'lucide-react';
import { format } from 'date-fns';

// Временные мок-данные
const mockAlerts = [
  {
    id: 1,
    title: "Высокая загрузка CPU",
    status: "firing",
    severity: "critical",
    player_name: "Сервер-1",
    player_id: "srv-001",
    created_at: new Date().toISOString(),
    description: "Загрузка CPU превысила 90%"
  },
  {
    id: 2,
    title: "Недостаточно памяти",
    status: "firing",
    severity: "warning",
    player_name: "Сервер-2",
    player_id: "srv-002",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    description: "Свободно менее 10% RAM"
  },
  {
    id: 3,
    title: "Обновление системы",
    status: "resolved",
    severity: "info",
    player_name: "Роутер",
    player_id: "rt-01",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    resolved_at: new Date().toISOString()
  }
];

const AlertItem = ({ alert }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-700 rounded-md mb-2 overflow-hidden bg-gray-800">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-750"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-3 ${
            alert.severity === 'critical' ? 'bg-red-500' : 
            alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
          }`} />
          <div>
            <h3 className="font-medium">{alert.title}</h3>
            <p className="text-xs text-gray-400">
              {format(new Date(alert.created_at), 'HH:mm:ss')} • {alert.player_name}
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
          </div>
        </div>
      )}
    </div>
  );
};

const AlertsPanel = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`border-t border-gray-700 bg-gray-850 ${collapsed ? 'h-10' : 'h-64'}`}>
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center">
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <h3 className="ml-2 font-medium">Алерты (тестовые)</h3>
        </button>
      </div>
      
      {!collapsed && (
        <div className="p-3 overflow-y-auto h-[calc(100%-36px)]">
          {mockAlerts.map(alert => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;