import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge, Dropdown, Button, Spin, Typography, Divider, Empty } from 'antd';
import { useNotifications } from '../lib/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
const { Text } = Typography;
const NotificationItem = ({ notification, onMarkAsRead }) => {
    const getTypeIcon = (type) => {
        switch (type) {
            case 'alert': return '🚨';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '📢';
        }
    };
    const getTypeColor = (type) => {
        switch (type) {
            case 'alert': return '#ff4d4f';
            case 'error': return '#ff4d4f';
            case 'warning': return '#fa8c16';
            case 'info': return '#1890ff';
            default: return '#666';
        }
    };
    const handleClick = () => {
        if (!notification.read_status) {
            onMarkAsRead(notification.id);
        }
    };
    return (_jsx("div", { className: `p-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notification.read_status ? 'bg-blue-50' : ''}`, onClick: handleClick, children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("span", { className: "text-lg", children: getTypeIcon(notification.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Text, { strong: !notification.read_status, className: "text-sm", style: { color: getTypeColor(notification.type) }, children: notification.title }), !notification.read_status && (_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full ml-2" }))] }), _jsx(Text, { className: "text-xs text-gray-600 block truncate", children: notification.message }), _jsx(Text, { className: "text-xs text-gray-400", children: formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ru
                            }) })] })] }) }));
};
const NotificationBell = () => {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const { notifications, unreadCount, loading, fetchNotifications, markAllAsRead, markAsRead, } = useNotifications();
    // Загружаем уведомления при открытии дропдауна
    useEffect(() => {
        if (dropdownVisible) {
            fetchNotifications(10, false);
        }
    }, [dropdownVisible, fetchNotifications]);
    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setDropdownVisible(false);
    };
    const dropdownContent = (_jsxs("div", { className: "w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border", children: [_jsx("div", { className: "p-3 border-b bg-gray-50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Text, { strong: true, className: "text-sm", children: ["\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F", unreadCount > 0 && (_jsx(Badge, { count: unreadCount, className: "ml-2" }))] }), unreadCount > 0 && (_jsx(Button, { type: "link", size: "small", onClick: handleMarkAllRead, className: "p-0 h-auto text-xs", children: "\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0432\u0441\u0451" }))] }) }), _jsx("div", { className: "max-h-64 overflow-y-auto", children: loading ? (_jsxs("div", { className: "p-4 text-center", children: [_jsx(Spin, { size: "small" }), _jsx(Text, { className: "ml-2 text-sm text-gray-600", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })] })) : notifications.length === 0 ? (_jsx("div", { className: "p-4", children: _jsx(Empty, { image: Empty.PRESENTED_IMAGE_SIMPLE, description: "\u041D\u0435\u0442 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439", className: "text-sm" }) })) : (notifications.map((notification, index) => (_jsxs("div", { children: [_jsx(NotificationItem, { notification: notification, onMarkAsRead: markAsRead }), index < notifications.length - 1 && _jsx(Divider, { className: "m-0" })] }, notification.id)))) }), notifications.length > 0 && (_jsx("div", { className: "p-3 border-t bg-gray-50 text-center", children: _jsx(Button, { type: "link", size: "small", className: "text-xs", children: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432\u0441\u0435" }) }))] }));
    return (_jsx(Dropdown, { open: dropdownVisible, onOpenChange: setDropdownVisible, placement: "bottomRight", trigger: ['click'], dropdownRender: () => dropdownContent, children: _jsx("button", { className: "relative p-2 rounded-md hover:bg-gray-700 transition-colors", children: _jsx(Badge, { count: unreadCount, size: "small", offset: [-2, 2], children: _jsx(Bell, { size: 20, className: "text-white" }) }) }) }));
};
export default NotificationBell;
