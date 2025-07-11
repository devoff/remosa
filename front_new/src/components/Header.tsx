import React, { useState, useEffect } from 'react';
import { Bell, Settings, Terminal, Search, HelpCircle, AlertCircle } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useFlowStore } from '../store/flowStore';
import { useAuth } from '../lib/useAuth';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import apiClient from '../lib/api';

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  useEffect(() => {
    // Загружаем информацию о версии при открытии диалога
    if (infoDialogOpen && !versionInfo) {
      apiClient.get('/health/version')
        .then((response: any) => setVersionInfo(response.data))
        .catch((error: any) => console.error('Ошибка загрузки версии:', error));
    }
  }, [infoDialogOpen, versionInfo]);

  const handleInfoClick = () => {
    setInfoDialogOpen(true);
  };

  const handleCloseInfo = () => {
    setInfoDialogOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleOpenProfile = () => {
    setProfileDialogOpen(true);
    handleMenuClose();
  };
  const handleOpenPlatformInfo = () => {
    setInfoDialogOpen(true);
    handleMenuClose();
  };
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <>
      <header className="bg-gray-800 border-b border-gray-700 py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-md hover:bg-gray-700 transition-colors">
              <MenuIcon />
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
            {/* Показываем иконки только для авторизованных пользователей */}
            {user && (
              <>
                <div className="flex space-x-1">
                  <NotificationBell />
                  <button 
                    onClick={handleInfoClick}
                    className="p-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    <HelpCircle size={20} />
                  </button>
                </div>
                {/* Блок профиля пользователя */}
                <div className="ml-4">
                  <IconButton onClick={handleMenuOpen} size="small">
                    <Avatar>{user?.email?.[0]?.toUpperCase() || '?'}</Avatar>
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={handleOpenProfile}>Личная информация</MenuItem>
                    <MenuItem onClick={handleOpenPlatformInfo}>Информация о платформе</MenuItem>
                    <MenuItem onClick={handleLogout}>Выйти</MenuItem>
                  </Menu>
                </div>
              </>
            )}
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
      {/* Модалка профиля */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Личная информация</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Email:</strong> {user?.email || 'Неизвестно'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Роль:</strong> {user?.role || 'Неизвестно'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)} color="primary">Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Header;