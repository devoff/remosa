import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, Spin, Alert, Table, Tag, Typography } from 'antd';
import { useApi } from '../lib/useApi';
const { Title } = Typography;
export const CommandLogsPage = () => {
    const { get } = useApi();
    const [commandLogs, setCommandLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchCommandLogs = async () => {
            try {
                setLoading(true);
                const data = await get(`/api/v1/commands/logs`);
                const sortedData = data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                setCommandLogs(sortedData);
                console.log('Логи команд успешно загружены:', data);
            }
            catch (err) {
                console.error('Ошибка при загрузке логов команд:', err);
                setError('Не удалось загрузить логи команд.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchCommandLogs();
    }, [get]);
    const logColumns = [
        {
            title: 'Время',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => new Date(text).toLocaleString(),
            sorter: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            defaultSortOrder: 'ascend',
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
        },
        {
            title: 'Устройство',
            dataIndex: 'device_id',
            key: 'device_id',
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
        },
        {
            title: 'Команда',
            dataIndex: 'command',
            key: 'command',
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
        },
        {
            title: 'Сообщение',
            dataIndex: 'message',
            key: 'message',
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-300' }),
        },
        {
            title: 'Ответ',
            dataIndex: 'response',
            key: 'response',
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-300' }),
        },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (text) => _jsx(Tag, { color: text === 'sent' ? 'blue' : 'red', children: text ? text.toUpperCase() : '' }),
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
        },
        {
            title: 'Уровень',
            dataIndex: 'level',
            key: 'level',
            render: (text) => _jsx(Tag, { color: text === 'info' ? 'green' : 'red', children: text ? text.toUpperCase() : '' }),
            onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
            onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
        },
    ];
    if (loading) {
        return _jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0436\u0443\u0440\u043D\u0430\u043B\u0430..." });
    }
    if (error) {
        return _jsx(Alert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true });
    }
    return (_jsx(Card, { title: _jsx("h2", { className: "text-xl font-semibold dark:text-gray-100", children: "\u0416\u0443\u0440\u043D\u0430\u043B \u043A\u043E\u043C\u0430\u043D\u0434" }), style: { margin: '20px' }, className: "dark:bg-gray-800 rounded-lg", bodyStyle: { padding: '16px' }, children: _jsx(Table, { dataSource: commandLogs, columns: logColumns, loading: loading, rowKey: "id", pagination: { pageSize: 10 }, className: "min-w-full dark:bg-gray-800 rounded-lg", rowClassName: "border-t border-gray-700 hover:bg-gray-700" }) }));
};
