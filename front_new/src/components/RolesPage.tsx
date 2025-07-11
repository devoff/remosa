import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../lib/useApi';
import { User } from '../types';
import { Table, Select, Spin, Alert, message, Typography, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { Text } = Typography;

const RolesPage: React.FC = () => {
  const { get, put } = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUsers, setUpdatingUsers] = useState<Set<number>>(new Set());

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data: User[] = await get('/users/');
      setUsers(Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: number, newRole: 'superadmin' | 'user') => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    const adminCount = users.filter(u => u.role === 'superadmin').length;
    if (userToUpdate.role === 'superadmin' && newRole === 'user' && adminCount <= 1) {
      message.error('Нельзя понизить роль последнего администратора!');
      return;
    }

    setUpdatingUsers(prev => new Set(prev).add(userId));
    try {
      // Для смены роли нужно передавать только изменяемое поле
      await put(`/users/${userId}/`, { role: newRole });
      message.success(`Роль для ${userToUpdate.email} успешно изменена.`);
      
      // Обновляем состояние локально для мгновенного отклика
      setUsers(prevUsers => 
        prevUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error(err);
      message.error('Ошибка при изменении роли.');
    } finally {
      setUpdatingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <Text copyable>{email}</Text>,
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: 200,
      render: (role: 'superadmin' | 'user', record: User) => (
        <Select
          value={role}
          onChange={(newRole) => handleRoleChange(record.id, newRole as any)}
          style={{ width: 150 }}
          loading={updatingUsers.has(record.id)}
          disabled={updatingUsers.has(record.id)}
        >
          <Option value="superadmin">
            <Tag color="blue">Администратор</Tag>
          </Option>
          <Option value="user">
            <Tag color="green">Пользователь</Tag>
          </Option>
        </Select>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Активен' : 'Неактивен'}
        </Tag>
      ),
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Spin tip="Загрузка пользователей..." size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Typography.Title level={2} className="mb-6">
        Управление ролями пользователей
      </Typography.Title>
      {error && <Alert message={error} type="error" showIcon className="mb-4" />}
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        className="dark:bg-gray-800"
        bordered
      />
    </div>
  );
};

export default RolesPage; 