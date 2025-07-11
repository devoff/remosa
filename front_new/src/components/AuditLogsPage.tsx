import React, { useEffect, useState } from 'react';
import { Card, Spin, Alert, Table, Tag, Typography, Input, DatePicker, Button, Space, Select } from 'antd';
import { useApi } from '../lib/useApi';
import { User } from '../types';
import { DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../lib/useAuth';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AuditLog {
    id: number;
    user_id: number | null;
    action: string;
    details: string | null;
    ip_address: string | null;
    timestamp: string;
    user?: User;
}

export const AuditLogsPage: React.FC = () => {
    const { get } = useApi();
    const { isSuperAdmin, currentPlatform } = useAuth();
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    
    const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
    const [actionFilter, setActionFilter] = useState<string>('');
    const [dateRange, setDateRange] = useState<[any, any] | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const userData = await get('/users/');
                setUsers(Array.isArray(userData) ? userData : []);
            } catch (err) {
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
                
                const data: AuditLog[] = await get(url);
                const logsWithUsers = data.map(log => ({
                    ...log,
                    user: users.find(u => u.id === log.user_id)
                }));
                
                setAuditLogs(logsWithUsers);
                setError(null);
            } catch (err) {
                console.error('Ошибка при загрузке логов аудита:', err);
                setError('Не удалось загрузить логи аудита.');
            } finally {
                setLoading(false);
            }
        };

        if (users.length > 0) {
            fetchAuditLogs();
        } else if (!loading && users.length === 0) {
             fetchAuditLogs();
        }

    }, [selectedUserId, actionFilter, dateRange, get, users, isSuperAdmin, currentPlatform]);

    const handleExport = () => {
        const headers = ['Время', 'Пользователь', 'Действие', 'Детали', 'IP Адрес'];
        const csvRows = auditLogs.map((log: AuditLog) => [
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
            render: (text: string) => new Date(text).toLocaleString('ru-RU'),
            sorter: (a: AuditLog, b: AuditLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            sortDirections: ['descend' as const, 'ascend' as const],
        },
        {
            title: 'Пользователь',
            dataIndex: 'user_id',
            key: 'user_id',
            render: (_: any, record: AuditLog) => record.user ? record.user.email : 'Система',
        },
        {
            title: 'Действие',
            dataIndex: 'action',
            key: 'action',
            render: (action: string) => {
                let color = 'purple';
                let text = action;
                
                // Специальная обработка SMS действий
                if (action === 'sms_gateway_error') {
                    color = 'red';
                    text = 'SMS Gateway Ошибка';
                } else if (action === 'sms_command_sent') {
                    color = 'green';
                    text = 'SMS Команда Отправлена';
                } else if (action.includes('sms')) {
                    color = 'blue';
                }
                
                return <Tag color={color}>{text}</Tag>;
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

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // loadData() function doesn't exist, removing this call
    };

    if (loading && auditLogs.length === 0) {
        return <Spin tip="Загрузка журнала аудита..." />;
    }

    if (error) {
        return <Alert message="Ошибка" description={error} type="error" showIcon />;
    }

    return (
        <Card 
            title={<h2 className="text-xl font-semibold dark:text-gray-100">Журнал Аудита</h2>} 
            style={{ margin: '20px' }} 
            className="dark:bg-gray-800 rounded-lg" 
        >
            <Space style={{ marginBottom: 16 }}>
                <Select
                    placeholder="Фильтр по пользователю"
                    style={{ width: 200 }}
                    onChange={(value: number) => setSelectedUserId(value)}
                    allowClear
                >
                    {users.map((user: User) => (
                        <Option key={user.id} value={user.id}>{user.email}</Option>
                    ))}
                </Select>
                <Select
                    placeholder="Фильтр по действию"
                    style={{ width: 200 }}
                    onChange={(value: string) => setActionFilter(value)}
                    allowClear
                >
                    <Option value="sms_gateway_error">🔴 SMS Gateway Ошибки</Option>
                    <Option value="sms_command_sent">🟢 SMS Команды Отправлены</Option>
                    <Option value="create_device">Создание устройства</Option>
                    <Option value="update_device">Обновление устройства</Option>
                    <Option value="delete_device">Удаление устройства</Option>
                </Select>
                <RangePicker 
                    showTime 
                    onChange={(dates: any) => setDateRange(dates)}
                />
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                    Экспорт CSV
                </Button>
            </Space>
            <Table 
                dataSource={auditLogs} 
                columns={logColumns} 
                loading={loading} 
                rowKey="id" 
                pagination={{ pageSize: 15 }} 
                className="min-w-full dark:bg-gray-800 rounded-lg" 
            />
        </Card>
    );
}; 