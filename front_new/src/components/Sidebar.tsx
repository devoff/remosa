import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Database, 
  Server, 
  Activity, 
  Clock, 
  Users, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  Briefcase,
  FileText,
  Shield,
  Home,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useFlowStore } from '../store/flowStore';
import { getCategoryColors } from '../components/NodeTypes';
import { nodeTypes } from '../components/NodeTypes';
import { useApi } from '../lib/useApi'; 
import { SystemStatus } from '../types/SystemStatus'; 
import { Alert } from '../types/alert';
import { useAuth } from '../lib/useAuth';

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false 
}: SidebarSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="mb-2">
      <button 
        className="w-full flex items-center justify-between py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <span className="mr-2">{icon}</span>
          <span className="font-medium">{title}</span>
        </div>
        <span>
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      
      {isOpen && children && (
        <div className="pl-9 pr-3 py-2 text-sm space-y-1">
          {children}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const { flows, currentFlow } = useFlowStore();
  const categoryColors = getCategoryColors();
  const { get } = useApi(); 
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null); 
  const { user, isSuperAdmin } = useAuth();

  // --- История алертов ---
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setAlertsLoading(true);
        const data = await get('/alerts/');
        setAlerts(Array.isArray(data) ? data : []);
      } catch (e) {
        setAlerts([]);
      } finally {
        setAlertsLoading(false);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [get]);

  // Подсчёт алертов по датам
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 24*60*60*1000).toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);

  const countToday = alerts.filter(a => a.created_at && a.created_at.slice(0,10) === today).length;
  const countYesterday = alerts.filter(a => a.created_at && a.created_at.slice(0,10) === yesterday).length;
  const countWeek = alerts.filter(a => a.created_at && new Date(a.created_at) >= weekAgo).length;

  const formatTime = (isoString: string | null) => {
    if (!isoString || isoString === "N/A") return "N/A";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Ошибка форматирования времени в сайдбаре:", e);
      return "N/A";
    }
  };

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const data: SystemStatus = await get('/stats/dashboard');
        setSystemStatus(data);
      } catch (error) {
        console.error('Ошибка при получении статуса системы в сайдбаре:', error);
      }
    };
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 60000); 
    return () => clearInterval(interval);
  }, [get]);
  
  // Получаем текущий поток
  const flow = flows.find(f => f.id === currentFlow) || flows[0];
  
  // Подсчитываем статистику узлов по категориям
  const categoryStats = flow.nodes.reduce((acc, node) => {
    const nodeType = nodeTypes[node.type];
    if (nodeType) {
      const category = nodeType.category;
      acc[category] = (acc[category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Для superadmin показываем обновленный sidebar
  if (isSuperAdmin) {
    return (
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
        <div className="p-4 pb-2">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            Панель мониторинга
          </h2>

          <Link to="/" className="flex items-center py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors mb-2">
            <Home size={18} className="text-cyan-400 mr-2" />
            <span className="font-medium">Устройства</span>
          </Link>

          <SidebarSection 
            title="Администрирование" 
            icon={<Briefcase size={18} className="text-orange-400" />}
            defaultOpen={true}
          >
            <Link to="/users" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Пользователи и роли
            </Link>
            <Link to="/command-templates" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Шаблоны команд
            </Link>
            <Link to="/admin/platforms" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Платформы
            </Link>
            <Link to="/devices" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Устройства (админ)
            </Link>
          </SidebarSection>

          <SidebarSection 
            title="Мониторинг" 
            icon={<Activity size={18} className="text-green-400" />}
          >
            <Link to="/status" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Статус системы
            </Link>
            <Link to="/exporters" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Экспортеры Prometheus
            </Link>
            <Link to="/jobs" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Задания (Алерты)
            </Link>
            <Link to="/devices-prometheus" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Устройства из Prometheus
            </Link>
            <Link to="/monitoring" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Мониторинг системы
            </Link>
          </SidebarSection>

          {/* Журналы */}
          <SidebarSection 
            title="Журналы" 
            icon={<FileText size={18} className="text-orange-400" />}
          >
            <Link to="/audit-logs" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Журнал действий
            </Link>
            <Link to="/logs" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Журнал уведомлений
            </Link>
            <Link to="/command-logs" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
              Журнал команд
            </Link>
          </SidebarSection>
        </div>
        <div className="mt-auto border-t border-gray-700">
          <div className="p-4 space-y-2">
            <div className="mb-2">
              <div className="text-xs text-gray-400 font-semibold mb-1">История алертов</div>
              {alertsLoading ? (
                <div className="text-xs text-gray-400">Загрузка...</div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Сегодня</span>
                    <span className="bg-gray-600 text-xs px-1.5 rounded-full">{countToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Вчера</span>
                    <span className="bg-gray-600 text-xs px-1.5 rounded-full">{countYesterday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>За неделю</span>
                    <span className="bg-gray-600 text-xs px-1.5 rounded-full">{countWeek}</span>
                  </div>
                </div>
              )}
            </div>
            <Link to="/settings" className="w-full flex items-center text-gray-300 hover:bg-gray-700 py-2 px-3 rounded-md transition-colors">
              <Settings size={18} className="mr-2" />
              <span>Настройки</span>
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  // Для пользователей платформы — новый лаконичный sidebar
  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
      <div className="p-4 pb-2">
        <Link to="/" className="flex items-center py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors mb-2">
          <Home size={18} className="text-cyan-400 mr-2" />
          <span className="font-medium">Устройства</span>
        </Link>
        <Link to="/command-templates" className="flex items-center py-2 px-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors mb-2">
          <FileText size={18} className="text-blue-400 mr-2" />
          <span className="font-medium">Шаблоны команд</span>
        </Link>
        <SidebarSection 
          title="Журналы" 
          icon={<FileText size={18} className="text-orange-400" />}>
          <Link to="/audit-logs" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
            Журнал действий
          </Link>
          <Link to="/logs" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
            Журнал уведомлений
          </Link>
          <Link to="/command-logs" className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer block">
            Журнал команд
          </Link>
        </SidebarSection>
      </div>
      <div className="mt-auto border-t border-gray-700">
        <div className="p-4 space-y-2">
          <div className="mb-2">
            <div className="text-xs text-gray-400 font-semibold mb-1">История алертов</div>
            {alertsLoading ? (
              <div className="text-xs text-gray-400">Загрузка...</div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Сегодня</span>
                  <span className="bg-gray-600 text-xs px-1.5 rounded-full">{countToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Вчера</span>
                  <span className="bg-gray-600 text-xs px-1.5 rounded-full">{countYesterday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>За неделю</span>
                  <span className="bg-gray-600 text-xs px-1.5 rounded-full">{countWeek}</span>
                </div>
              </div>
            )}
          </div>
          <Link to="/settings" className="w-full flex items-center text-gray-300 hover:bg-gray-700 py-2 px-3 rounded-md transition-colors">
            <Settings size={18} className="mr-2" />
            <span>Настройки</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
