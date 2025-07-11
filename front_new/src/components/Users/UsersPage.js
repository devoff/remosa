import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { Card, Spin, Alert, Table, Tag, Typography, Button, Space, Modal, Form, Input, Select, Checkbox, notification } from 'antd';
import { useApi } from '../../lib/useApi';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
const { Title } = Typography;
const { Option } = Select;
const UsersPage = () => {
    const { get, post, put, remove } = useApi();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const [platforms, setPlatforms] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await get('/users/');
            setUsers(data);
            setError(null);
        }
        catch (err) {
            console.error('Ошибка при загрузке пользователей:', err);
            setError('Не удалось загрузить список пользователей.');
        }
        finally {
            setLoading(false);
        }
    }, [get]);
    const fetchPlatforms = useCallback(async () => {
        try {
            const data = await get('/platforms/'); // Предполагаемый эндпоинт для платформ
            setPlatforms(data);
        }
        catch (err) {
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
    const handleEditUser = (user) => {
        setEditingUser(user);
        form.setFieldsValue({
            email: user.email,
            is_active: user.is_active,
            role: user.role,
            platform_id: user.platform_id,
        });
        setIsModalVisible(true);
    };
    const handleDeleteUser = async (id) => {
        Modal.confirm({
            title: 'Удалить пользователя?',
            content: 'Вы уверены, что хотите удалить этого пользователя?',
            okText: 'Удалить',
            okType: 'danger',
            cancelText: 'Отмена',
            onOk: async () => {
                try {
                    await remove(`/users/${id}/`);
                    fetchUsers();
                    notification.success({ message: 'Пользователь удалён' });
                }
                catch (err) {
                    notification.error({ message: 'Ошибка удаления пользователя' });
                }
            },
        });
    };
    const handleSaveUser = async (values) => {
        try {
            if (editingUser) {
                await put(`/users/${editingUser.id}/`, values);
                notification.success({ message: 'Пользователь обновлён' });
            }
            else {
                await post('/auth/register', values);
                notification.success({ message: 'Пользователь создан' });
            }
            setIsModalVisible(false);
            fetchUsers();
            setError(null);
        }
        catch (err) {
            notification.error({ message: 'Ошибка сохранения пользователя', description: err.response?.data?.detail || err.message });
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
            render: (is_active) => (_jsx(Tag, { color: is_active ? 'green' : 'red', children: is_active ? 'Да' : 'Нет' })),
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
        },
        {
            title: 'Роль',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (_jsx(Tag, { color: role === 'superadmin' ? 'blue' :
                    'green', children: role === 'superadmin' ? 'Супер-админ' : 'Пользователь' })),
            sorter: (a, b) => a.role.localeCompare(b.role),
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
        },
        {
            title: 'ID платформы',
            dataIndex: 'platform_id',
            key: 'platform_id',
            render: (platform_id) => {
                if (platform_id === null)
                    return 'Глобальный';
                const platform = platforms.find((p) => p.id === platform_id);
                return platform ? platform.name : platform_id;
            },
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_, record) => (_jsxs(Space, { size: "middle", children: [_jsx(Button, { icon: _jsx(EditOutlined, {}), onClick: () => handleEditUser(record), children: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" }), _jsx(Button, { icon: _jsx(DeleteOutlined, {}), danger: true, onClick: () => handleDeleteUser(record.id), children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C" })] })),
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
        },
    ];
    const filteredUsers = users.filter((user) => {
        const matchesEmail = user.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesEmail && matchesRole;
    });
    if (loading) {
        return _jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439..." });
    }
    if (error) {
        return _jsx(Alert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true });
    }
    return (_jsxs(Card, { title: _jsx("h2", { className: "text-xl font-semibold dark:text-gray-100", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F\u043C\u0438" }), style: { margin: '20px' }, className: "dark:bg-gray-800 rounded-lg", bodyStyle: { padding: '16px' }, children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center gap-2 mb-4", children: [_jsx(Input, { placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E email", value: search, onChange: e => setSearch(e.target.value), style: { maxWidth: 250 } }), _jsxs(Select, { value: roleFilter, onChange: v => setRoleFilter(v), style: { width: 150 }, children: [_jsx(Option, { value: "all", children: "\u0412\u0441\u0435 \u0440\u043E\u043B\u0438" }), _jsx(Option, { value: "superadmin", children: "\u0421\u0443\u043F\u0435\u0440-\u0430\u0434\u043C\u0438\u043D" }), _jsx(Option, { value: "user", children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C" })] }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: handleAddUser, style: { marginLeft: 'auto' }, children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F" })] }), error && _jsx(Alert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true, style: { marginBottom: 16 } }), _jsx(Table, { dataSource: filteredUsers, columns: userColumns, rowKey: "id", pagination: { pageSize: 10 }, className: "min-w-full dark:bg-gray-800 rounded-lg", rowClassName: "border-t border-gray-700 hover:bg-gray-700", scroll: { x: true } }), _jsx(Modal, { title: editingUser ? 'Редактировать пользователя' : 'Добавить пользователя', open: isModalVisible, onCancel: () => setIsModalVisible(false), footer: null, children: _jsxs(Form, { form: form, layout: "vertical", onFinish: handleSaveUser, initialValues: { role: 'user', is_active: true }, children: [_jsx(Form.Item, { name: "email", label: "Email", rules: [
                                { required: true, message: 'Пожалуйста, введите email!' },
                                { type: 'email', message: 'Неверный формат Email!' }
                            ], children: _jsx(Input, {}) }), !editingUser && (_jsx(Form.Item, { name: "password", label: "\u041F\u0430\u0440\u043E\u043B\u044C", rules: [{ required: true, message: 'Пожалуйста, введите пароль!' }], children: _jsx(Input.Password, {}) })), editingUser && (_jsx(Form.Item, { name: "password", label: "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C (\u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C \u0434\u043B\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E)", children: _jsx(Input.Password, {}) })), _jsx(Form.Item, { name: "role", label: "\u0420\u043E\u043B\u044C", rules: [{ required: true, message: 'Пожалуйста, выберите роль!' }], children: _jsxs(Select, { children: [_jsx(Option, { value: "user", children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C" }), _jsx(Option, { value: "superadmin", children: "\u0421\u0443\u043F\u0435\u0440-\u0430\u0434\u043C\u0438\u043D" })] }) }), _jsx(Form.Item, { name: "is_active", valuePropName: "checked", children: _jsx(Checkbox, { children: "\u0410\u043A\u0442\u0438\u0432\u0435\u043D" }) }), _jsx(Form.Item, { name: "platform_id", label: "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430", children: _jsx(Select, { allowClear: true, placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443 (\u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C \u0434\u043B\u044F \u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0434\u043E\u0441\u0442\u0443\u043F\u0430)", children: platforms.map((platform) => (_jsx(Option, { value: platform.id, children: platform.name }, platform.id))) }) }), _jsx(Form.Item, { children: _jsx(Button, { type: "primary", htmlType: "submit", children: editingUser ? 'Сохранить изменения' : 'Добавить пользователя' }) })] }) })] }));
};
export default UsersPage;
