
import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  AlertOutlined,
  MobileOutlined,
  TeamOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Панель управления'
    },
    {
      key: '/alerts',
      icon: <AlertOutlined />,
      label: 'Алерты'
    },
    {
      key: '/devices',
      icon: <MobileOutlined />,
      label: 'Устройства'
    },
    {
      key: '/clients',
      icon: <TeamOutlined />,
      label: 'Клиенты'
    },
    {
      key: '/logs',
      icon: <FileTextOutlined />,
      label: 'Журнал'
    }
  ];

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="0"
    >
      <div style={{ 
        height: '32px', 
        margin: '16px', 
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold'
      }}>
        REMOSA
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
}

export default Sidebar;
