import React, { useState } from 'react';
import { 
  MessageSquare, 
  Database, 
  Server, 
  Activity, 
  Clock, 
  Users, 
  Settings, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';
import { useFlowStore } from '../store/flowStore';
import { getCategoryColors } from '../components/NodeTypes';

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
}) => {
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
  
  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
      <div className="p-4 pb-2">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">
          Панель мониторинга
        </h2>
        
        <SidebarSection 
          title="Статус системы" 
          icon={<Activity size={18} className="text-green-500" />}
          defaultOpen={true}
        >
          <div className="space-y-2 text-gray-300">
            <div className="flex items-center justify-between">
              <span>Активно:</span>
              <span className="font-medium text-green-400">Да</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Uptime:</span>
              <span>12ч 34м</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Последний алерт:</span>
              <span>14:52</span>
            </div>
          </div>
        </SidebarSection>
        
        <SidebarSection 
          title="Telegram" 
          icon={<MessageSquare size={18} className="text-blue-500" />}
        >
          <div className="space-y-1">
            <div className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between">
              <span>Пользователи</span>
              <span className="bg-gray-600 text-xs px-1.5 rounded-full">12</span>
            </div>
            <div className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between">
              <span>Сообщения</span>
              <span className="bg-gray-600 text-xs px-1.5 rounded-full">47</span>
            </div>
            <div className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between">
              <span>Команды</span>
              <span className="bg-gray-600 text-xs px-1.5 rounded-full">8</span>
            </div>
          </div>
        </SidebarSection>
        
        <SidebarSection 
          title="База данных" 
          icon={<Database size={18} className="text-green-500" />}
        >
          <div className="space-y-1">
            <div className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer">
              Устройства
            </div>
            <div className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer">
              Пользователи Telegram
            </div>
            <div className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer">
              Журнал алертов
            </div>
          </div>
        </SidebarSection>
        
        <SidebarSection 
          title="Компоненты" 
          icon={<Server size={18} className="text-purple-500" />}
        >
          <div className="space-y-1">
            {Object.entries(categoryStats).map(([category, count]) => (
              <div 
                key={category}
                className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: categoryColors[category] || '#888' }}
                  ></span>
                  <span>{category}</span>
                </div>
                <span className="bg-gray-600 text-xs px-1.5 rounded-full">{count}</span>
              </div>
            ))}
          </div>
        </SidebarSection>
        
        <SidebarSection 
          title="История алертов" 
          icon={<Clock size={18} className="text-amber-500" />}
        >
          <div className="space-y-1">
            <div className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between">
              <span>Сегодня</span>
              <span className="bg-gray-600 text-xs px-1.5 rounded-full">7</span>
            </div>
            <div className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between">
              <span>Вчера</span>
              <span className="bg-gray-600 text-xs px-1.5 rounded-full">12</span>
            </div>
            <div className="hover:bg-gray-700 py-1 px-2 rounded-md cursor-pointer flex items-center justify-between">
              <span>За неделю</span>
              <span className="bg-gray-600 text-xs px-1.5 rounded-full">43</span>
            </div>
          </div>
        </SidebarSection>
      </div>
      
      <div className="mt-auto border-t border-gray-700">
        <div className="p-4 space-y-2">
          <button className="w-full flex items-center text-gray-300 hover:bg-gray-700 py-2 px-3 rounded-md transition-colors">
            <Users size={18} className="mr-2" />
            <span>Пользователи</span>
          </button>
          
          <button className="w-full flex items-center text-gray-300 hover:bg-gray-700 py-2 px-3 rounded-md transition-colors">
            <Settings size={18} className="mr-2" />
            <span>Настройки</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;