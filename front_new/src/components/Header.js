import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useFlowStore } from '../store/flowStore';
import { useAuth } from '../lib/useAuth';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Divider, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import apiClient from '../lib/api';
const Header = () => {
    const { startSimulation, stopSimulation, simulation } = useFlowStore();
    const { user, currentPlatform } = useAuth();
    const [infoDialogOpen, setInfoDialogOpen] = useState(false);
    const [versionInfo, setVersionInfo] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    useEffect(() => {
        // Загружаем информацию о версии при открытии диалога
        if (infoDialogOpen && !versionInfo) {
            apiClient.get('/health/version')
                .then((response) => setVersionInfo(response.data))
                .catch((error) => console.error('Ошибка загрузки версии:', error));
        }
    }, [infoDialogOpen, versionInfo]);
    const handleInfoClick = () => {
        setInfoDialogOpen(true);
    };
    const handleCloseInfo = () => {
        setInfoDialogOpen(false);
    };
    const handleMenuOpen = (event) => {
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
    return (_jsxs(_Fragment, { children: [_jsx("header", { className: "bg-gray-800 border-b border-gray-700 py-2 px-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { className: "p-2 rounded-md hover:bg-gray-700 transition-colors", children: _jsx(MenuIcon, {}) }), _jsx("h1", { className: "text-xl font-semibold text-blue-400", children: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u0438 \u043C\u043E\u043D\u0438\u0442\u043E\u0440\u0438\u043D\u0433\u0430 REMOSA" }), currentPlatform && (_jsx("div", { className: "ml-4 px-3 py-1 bg-blue-600 rounded-md", children: _jsx("span", { className: "text-sm text-white font-medium", children: currentPlatform.name }) }))] }), _jsx("div", { className: "flex items-center", children: user && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex space-x-1", children: [_jsx(NotificationBell, {}), _jsx("button", { onClick: handleInfoClick, className: "p-2 rounded-md hover:bg-gray-700 transition-colors", children: _jsx(HelpCircle, { size: 20 }) })] }), _jsxs("div", { className: "ml-4", children: [_jsx(IconButton, { onClick: handleMenuOpen, size: "small", children: _jsx(Avatar, { children: user?.email?.[0]?.toUpperCase() || '?' }) }), _jsxs(Menu, { anchorEl: anchorEl, open: Boolean(anchorEl), onClose: handleMenuClose, children: [_jsx(MenuItem, { onClick: handleOpenProfile, children: "\u041B\u0438\u0447\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F" }), _jsx(MenuItem, { onClick: handleOpenPlatformInfo, children: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435" }), _jsx(MenuItem, { onClick: handleLogout, children: "\u0412\u044B\u0439\u0442\u0438" })] })] })] })) })] }) }), _jsxs(Dialog, { open: infoDialogOpen, onClose: handleCloseInfo, maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: _jsx(Typography, { variant: "h6", component: "div", children: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u0441\u0438\u0441\u0442\u0435\u043C\u0435" }) }), _jsxs(DialogContent, { children: [_jsxs(Box, { sx: { mb: 2 }, children: [_jsx(Typography, { variant: "h6", color: "primary", gutterBottom: true, children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C" }), _jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "Email:" }), " ", user?.email || 'Неизвестно'] }), _jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "\u0420\u043E\u043B\u044C:" }), " ", user?.role || 'Неизвестно'] }), currentPlatform && (_jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430:" }), " ", currentPlatform.name] }))] }), _jsx(Divider, { sx: { my: 2 } }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsx(Typography, { variant: "h6", color: "primary", gutterBottom: true, children: "\u0412\u0435\u0440\u0441\u0438\u044F \u041F\u041E" }), versionInfo ? (_jsxs(_Fragment, { children: [_jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "\u0412\u0435\u0440\u0441\u0438\u044F:" }), " ", versionInfo.version] }), _jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "\u0414\u0430\u0442\u0430 \u0441\u0431\u043E\u0440\u043A\u0438:" }), " ", new Date(versionInfo.build_date).toLocaleString('ru-RU')] }), _jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "Python:" }), " ", versionInfo.python_version] }), _jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "API \u0432\u0435\u0440\u0441\u0438\u044F:" }), " ", versionInfo.api_version] }), _jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "\u041E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u0435:" }), " ", versionInfo.environment] }), _jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430:" }), " ", versionInfo.platform] })] })) : (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u043E \u0432\u0435\u0440\u0441\u0438\u0438..." }))] })] }), _jsx(DialogActions, { children: _jsx(Button, { onClick: handleCloseInfo, color: "primary", children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" }) })] }), _jsxs(Dialog, { open: profileDialogOpen, onClose: () => setProfileDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: _jsx(Typography, { variant: "h6", children: "\u041B\u0438\u0447\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F" }) }), _jsx(DialogContent, { children: _jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "Email:" }), " ", user?.email || 'Неизвестно'] }), _jsxs(Typography, { variant: "body2", gutterBottom: true, children: [_jsx("strong", { children: "\u0420\u043E\u043B\u044C:" }), " ", user?.role || 'Неизвестно'] })] }) }), _jsx(DialogActions, { children: _jsx(Button, { onClick: () => setProfileDialogOpen(false), color: "primary", children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" }) })] })] }));
};
export default Header;
