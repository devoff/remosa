import React, { useState, useEffect, useCallback, Key } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Check, ExternalLink, History } from 'lucide-react';
import { format } from 'date-fns';
import { Alert } from '@/types/alert';
import { api } from '@/lib/api';
import { Card, Spin, Alert as AntdAlert, Typography, Table, Tag, Select, Descriptions } from 'antd';
import { config } from '../config/runtime';

const { Title } = Typography;
const { Option } = Select;

console.log('AlertsPage: Компонент загружен');

const AlertItem = ({ alert, onResolve, setParentError }: { alert: Alert; onResolve: () => void; setParentError: (error: string | null) => void; }) => {
  const [expanded, setExpanded] = useState(false);

  const handleResolve = async () => {
    try {
      await api.resolveAlert(Number(alert.id));
      onResolve(); // Обновляем список алертов
      setParentError(null); // Очищаем ошибку
    } catch (error) {
      console.error("Ошибка при разрешении алерта:", error);
      setParentError("Не удалось разрешить алерт.");
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg mb-2 overflow-hidden bg-gray-800">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-750"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-3 ${
            alert.status === 'firing' ? 'bg-red-500' : 'bg-green-500'
          }`} />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium dark:text-gray-100">{alert.title}</h3>
            <p className="text-xs dark:text-gray-300">
              {format(new Date(alert.created_at), 'dd.MM.yyyy HH:mm:ss')} • {alert.data?.summary || 'Нет описания'}
            </p>
          </div>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${
          alert.status === 'firing' ? 'bg-red-900/40 text-red-500' : 'bg-green-900/40 text-green-500'
        }`}>
          {alert.status === 'firing' ? 'Активен' : 'Решен'}
        </div>
      </div>
      
      {expanded && (
        <div className="p-3 border-t border-gray-700 bg-gray-750">
          {alert.description && <p className="text-sm dark:text-gray-300 mb-2">Описание: {alert.description}</p>}
          <div className="mt-2 text-xs dark:text-gray-500">
            <p>ID: {alert.id}</p>
            {alert.player_id && <p>Player ID: {alert.player_id}</p>}
            {alert.resolved_at && (
                <p className="text-xs dark:text-gray-400 mt-1">Разрешено: {format(new Date(alert.resolved_at), 'dd.MM.yyyy HH:mm:ss')}</p>
            )}
          </div>

          {/* Дополнительная информация из поля data */}
          {alert.data && typeof alert.data === 'object' && (
            <div className="mt-3 text-xs dark:text-gray-400">
              <h4 className="font-semibold mb-1">Детали алерта из Grafana:</h4>
              <p>Серьёзность: {alert.data.severity || 'Не указано'}</p>
              <p>Начало: {alert.data.startsAt || 'Не указано'}</p>
              <p>Конец: {alert.data.endsAt || 'Не указано'}</p>
              <p>Плеер: {alert.data.player_name || 'Неизвестный'}</p>
              <p>Платформа: {alert.data.platform || 'Неизвестная'}</p>
              {/* Добавляем остальные поля по необходимости */}
              {Object.entries(alert.data).map(([key, value]) => (
                key !== 'severity' && key !== 'startsAt' && key !== 'endsAt' && key !== 'player_name' && key !== 'platform' && <p key={key}>{key}: {JSON.stringify(value)}</p>
              ))}
            </div>
          )}

          {alert.status === 'firing' && (
            <button
              onClick={handleResolve}
              className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
            >
              Отметить как решенный
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AlertsPage = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts();
      const sortedData = data.sort((a: Alert, b: Alert) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setAlerts(sortedData);
      setError(null);
    } catch (err) {
      setError("Не удалось загрузить алерты.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Фильтрация по статусу
  const filteredAlerts = statusFilter
    ? alerts.filter(a => a.status === statusFilter)
    : alerts;

  // Явная сортировка по времени (от нового к старому)
  const sortedAlerts = [...filteredAlerts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const columns = [
    {
      title: 'Время',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleString(),
      sorter: (a: Alert, b: Alert) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      sortDirections: ['descend' as const, 'ascend' as const],
    },
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Сообщение',
      dataIndex: 'message',
      key: 'message',
      render: (_: any, record: Alert) => record.data?.summary || '-',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Активен', value: 'firing' },
        { text: 'Решен', value: 'resolved' },
      ],
      onFilter: (value: boolean | Key, record: Alert) => record.status === String(value),
      render: (status: string) =>
        status === 'firing' ? (
          <Tag color="red">Активен</Tag>
        ) : (
          <Tag color="green">Решен</Tag>
        ),
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    // ...добавьте другие нужные поля
  ];

  const expandedRowRender = (alert: Alert) => (
    <Descriptions column={1} bordered size="small">
      <Descriptions.Item label="ID">{alert.id}</Descriptions.Item>
      <Descriptions.Item label="Название">{alert.title}</Descriptions.Item>
      <Descriptions.Item label="Сообщение">{alert.data?.summary || '-'}</Descriptions.Item>
      <Descriptions.Item label="Статус">{alert.status === 'firing' ? 'Активен' : 'Решен'}</Descriptions.Item>
      {alert.description && (
        <Descriptions.Item label="Описание">{alert.description}</Descriptions.Item>
      )}
      {alert.player_id && (
        <Descriptions.Item label="Player ID">{alert.player_id}</Descriptions.Item>
      )}
      {alert.resolved_at && (
        <Descriptions.Item label="Разрешено">{new Date(alert.resolved_at).toLocaleString()}</Descriptions.Item>
      )}
      {alert.data && typeof alert.data === 'object' && (
        <Descriptions.Item label="Детали из Grafana">
          <div>
            <div>Серьёзность: {alert.data.severity || 'Не указано'}</div>
            <div>Начало: {alert.data.startsAt || 'Не указано'}</div>
            <div>Конец: {alert.data.endsAt || 'Не указано'}</div>
            <div>Плеер: {alert.data.player_name || 'Неизвестный'}</div>
            <div>Платформа: {alert.data.platform || 'Неизвестная'}</div>
            {Object.entries(alert.data).map(([key, value]) => (
              key !== 'severity' && key !== 'startsAt' && key !== 'endsAt' && key !== 'player_name' && key !== 'platform' && (
                <div key={key}>{key}: {JSON.stringify(value)}</div>
              )
            ))}
          </div>
        </Descriptions.Item>
      )}
    </Descriptions>
  );

  return (
    <Card
      title={<h2 className="text-xl font-semibold dark:text-gray-100">Журнал Алертов</h2>}
      className="dark:bg-gray-800 rounded-lg"
      style={{ margin: '20px' }}
    >
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="Фильтр по статусу"
          style={{ width: 200 }}
          allowClear
          onChange={value => setStatusFilter(value)}
        >
          <Option value="firing">Активен</Option>
          <Option value="resolved">Решен</Option>
        </Select>
      </div>
      {loading ? (
        <Spin tip="Загрузка журнала алертов..." />
      ) : error ? (
        <AntdAlert message="Ошибка" description={error} type="error" showIcon />
      ) : (
        <Table
          dataSource={sortedAlerts}
          columns={columns}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: pageSize,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            pageSizeOptions: ['10', '15', '30', '50'],
          }}
          expandable={{
            expandedRowRender,
            rowExpandable: () => true,
          }}
        />
      )}
    </Card>
  );
};

export default AlertsPage; 