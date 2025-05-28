import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Statistic } from 'antd';
import { AlertOutlined, MobileOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';

function Dashboard() {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeDevices: 0,
    totalClients: 0,
    successRate: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/v1/stats/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Панель управления</h1>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Всего алертов"
              value={stats.totalAlerts}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Активные устройства"
              value={stats.activeDevices}
              prefix={<MobileOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Всего клиентов"
              value={stats.totalClients}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Успешность"
              value={stats.successRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;