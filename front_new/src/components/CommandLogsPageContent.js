import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Spin, Alert, Table, Tag, Typography, Select, DatePicker, Button, Space } from 'antd';
import { useApi } from '../lib/useApi';
import { DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../lib/useAuth';
const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
// Переименовано в CommandLogsPageContent
export const CommandLogsPageContent = () => {
    const { get } = useApi();
    const { isSuperAdmin, currentPlatform } = useAuth();
    const [commandLogs, setCommandLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState(undefined);
    const [selectedLevel, setSelectedLevel] = useState(undefined);
    const [dateRange, setDateRange] = useState(null);
    useEffect(() => {
        const fetchDevicesList = async () => {
            try {
                let url = '';
                if (isSuperAdmin) {
                    url = '/devices/';
                }
                else if (currentPlatform?.id) {
                    url = `/platforms/${currentPlatform.id}/devices`;
                }
                else {
                    if (import.meta.env.VITE_DEBUG_LOGGING === 'true') {
                        console.log('No platform access for device list');
                    }
                    return;
                }
                const deviceData = await get(url);
                setDevices(deviceData);
            }
            catch (err) {
                console.error('Ошибка при загрузке списка устройств:', err);
            }
        };
        if (isSuperAdmin !== undefined && (isSuperAdmin || currentPlatform)) {
            fetchDevicesList();
        }
    }, [isSuperAdmin, currentPlatform, get]);
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
    }, [selectedDeviceId, selectedLevel, dateRange, get, isSuperAdmin, currentPlatform]);
    const handleExport = () => {
        const headers = ['Время', 'Устройство', 'Команда', 'Сообщение', 'Ответ', 'Статус', 'Уровень'];
        const csvRows = commandLogs.map((log) => [
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
            render: (text) => new Date(text).toLocaleString(),
            sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            sortDirections: ['descend', 'ascend'],
        },
        {
            title: 'Устройство',
            dataIndex: 'device_id',
            key: 'device_id',
            render: (deviceId) => {
                const device = devices.find((d) => Number(d.id) === deviceId);
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
            render: (text) => _jsx(Tag, { color: text === 'sent' ? 'blue' : 'red', children: text ? text.toUpperCase() : '' }),
        },
        {
            title: 'Уровень',
            dataIndex: 'level',
            key: 'level',
            render: (text) => _jsx(Tag, { color: text === 'info' ? 'green' : 'red', children: text ? text.toUpperCase() : '' }),
        },
    ];
    if (loading) {
        return _jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0436\u0443\u0440\u043D\u0430\u043B\u0430..." });
    }
    if (error) {
        return _jsx(Alert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true });
    }
    return (_jsxs(_Fragment, { children: [_jsxs(Space, { style: { marginBottom: 16 }, children: [_jsx(Select, { placeholder: "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0443", style: { width: 200 }, onChange: (value) => setSelectedDeviceId(value), allowClear: true, children: devices.map((device) => (_jsx(Option, { value: device.id, children: device.name }, device.id))) }), _jsxs(Select, { placeholder: "\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0443\u0440\u043E\u0432\u043D\u044E", style: { width: 150 }, onChange: (value) => setSelectedLevel(value), allowClear: true, children: [_jsx(Option, { value: "info", children: "INFO" }), _jsx(Option, { value: "warning", children: "WARNING" }), _jsx(Option, { value: "error", children: "ERROR" })] }), _jsx(RangePicker, { showTime: true, onChange: (dates) => setDateRange(dates) }), _jsx(Button, { type: "primary", icon: _jsx(DownloadOutlined, {}), onClick: handleExport, children: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 CSV" })] }), _jsx(Table, { dataSource: commandLogs, columns: logColumns, loading: loading, rowKey: "id", pagination: { pageSize: 10 }, className: "min-w-full dark:bg-gray-800 rounded-lg" })] }));
};
