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
        const sortedData = data.sort((a: CommandLog, b: CommandLog) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
      defaultSortOrder: 'descend' as 'descend',
    },
    {
      title: 'Устройство',
      dataIndex: 'device_id',
      key: 'device_id',
    },
    {
      title: 'Команда',
      dataIndex: 'command',
      key: 'command',
    },
    {
      title: 'Сообщение',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Ответ',
      dataIndex: 'response',
      key: 'response',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => <Tag color={text === 'sent' ? 'blue' : 'red'}>{text ? text.toUpperCase() : ''}</Tag>,
    },
    {
      title: 'Уровень',
      dataIndex: 'level',
      key: 'level',
      render: (text: string) => <Tag color={text === 'info' ? 'green' : 'red'}>{text ? text.toUpperCase() : ''}</Tag>,
    },
  ];

  if (loading) {
    return <Spin tip="Загрузка журнала..." />;
  }

  if (error) {
    return <Alert message="Ошибка" description={error} type="error" showIcon />;
  }

  return (
    <Card title="Журнал команд" style={{ margin: '20px' }}>
      <Table 
        dataSource={commandLogs} 
        columns={logColumns} 
        loading={loading} 
        rowKey="id" 
        pagination={{ pageSize: 10 }} 
      />
    </Card>
  );
}; 