import React, { useEffect, useState } from 'react';
import { Card, Spin, Alert, Table, Tag, Typography, Select, DatePicker, Button, Space } from 'antd';
import { useApi } from '../lib/useApi';
import { CommandLog, Device } from '../types';
import { api, fetchDevices as fetchDevicesApi } from '../lib/api';
import { DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../lib/useAuth';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Переименовано в CommandLogsPageContent
export const CommandLogsPageContent: React.FC = () => {
  const { get } = useApi();
  const { isSuperAdmin, currentPlatform } = useAuth();
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  useEffect(() => {
    const fetchDevicesList = async () => {
      try {
        const deviceData = await fetchDevicesApi();
        setDevices(deviceData);
      } catch (err) {
        console.error('Ошибка при загрузке списка устройств:', err);
      }
    };

    fetchDevicesList();
  }, []);

  useEffect(() => {
    const fetchCommandLogs = async () => {
        setLoading(true);
        try {
            let url = `/logs/`;
            const params = new URLSearchParams();
            if (selectedDeviceId) {
                params.append('device_id', selectedDeviceId);
            }
            if (selectedLevel) {
                params.append('level', selectedLevel);
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
            setCommandLogs(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Ошибка при загрузке логов команд:', err);
            setError('Не удалось загрузить логи команд.');
        } finally {
            setLoading(false);
        }
    };
    
    fetchCommandLogs();
  }, [selectedDeviceId, selectedLevel, dateRange, get, isSuperAdmin, currentPlatform]);

  const handleExport = () => {
    const headers = ['Время', 'Устройство', 'Команда', 'Сообщение', 'Ответ', 'Статус', 'Уровень'];
    const csvRows = commandLogs.map((log: CommandLog) => [
      `"${new Date(log.created_at).toLocaleString()}"`,
      `"${log.device_id}"`,
      `"${log.command || '-'}"`,
      `"${log.message}"`,
      `"${log.response || '-'}"`,
      `"${log.status || '-'}"`,
      `"${log.level}"`,
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'command_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const logColumns = [
    {
      title: 'Время',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString(),
      sorter: (a: CommandLog, b: CommandLog) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      sortDirections: ['descend' as const, 'ascend' as const],
    },
    {
      title: 'Устройство',
      dataIndex: 'device_id',
      key: 'device_id',
      render: (deviceId: number) => {
        const device = devices.find((d: Device) => Number(d.id) === deviceId);
        return device ? device.name : deviceId;
      },
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
    <>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Фильтр по устройству"
          style={{ width: 200 }}
          onChange={(value: string) => setSelectedDeviceId(value)}
          allowClear
        >
          {devices.map((device: Device) => (
            <Option key={device.id} value={device.id}>{device.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="Фильтр по уровню"
          style={{ width: 150 }}
          onChange={(value: string) => setSelectedLevel(value)}
          allowClear
        >
          <Option value="info">INFO</Option>
          <Option value="warning">WARNING</Option>
          <Option value="error">ERROR</Option>
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
        dataSource={commandLogs} 
        columns={logColumns} 
        loading={loading} 
        rowKey="id" 
        pagination={{ pageSize: 10 }} 
        className="min-w-full dark:bg-gray-800 rounded-lg" 
      />
    </>
  );
}; 