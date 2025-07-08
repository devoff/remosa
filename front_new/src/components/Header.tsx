import React, { useState, useEffect } from 'react';
import { Bell, Settings, Menu, Terminal, Search, HelpCircle, AlertCircle } from 'lucide-react';
import { useFlowStore } from '../store/flowStore';
import { useAuth } from '../lib/useAuth';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider } from '@mui/material';

interface VersionInfo {
  version: string;
  build_date: string;
  python_version: string;
  platform: string;
  environment: string;
  api_version: string;
}

const Header: React.FC = () => {
  const { startSimulation, stopSimulation, simulation } = useFlowStore();
  const { user, currentPlatform } = useAuth();
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  
  useEffect(() => {
    // Загружаем информацию о версии при открытии диалога
    if (infoDialogOpen && !versionInfo) {
      fetch('/api/v1/health/version')
        .then(response => response.json())
        .then(data => setVersionInfo(data))
        .catch(error => console.error('Ошибка загрузки версии:', error));
    }
  }, [infoDialogOpen, versionInfo]);

  const handleInfoClick = () => {
    setInfoDialogOpen(true);
  };

  const handleCloseInfo = () => {
    setInfoDialogOpen(false);
  };

  return (
    <>
      <header className="bg-gray-800 border-b border-gray-700 py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-md hover:bg-gray-700 transition-colors">
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-blue-400">
             Платформа автоматизации мониторинга REMOSA
            </h1>
            {currentPlatform && (
              <div className="ml-4 px-3 py-1 bg-blue-600 rounded-md">
                <span className="text-sm text-white font-medium">
                  {currentPlatform.name}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <div className="flex space-x-1">
              <button className="relative p-2 rounded-md hover:bg-gray-700 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={handleInfoClick}
                className="p-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <HelpCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Модальное окно с информацией */}
      <Dialog open={infoDialogOpen} onClose={handleCloseInfo} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="div">
            Информация о системе
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Пользователь
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Email:</strong> {user?.email || 'Неизвестно'}
            </Typography>
                        <Typography variant="body2" gutterBottom>
              <strong>Роль:</strong> {user?.role || 'Неизвестно'}
            </Typography>
            {currentPlatform && (
              <Typography variant="body2" gutterBottom>
                <strong>Платформа:</strong> {currentPlatform.name}
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Версия ПО
            </Typography>
            {versionInfo ? (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>Версия:</strong> {versionInfo.version}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Дата сборки:</strong> {new Date(versionInfo.build_date).toLocaleString('ru-RU')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Python:</strong> {versionInfo.python_version}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>API версия:</strong> {versionInfo.api_version}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Окружение:</strong> {versionInfo.environment}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Платформа:</strong> {versionInfo.platform}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Загрузка информации о версии...
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInfo} color="primary">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Header;