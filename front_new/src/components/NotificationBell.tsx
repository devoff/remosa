import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge, Dropdown, Menu, Button, Spin, Typography, Divider, Empty } from 'antd';
import { useNotifications } from '../lib/useNotifications';
import { Notification } from '../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const { Text } = Typography;

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return '🚨';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getTypeColor = (type: string) => {
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

  return (
    <div 
      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
        !notification.read_status ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <span className="text-lg">{getTypeIcon(notification.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <Text 
              strong={!notification.read_status} 
              className="text-sm"
              style={{ color: getTypeColor(notification.type) }}
            >
              {notification.title}
            </Text>
            {!notification.read_status && (
              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
            )}
          </div>
          <Text className="text-xs text-gray-600 block truncate">
            {notification.message}
          </Text>
          <Text className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(notification.created_at), { 
              addSuffix: true, 
              locale: ru 
            })}
          </Text>
        </div>
      </div>
    </div>
  );
};

const NotificationBell: React.FC = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
  } = useNotifications();

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

  const dropdownContent = (
    <div className="w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border">
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <Text strong className="text-sm">
            Уведомления
            {unreadCount > 0 && (
              <Badge count={unreadCount} className="ml-2" />
            )}
          </Text>
          {unreadCount > 0 && (
            <Button 
              type="link" 
              size="small" 
              onClick={handleMarkAllRead}
              className="p-0 h-auto text-xs"
            >
              Прочитать всё
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <Spin size="small" />
            <Text className="ml-2 text-sm text-gray-600">Загрузка...</Text>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4">
            <Empty 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Нет уведомлений"
              className="text-sm"
            />
          </div>
        ) : (
          notifications.map((notification, index) => (
            <div key={notification.id}>
              <NotificationItem 
                notification={notification} 
                onMarkAsRead={markAsRead}
              />
              {index < notifications.length - 1 && <Divider className="m-0" />}
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t bg-gray-50 text-center">
          <Button type="link" size="small" className="text-xs">
            Показать все
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
      placement="bottomRight"
      trigger={['click']}
      dropdownRender={() => dropdownContent}
    >
      <button className="relative p-2 rounded-md hover:bg-gray-700 transition-colors">
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Bell size={20} className="text-white" />
        </Badge>
      </button>
    </Dropdown>
  );
};

export default NotificationBell; 