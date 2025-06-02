import React, { useEffect, useState } from 'react';
import { Card, Spin, Alert, Table, Tag, Typography } from 'antd';
import { useApi } from '../lib/useApi';
import { CommandLog } from '../types';

const { Title } = Typography;

export const CommandLogsPage: React.FC = () => {
  const { get } = useApi();
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommandLogs = async () => {
      try {
        setLoading(true);
        const data = await get(`/api/v1/commands/logs`);
        const sortedData = data.sort((a: CommandLog, b: CommandLog) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setCommandLogs(sortedData);
        console.log('Логи команд успешно загружены:', data);
      } catch (err) {
        console.error('Ошибка при загрузке логов команд:', err);
        setError('Не удалось загрузить логи команд.');
      } finally {
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
      render: (text: string) => new Date(text).toLocaleString(),
      sorter: (a: CommandLog, b: CommandLog) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      defaultSortOrder: 'ascend' as 'ascend',
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
      render: (text: string) => <Tag color={text === 'sent' ? 'blue' : 'red'}>{text ? text.toUpperCase() : ''}</Tag>,
      onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
      onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
    },
    {
      title: 'Уровень',
      dataIndex: 'level',
      key: 'level',
      render: (text: string) => <Tag color={text === 'info' ? 'green' : 'red'}>{text ? text.toUpperCase() : ''}</Tag>,
      onHeaderCell: () => ({ className: 'px-4 py-2 text-left dark:text-gray-100 bg-gray-700' }),
      onCell: () => ({ className: 'px-4 py-3 dark:text-gray-100' }),
    },
  ];

  if (loading) {
    return <Spin tip="Загрузка журнала..." />;
  }

  if (error) {
    return <Alert message="Ошибка" description={error} type="error" showIcon />;
  }

  return (
    <Card 
      title={<h2 className="text-xl font-semibold dark:text-gray-100">Журнал команд</h2>} 
      style={{ margin: '20px' }} 
      className="dark:bg-gray-800 rounded-lg" 
      bodyStyle={{ padding: '16px' }} 
    >
      <Table 
        dataSource={commandLogs} 
        columns={logColumns} 
        loading={loading} 
        rowKey="id" 
        pagination={{ pageSize: 10 }} 
        className="min-w-full dark:bg-gray-800 rounded-lg" 
        rowClassName="border-t border-gray-700 hover:bg-gray-700" 
      />
    </Card>
  );
}; 