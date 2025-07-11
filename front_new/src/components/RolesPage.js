import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../lib/useApi';
import { Table, Select, Spin, Alert, message, Typography, Tag } from 'antd';
const { Option } = Select;
const { Text } = Typography;
const RolesPage = () => {
    const { get, put } = useApi();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingUsers, setUpdatingUsers] = useState(new Set());
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await get('/users/');
            setUsers(Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : []);
            setError(null);
        }
        catch (e) {
            console.error(e);
            setError('Ошибка загрузки пользователей');
        }
        finally {
            setLoading(false);
        }
    }, [get]);
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    const handleRoleChange = async (userId, newRole) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate)
            return;
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
            setUsers(prevUsers => prevUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
        }
        catch (err) {
            console.error(err);
            message.error('Ошибка при изменении роли.');
        }
        finally {
            setUpdatingUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };
    const columns = [
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email) => _jsx(Text, { copyable: true, children: email }),
        },
        {
            title: 'Роль',
            dataIndex: 'role',
            key: 'role',
            width: 200,
            render: (role, record) => (_jsxs(Select, { value: role, onChange: (newRole) => handleRoleChange(record.id, newRole), style: { width: 150 }, loading: updatingUsers.has(record.id), disabled: updatingUsers.has(record.id), children: [_jsx(Option, { value: "superadmin", children: _jsx(Tag, { color: "blue", children: "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440" }) }), _jsx(Option, { value: "user", children: _jsx(Tag, { color: "green", children: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C" }) })] })),
        },
        {
            title: 'Статус',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (isActive) => (_jsx(Tag, { color: isActive ? 'success' : 'default', children: isActive ? 'Активен' : 'Неактивен' })),
        },
        {
            title: 'Дата регистрации',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('ru-RU'),
        },
    ];
    if (loading) {
        return (_jsx("div", { className: "p-6 text-center", children: _jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439...", size: "large" }) }));
    }
    return (_jsxs("div", { className: "p-6", children: [_jsx(Typography.Title, { level: 2, className: "mb-6", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0440\u043E\u043B\u044F\u043C\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439" }), error && _jsx(Alert, { message: error, type: "error", showIcon: true, className: "mb-4" }), _jsx(Table, { columns: columns, dataSource: users, rowKey: "id", pagination: { pageSize: 10 }, className: "dark:bg-gray-800", bordered: true })] }));
};
export default RolesPage;
