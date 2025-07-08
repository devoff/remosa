import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../lib/useApi';
import { Row, Col, Card, Statistic, Spin, Alert, Tag, Button } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined, DatabaseOutlined, ApiOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
    uptime: string;
    totalDevices: number;
    activeAlerts: number;
    resolvedAlerts: number;
    latestAlert: string;
    dbConnections: number;
}

interface HealthStatus {
    status: string;
    database: string;
    jwt_key_loaded: boolean;
    debug_mode: boolean;
}

const SystemStatusPanel: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { get } = useApi();
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, healthData] = await Promise.all([
                get('/stats/dashboard'),
                get('/health/')
            ]);
            setStats(statsData);
            setHealth(healthData);
            setError(null);
        } catch (err) {
            console.error('Ошибка при получении статуса системы:', err);
            setError('Не удалось загрузить данные о состоянии системы.');
        } finally {
            setLoading(false);
        }
    }, [get]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Обновляем каждые 30 секунд
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading && (!stats || !health)) {
        return <Spin tip="Загрузка состояния системы..." size="large" />;
    }

    if (error) {
        return <Alert message="Ошибка" description={error} type="error" showIcon />;
    }

    const dbHealthy = health?.database === 'healthy';
    const apiHealthy = health?.status === 'ok';

    return (
        <div className="space-y-6">
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Статус API"
                            value={apiHealthy ? 'Онлайн' : 'Оффлайн'}
                            valueStyle={{ color: apiHealthy ? '#3f8600' : '#cf1322' }}
                            prefix={apiHealthy ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Статус БД"
                            value={dbHealthy ? 'Онлайн' : 'Ошибка'}
                            valueStyle={{ color: dbHealthy ? '#3f8600' : '#cf1322' }}
                            prefix={<DatabaseOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic title="Uptime" value={stats?.uptime || 'N/A'} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card hoverable onClick={() => navigate('/admin/devices')}>
                        <Statistic title="Всего устройств" value={stats?.totalDevices} />
                    </Card>
                </Col>
                 <Col xs={24} sm={12} md={8} lg={6}>
                    <Card hoverable onClick={() => navigate('/admin/alerts')}>
                        <Statistic 
                            title="Активные алерты" 
                            value={stats?.activeAlerts}
                            valueStyle={{ color: (stats?.activeAlerts || 0) > 0 ? '#cf1322' : '#3f8600' }}
                        />
                    </Card>
                </Col>
            </Row>
            <div className="flex justify-end">
                <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>
                    Обновить
                </Button>
            </div>
        </div>
    );
};

export default SystemStatusPanel; 