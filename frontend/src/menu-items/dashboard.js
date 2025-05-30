// assets
import { DashboardOutlined, AppstoreOutlined } from '@ant-design/icons';

// icons
const icons = {
  DashboardOutlined,
  AppstoreOutlined
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'group-dashboard',
  title: 'Навигация',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Панель управления',
      type: 'item',
      url: '/dashboard',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'devices',
      title: 'Устройства',
      type: 'item',
      url: '/devices',
      icon: icons.AppstoreOutlined,
      breadcrumbs: false
    }
  ]
};

export default dashboard;
