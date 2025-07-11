import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, Spin, Alert, Table, Tag, Typography, DatePicker, Button, Space, Select } from 'antd';
import { useApi } from '../lib/useApi';
import { DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../lib/useAuth';
const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
export const AuditLogsPage = () => {
    const { get } = useApi();
    const { isSuperAdmin, currentPlatform } = useAuth();
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(undefined);
    const [actionFilter, setActionFilter] = useState('');
    const [dateRange, setDateRange] = useState(null);
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const userData = await get('/users/');
                setUsers(Array.isArray(userData) ? userData : []);
            }
            catch (err) {
                console.error('Ошибка при загрузке пользователей для фильтра:', err);
            }
        };
        fetchUsers();
    }, [get]);
    useEffect(() => {
        const fetchAuditLogs = async () => {
            setLoading(true);
            try {
                let url = `/audit-logs/`;
                const params = new URLSearchParams();
                if (selectedUserId) {
                    params.append('user_id', selectedUserId.toString());
                }
                if (actionFilter) {
                    params.append('action', actionFilter);
                }
                if (dateRange && dateRange[0] && dateRange[1]) {
                    params.append('start_date', dateRange[0].toISOString());
                    params.append('end_date', dateRange[1].toISOString());
                }
                if (!isSuperAdmin && currentPlatform?.id) {
                    params.append('platform_id', String(currentPlatform.id));
                }
                if (params.toString()) {
                    url = `${url}?${params.toString()}`;
                }
                const data = await get(url);
                const logsWithUsers = data.map(log => ({
                    ...log,
                    user: users.find(u => u.id === log.user_id)
                }));
                setAuditLogs(logsWithUsers);
                setError(null);
            }
            catch (err) {
                console.error('Ошибка при загрузке логов аудита:', err);
                setError('Не удалось загрузить логи аудита.');
            }
            finally {
                setLoading(false);
            }
        };
        if (users.length > 0) {
            fetchAuditLogs();
        }
        else if (!loading && users.length === 0) {
            fetchAuditLogs();
        }
    }, [selectedUserId, actionFilter, dateRange, get, users, isSuperAdmin, currentPlatform]);
    const handleExport = () => {
        const headers = ['Время', 'Пользователь', 'Действие', 'Детали', 'IP Адрес'];
        const csvRows = auditLogs.map((log) => [
            `"${new Date(log.timestamp).toLocaleString('ru-RU')}"`,
            `"${log.user ? log.user.email : 'Система'}"`,
            `"${log.action}"`,
            `"${log.details || '-'}"`,
            `"${log.ip_address || '-'}"`,
        ].join(','));
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'audit_logs.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const logColumns = [
        {
            title: 'Время',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (text) => new Date(text).toLocaleString('ru-RU'),
            sorter: (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            sortDirections: ['descend', 'ascend'],
        },
        {
            title: 'Пользователь',
            dataIndex: 'user_id',
            key: 'user_id',
            render: (_, record) => record.user ? record.user.email : 'Система',
        },
        {
            title: 'Действие',
            dataIndex: 'action',
            key: 'action',
            render: (action) => {
                let color = 'purple';
                let text = action;
                // Специальная обработка SMS действий
                if (action === 'sms_gateway_error') {
                    color = 'red';
                    text = 'SMS Gateway Ошибка';
                }
                else if (action === 'sms_command_sent') {
                    color = 'green';
                    text = 'SMS Команда Отправлена';
                }
                else if (action.includes('sms')) {
                    color = 'blue';
                }
                return _jsx(Tag, { color: color, children: text });
            },
        },
        {
            title: 'Детали',
            dataIndex: 'details',
            key: 'details',
        },
        {
            title: 'IP Адрес',
            dataIndex: 'ip_address',
            key: 'ip_address',
        },
    ];
    const handleSearch = (e) => {
        e.preventDefault();
        // loadData() function doesn't exist, removing this call
    };
    if (loading && auditLogs.length === 0) {
        return _jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0436\u0443\u0440\u043D\u0430\u043B\u0430 \u0430\u0443\u0434\u0438\u0442\u0430..." });
    }
    if (error) {
        return _jsx(Alert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true });
    }
    return (_jsxs(Card, { title: _jsx("h2", { className: "text-xl font-semibold dark:text-gray-100", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u0410\u0443\u0434\u0438\u0442\u0430" }), style: { margin: '20px' }, className: "dark:bg-gray-800 rounded-lg", children: [_jsxs(Space, { style: { marginBottom: 16 }, children: [_jsx(Select, { placeholder: "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E", style: { width: 200 }, onChange: (value) => setSelectedUserId(value), allowClear: true, children: users.map((user) => (_jsx(Option, { value: user.id, children: user.email }, user.id))) }), _jsxs(Select, { placeholder: "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044E", style: { width: 200 }, onChange: (value) => setActionFilter(value), allowClear: true, children: [_jsx(Option, { value: "sms_gateway_error", children: "\uD83D\uDD34 SMS Gateway \u041E\u0448\u0438\u0431\u043A\u0438" }), _jsx(Option, { value: "sms_command_sent", children: "\uD83D\uDFE2 SMS \u041A\u043E\u043C\u0430\u043D\u0434\u044B \u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u044B" }), _jsx(Option, { value: "create_device", children: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430" }), _jsx(Option, { value: "update_device", children: "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430" }), _jsx(Option, { value: "delete_device", children: "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430" })] }), _jsx(RangePicker, { showTime: true, onChange: (dates) => setDateRange(dates) }), _jsx(Button, { type: "primary", icon: _jsx(DownloadOutlined, {}), onClick: handleExport, children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 CSV" })] }), _jsx(Table, { dataSource: auditLogs, columns: logColumns, loading: loading, rowKey: "id", pagination: { pageSize: 15 }, className: "min-w-full dark:bg-gray-800 rounded-lg" })] }));
};
