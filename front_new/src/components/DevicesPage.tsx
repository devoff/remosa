import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Button, 
  Spin, 
  Alert, 
  message, 
  Tag, 
  Popconfirm, 
  Space,
  Card,
  Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useApi } from '../lib/useApi';
import { Device, DeviceStatus, Platform } from '../types';
import ExecuteCommandModal from './ExecuteCommandModal';
import AddDeviceDialog from './AddDeviceDialog';
import { useAuth } from '../lib/useAuth';
import { canAddDevice } from '../utils/roleUtils';

const { Title } = Typography;

const DevicesPage: React.FC = () => {
    const { get, post, put, remove } = useApi();
    const { user, currentPlatform, isSuperAdmin } = useAuth();
    console.log('user:', user);
    console.log('currentPlatform:', currentPlatform);
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isCommandModalVisible, setIsCommandModalVisible] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [platformLimits, setPlatformLimits] = useState<any>(null);

    const fetchDevices = useCallback(async () => {
        setLoading(true);
        try {
            // Загружаем все устройства (для упрощения)
            const data = await get('/devices/');
            const allDevices = Array.isArray(data) ? data : [];
            setDevices(allDevices);
        } catch (e) {
            setError('Не удалось загрузить список устройств.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [get]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    const handleAdd = () => {
        setIsAddDialogOpen(true);
    };

    const handleAddDevice = async (deviceData: any) => {
        try {
            // Добавляем устройство (для упрощения)
            const newDevice = await post('/devices/', deviceData);
            message.success('Устройство успешно добавлено');
            fetchDevices();
        } catch (e) {
            message.error('Ошибка при добавлении устройства');
            console.error(e);
        }
    };

    const handleDelete = async (deviceId: string) => {
        try {
            await remove(`/devices/${deviceId}`);
            message.success('Устройство успешно удалено');
            fetchDevices();
        } catch (e) {
            message.error('Не удалось удалить устройство');
        }
    };

    const handleOpenCommandModal = (device: Device) => {
        setSelectedDevice(device);
        setIsCommandModalVisible(true);
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a: Device, b: Device) => Number(a.id) - Number(b.id) },
        { title: 'Имя', dataIndex: 'name', key: 'name', sorter: (a: Device, b: Device) => a.name.localeCompare(b.name) },
        { title: 'Модель', dataIndex: 'model', key: 'model' },
        { title: 'Телефон', dataIndex: 'phone', key: 'phone' },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status: DeviceStatus) => {
                let color = 'geekblue';
                if (status === 'ONLINE') color = 'green';
                if (status === 'OFFLINE') color = 'volcano';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Действия',
            key: 'action',
            render: (_: any, record: Device) => (
                <Space size="middle">
                    <Button 
                        icon={<PlayCircleOutlined />} 
                        onClick={() => handleOpenCommandModal(record)}
                        title="Выполнить команду"
                    />
                    <Popconfirm
                        title="Вы уверены, что хотите удалить это устройство?"
                        onConfirm={() => handleDelete(record.id.toString())}
                        okText="Да"
                        cancelText="Нет"
                    >
                        <Button 
                            icon={<DeleteOutlined />} 
                            danger
                            title="Удалить"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (loading) return <Spin tip="Загрузка устройств..." />;
    if (error) return <Alert message="Ошибка" description={error} type="error" />;

    return (
        <div className="p-4">
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Title level={3}>
                        Устройства
                    </Title>
                    
                    {platformLimits && (
                        <div style={{ textAlign: 'right' }}>
                            <Typography.Text type="secondary">
                                Устройства: {platformLimits.devices.current} / {platformLimits.devices.limit || '∞'}
                                {platformLimits.devices.limit && (
                                    <span style={{ 
                                        color: platformLimits.devices.available <= 0 ? '#ff4d4f' : 
                                               platformLimits.devices.available <= 2 ? '#faad14' : '#52c41a'
                                    }}>
                                        {' '}(доступно: {platformLimits.devices.available})
                                    </span>
                                )}
                            </Typography.Text>
                        </div>
                    )}
                </div>

                {canAddDevice(user, currentPlatform) && (
                  <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAdd}
                      disabled={platformLimits && platformLimits.devices.limit && platformLimits.devices.available <= 0}
                      style={{ marginBottom: 16 }}
                  >
                      Добавить устройство
                  </Button>
                )}

                <Table
                    dataSource={devices}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

                            <AddDeviceDialog
                    open={isAddDialogOpen}
                    onClose={() => setIsAddDialogOpen(false)}
                    onAdd={handleAddDevice}
                />

            {selectedDevice && (
                <ExecuteCommandModal
                    visible={isCommandModalVisible}
                    onClose={() => setIsCommandModalVisible(false)}
                    device={selectedDevice}
                />
            )}
        </div>
    );
};

export default DevicesPage; 