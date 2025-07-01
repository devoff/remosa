import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Spin, Alert, message, Tag, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useApi } from '../lib/useApi';
import { Device, DeviceStatus, CommandTemplate } from '../types';
import { DeviceFormModal } from '../components/Monitoring/DeviceFormModal';
import ExecuteCommandModal from './ExecuteCommandModal';

const { Option } = Select;

const DevicesPage: React.FC = () => {
    const { get, post, put, remove } = useApi();
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [form] = Form.useForm();
    const [isCommandModalVisible, setIsCommandModalVisible] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    const fetchDevices = useCallback(async () => {
        setLoading(true);
        try {
            const data = await get('/devices/');
            setDevices(Array.isArray(data) ? data : []);
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
        setEditingDevice(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (device: Device) => {
        setEditingDevice(device);
        form.setFieldsValue(device);
        setIsModalVisible(true);
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

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingDevice) {
                await put(`/devices/${editingDevice.id}`, values);
                message.success('Устройство успешно обновлено');
            } else {
                await post('/devices/', values);
                message.success('Устройство успешно добавлено');
            }
            setIsModalVisible(false);
            fetchDevices();
        } catch (e) {
            message.error('Ошибка при сохранении устройства');
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
                if (status === 'online') color = 'green';
                if (status === 'offline') color = 'volcano';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
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
                        onClick={() => handleEdit(record)}
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
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                style={{ marginBottom: 16 }}
            >
                Добавить устройство
            </Button>
            <Table
                dataSource={devices}
                columns={columns}
                rowKey="id"
                loading={loading}
            />
            <Modal
                title={editingDevice ? 'Редактировать устройство' : 'Добавить устройство'}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                okText="Сохранить"
                cancelText="Отмена"
            >
                <Form form={form} layout="vertical" name="device_form">
                    <Form.Item name="name" label="Имя устройства" rules={[{ required: true, message: 'Пожалуйста, введите имя устройства' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="model" label="Модель" rules={[{ required: true, message: 'Пожалуйста, введите модель устройства' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Номер телефона">
                        <Input placeholder="+79991234567" />
                    </Form.Item>
                    <Form.Item name="description" label="Описание">
                        <Input.TextArea />
                    </Form.Item>
                </Form>
            </Modal>
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