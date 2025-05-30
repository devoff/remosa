import React from 'react';
import { Bell, Settings, Menu, Terminal, Search, HelpCircle, AlertCircle } from 'lucide-react';
import { useFlowStore } from '../store/flowStore';

const Header: React.FC = () => {
  const { startSimulation, stopSimulation, simulation } = useFlowStore();
  
  return (
    <header className="bg-gray-800 border-b border-gray-700 py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-md hover:bg-gray-700 transition-colors">
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-semibold text-blue-400">
            Система Мониторинга
          </h1>
        </div>
        
        <div className="flex items-center">
          <div className="mr-2 relative">
            <div className="bg-gray-700 rounded-md py-1 px-3 flex items-center">
              <Search size={16} className="text-gray-400 mr-2" />
              <input 
                type="text"
                placeholder="Поиск..."
                className="bg-transparent border-none outline-none text-sm text-gray-200 w-40"
              />
            </div>
          </div>
          
          <div className="flex space-x-1">
            {simulation.running ? (
              <button 
                onClick={() => stopSimulation()}
                className="flex items-center py-1 px-3 bg-red-700 hover:bg-red-800 text-white rounded-md text-sm transition-colors"
              >
                <AlertCircle size={16} className="mr-1" />
                Остановить
              </button>
            ) : (
              <button 
                onClick={() => startSimulation()}
                className="flex items-center py-1 px-3 bg-green-700 hover:bg-green-800 text-white rounded-md text-sm transition-colors"
              >
                <Terminal size={16} className="mr-1" />
                Запустить
              </button>
            )}
            
            <button className="relative p-2 rounded-md hover:bg-gray-700 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <button className="p-2 rounded-md hover:bg-gray-700 transition-colors">
              <Settings size={20} />
            </button>
            
            <button className="p-2 rounded-md hover:bg-gray-700 transition-colors">
              <HelpCircle size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;