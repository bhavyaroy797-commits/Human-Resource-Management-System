import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  CheckSquareOutlined,
  CoffeeOutlined,
  DollarOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import './Sidebar.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/profile')) {
      if (location.hash === '#settings') return 'settings';
      return 'profile';
    }
    if (path.startsWith('/attendance')) return 'attendance';
    if (path.startsWith('/leave')) return 'leave';
    if (path.startsWith('/payroll')) return 'payroll';
    if (path.startsWith('/employees')) return 'employees';
    return 'dashboard';
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      navigate('/login');
    } else if (key === 'settings') {
      navigate('/profile#settings');
    } else {
      navigate(`/${key}`);
    }
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'attendance',
      icon: <CheckSquareOutlined />,
      label: 'Attendance',
    },
    {
      key: 'leave',
      icon: <CoffeeOutlined />,
      label: 'Leaves',
    },
    {
      key: 'payroll',
      icon: <DollarOutlined />,
      label: 'Payroll',
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: 'Employees',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      key: 'divider-logout',
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      breakpoint="lg"
      collapsedWidth="80"
      theme="dark"
      className="sidebar-sider"
    >
      <div className="sidebar-logo-container" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <img 
          src="/logo.png" 
          alt="HRMS Logo" 
          className="sidebar-logo" 
        />
        {!collapsed && <span className="sidebar-title">HRMS Portal</span>}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        onClick={handleMenuClick}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;
