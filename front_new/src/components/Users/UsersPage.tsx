import React, { useEffect, useState, useCallback } from 'react';
import { Card, Spin, Alert, Table, Tag, Typography, Button, Space, Modal, Form, Input, Select, Checkbox } from 'antd';
import { useApi } from '../../lib/useApi';
import { User, UserCreate } from '../../types';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

interface Platform {
  id: number;
  name: string;
}

const UsersPage = () => {
  const { get, post, put, remove } = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [platforms, setPlatforms] = useState<Platform[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get('/users/');
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке пользователей:', err);
      setError('Не удалось загрузить список пользователей.');
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchPlatforms = useCallback(async () => {
    try {
      const data = await get('/platforms/'); // Предполагаемый эндпоинт для платформ
      setPlatforms(data);
    } catch (err) {
      console.error('Ошибка при загрузке платформ:', err);
    }
  }, [get]);

  useEffect(() => {
    fetchUsers();
    fetchPlatforms();
  }, [fetchUsers, fetchPlatforms]);

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      is_active: user.is_active,
      role: user.role,
      platform_id: user.platform_id,
    });
    setIsModalVisible(true);
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await remove(`/users/${id}`);
        fetchUsers(); // Обновляем список
      } catch (err) {
        console.error('Ошибка при удалении пользователя:', err);
        setError('Не удалось удалить пользователя.');
      }
    }
  };

  const handleSaveUser = async (values: any) => {
    try {
      if (editingUser) {
        await put(`/users/${editingUser.id}`, values);
      } else {
        await post('/auth/register', values); // Исправлен эндпоинт для регистрации
      }
      setIsModalVisible(false);
      fetchUsers(); // Обновляем список
      setError(null);
    } catch (err: any) {
      console.error('Ошибка при сохранении пользователя:', err);
      setError(err.response?.data?.detail || err.message || 'Неизвестная ошибка');
    }
  };

  const userColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
      onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
    },
    {
      title: 'Активен',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active: boolean) => (
        <Tag color={is_active ? 'green' : 'red'}>
          {is_active ? 'Да' : 'Нет'}
        </Tag>
      ),
      onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
      onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={
          role === 'admin' ? 'blue' : 
          'green'
        }>
          {role.toUpperCase()}
        </Tag>
      ),
      sorter: (a: User, b: User) => a.role.localeCompare(b.role),
      onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
      onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
    },
    {
      title: 'ID платформы',
      dataIndex: 'platform_id',
      key: 'platform_id',
      render: (platform_id: number | null) => {
        if (platform_id === null) return 'Глобальный';
        const platform = platforms.find((p: Platform) => p.id === platform_id);
        return platform ? platform.name : platform_id;
      },
      onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
      onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEditUser(record)}>
            Редактировать
          </Button>
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteUser(record.id)}>
            Удалить
          </Button>
        </Space>
      ),
      onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
      onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
    },
  ];

  if (loading) {
    return <Spin tip="Загрузка пользователей..." />;
  }

  if (error) {
    return <Alert message="Ошибка" description={error} type="error" showIcon />;
  }

  return (
    <Card 
      title={<h2 className="text-xl font-semibold dark:text-gray-100">Управление пользователями</h2>} 
      style={{ margin: '20px' }} 
      className="dark:bg-gray-800 rounded-lg" 
      bodyStyle={{ padding: '16px' }} 
    >
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser} style={{ marginBottom: 16 }}>
        Добавить пользователя
      </Button>

      {error && <Alert message="Ошибка" description={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Table 
        dataSource={users} 
        columns={userColumns} 
        rowKey="id" 
        pagination={{ pageSize: 10 }} 
        className="min-w-full dark:bg-gray-800 rounded-lg" 
        rowClassName="border-t border-gray-700 hover:bg-gray-700" 
      />

      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveUser}
          initialValues={{ role: 'user', is_active: true }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Пожалуйста, введите email!' },
              { type: 'email', message: 'Неверный формат Email!' }
            ]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="Пароль"
              rules={[{ required: true, message: 'Пожалуйста, введите пароль!' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          {editingUser && (
            <Form.Item
              name="password"
              label="Новый пароль (оставьте пустым для сохранения текущего)"
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Пожалуйста, выберите роль!' }]}
          >
            <Select>
              <Option value="user">Пользователь</Option>
              <Option value="admin">Админ</Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked">
            <Checkbox>Активен</Checkbox>
          </Form.Item>
          <Form.Item
            name="platform_id"
            label="Платформа"
          >
            <Select allowClear placeholder="Выберите платформу (оставьте пустым для глобального доступа)">
              {platforms.map((platform: Platform) => (
                <Option key={platform.id} value={platform.id}>{platform.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingUser ? 'Сохранить изменения' : 'Добавить пользователя'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UsersPage; 