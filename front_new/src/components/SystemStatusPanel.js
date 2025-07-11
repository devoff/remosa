import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../lib/useApi';
import { Row, Col, Card, Statistic, Spin, Alert, Button } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, SyncOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
const SystemStatusPanel = () => {
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        }
        catch (err) {
            console.error('Ошибка при получении статуса системы:', err);
            setError('Не удалось загрузить данные о состоянии системы.');
        }
        finally {
            setLoading(false);
        }
    }, [get]);
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Обновляем каждые 30 секунд
        return () => clearInterval(interval);
    }, [fetchData]);
    if (loading && (!stats || !health)) {
        return _jsx(Spin, { tip: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u044B...", size: "large" });
    }
    if (error) {
        return _jsx(Alert, { message: "\u041E\u0448\u0438\u0431\u043A\u0430", description: error, type: "error", showIcon: true });
    }
    const dbHealthy = health?.database === 'healthy';
    const apiHealthy = health?.status === 'ok';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, sm: 12, md: 8, lg: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u0421\u0442\u0430\u0442\u0443\u0441 API", value: apiHealthy ? 'Онлайн' : 'Оффлайн', valueStyle: { color: apiHealthy ? '#3f8600' : '#cf1322' }, prefix: apiHealthy ? _jsx(CheckCircleOutlined, {}) : _jsx(ExclamationCircleOutlined, {}) }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 8, lg: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u0421\u0442\u0430\u0442\u0443\u0441 \u0411\u0414", value: dbHealthy ? 'Онлайн' : 'Ошибка', valueStyle: { color: dbHealthy ? '#3f8600' : '#cf1322' }, prefix: _jsx(DatabaseOutlined, {}) }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 8, lg: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "Uptime", value: stats?.uptime || 'N/A' }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 8, lg: 6, children: _jsx(Card, { hoverable: true, onClick: () => navigate('/admin/devices'), children: _jsx(Statistic, { title: "\u0412\u0441\u0435\u0433\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432", value: stats?.totalDevices }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 8, lg: 6, children: _jsx(Card, { hoverable: true, onClick: () => navigate('/admin/alerts'), children: _jsx(Statistic, { title: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0430\u043B\u0435\u0440\u0442\u044B", value: stats?.activeAlerts, valueStyle: { color: (stats?.activeAlerts || 0) > 0 ? '#cf1322' : '#3f8600' } }) }) })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { icon: _jsx(SyncOutlined, {}), onClick: fetchData, loading: loading, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C" }) })] }));
};
export default SystemStatusPanel;
