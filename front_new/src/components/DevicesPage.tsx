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
  Typography,
  Select
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
    const [editDevice, setEditDevice] = useState<Device | null>(null);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [modelFilter, setModelFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<DeviceStatus | null>(null);
    const [platformFilter, setPlatformFilter] = useState<number | null>(null);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    const fetchDevices = useCallback(async () => {
        // Если пользователь еще не загружен, не делаем запрос
        if (!user) {
            return;
        }
        
        setLoading(true);
        try {
            let url = '';
            console.log('DevicesPage fetchDevices:', {
                isSuperAdmin,
                currentPlatform: currentPlatform?.id,
                user: user?.role
            });
            
            if (isSuperAdmin) {
                url = '/devices/';
                console.log('Using superadmin endpoint:', url);
            } else if (currentPlatform?.id) {
                url = `/platforms/${currentPlatform.id}/devices`;
                console.log('Using platform endpoint:', url);
            } else {
                console.log('No platform access, waiting for platform to load...');
                setLoading(false);
                return;
            }
            const data = await get(url);
            setDevices(data);
            setError(null);
        } catch (e: any) {
            console.log('Fetch devices error:', e);
            setDevices([]);
            if (e.response?.status === 403) {
                setError('Недостаточно прав для просмотра устройств');
            } else {
                setError('Ошибка загрузки устройств');
            }
        } finally {
            setLoading(false);
        }
    }, [isSuperAdmin, currentPlatform, get, user]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    useEffect(() => {
        if (isSuperAdmin) {
            get('/platforms/').then(setPlatforms).catch(() => setPlatforms([]));
        }
    }, [isSuperAdmin, get]);

    useEffect(() => {
        get('/command_templates/').then(res => {
            const models = Array.from(new Set(res.map((t: any) => String(t.model)).filter(Boolean))) as string[];
            setAvailableModels(models);
        }).catch(() => setAvailableModels([]));
    }, [get]);

    const handleAdd = () => {
        setIsAddDialogOpen(true);
    };

    const handleEditDevice = (device: Device) => {
        setEditDevice(device);
        setIsAddDialogOpen(true);
    };

    const handleAddDevice = async (deviceData: any) => {
        try {
            let url = '';
            if (isSuperAdmin) {
                if (editDevice) {
                    url = `/devices/${editDevice.id}`;
                    await put(url, deviceData);
                    message.success('Устройство успешно обновлено');
                } else {
                    url = '/devices/';
                    await post(url, deviceData);
                    message.success('Устройство успешно добавлено');
                }
            } else if (currentPlatform?.id) {
                if (editDevice) {
                    url = `/platforms/${currentPlatform.id}/devices/${editDevice.id}`;
                    await put(url, deviceData);
                    message.success('Устройство успешно обновлено');
                } else {
                    url = `/platforms/${currentPlatform.id}/devices/`;
                    await post(url, deviceData);
                    message.success('Устройство успешно добавлено');
                }
            } else {
                message.error('Платформа не определена');
                return;
            }
            setEditDevice(null);
            fetchDevices();
        } catch (e) {
            message.error('Ошибка при сохранении устройства');
            console.error(e);
        }
    };

    const handleDelete = async (deviceId: string) => {
        try {
            let url = '';
            if (isSuperAdmin) {
                url = `/devices/${deviceId}`;
            } else if (currentPlatform?.id) {
                url = `/platforms/${currentPlatform.id}/devices/${deviceId}`;
            } else {
                message.error('Платформа не определена');
                return;
            }
            await remove(url);
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

    const filteredDevices = devices.filter(device => {
        if (modelFilter && device.model !== modelFilter) return false;
        if (statusFilter && device.status !== statusFilter) return false;
        if (isSuperAdmin && platformFilter && device.platform_id !== platformFilter) return false;
        return true;
    });

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a: Device, b: Device) => Number(a.id) - Number(b.id) },
        { title: 'Имя', dataIndex: 'name', key: 'name', sorter: (a: Device, b: Device) => a.name.localeCompare(b.name) },
        { title: 'Модель', dataIndex: 'model', key: 'model' },
        { title: 'Телефон', dataIndex: 'phone', key: 'phone' },
        ...(
          isSuperAdmin
            ? [{
                title: 'Платформа',
                dataIndex: 'platform_id',
                key: 'platform_id',
                render: (platform_id: number) => platforms.find(p => p.id === platform_id)?.name || platform_id,
            }]
            : []
        ),
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
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => handleEditDevice(record)}
                        title="Редактировать"
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

                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <Select
                        allowClear
                        placeholder="Фильтр по модели"
                        style={{ minWidth: 160 }}
                        value={modelFilter}
                        onChange={setModelFilter}
                        options={availableModels.map(m => ({ value: m, label: m }))}
                    />
                    <Select
                        allowClear
                        placeholder="Фильтр по статусу"
                        style={{ minWidth: 160 }}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[{ value: 'ONLINE', label: 'ONLINE' }, { value: 'WARNING', label: 'WARNING' }, { value: 'OFFLINE', label: 'OFFLINE' }]}
                    />
                    {isSuperAdmin && (
                        <Select
                            allowClear
                            placeholder="Фильтр по платформе"
                            style={{ minWidth: 180 }}
                            value={platformFilter}
                            onChange={setPlatformFilter}
                            options={platforms.map(p => ({ value: p.id, label: p.name }))}
                        />
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
                    dataSource={filteredDevices}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                />
            </Card>

            <AddDeviceDialog
                open={isAddDialogOpen}
                onClose={() => { setIsAddDialogOpen(false); setEditDevice(null); }}
                onAdd={handleAddDevice}
                device={editDevice}
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