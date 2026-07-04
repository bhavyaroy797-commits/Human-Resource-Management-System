import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Badge, Drawer, Grid, Breadcrumb, Typography, Input, Tooltip, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  CheckSquareOutlined,
  CoffeeOutlined,
  DollarOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MessageOutlined,
  BulbOutlined,
  SearchOutlined
} from '@ant-design/icons';

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Ratnadeep', role: 'HR Manager' });
  
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Responsive check: screens.md is true for screens >= 768px (Desktop/Laptop)
  const isMobile = screens.xs || (screens.sm && !screens.md);

  useEffect(() => {
    // Sync current user state
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  // Determine active route key
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
      handleLogout();
    } else if (key === 'settings') {
      navigate('/profile#settings');
    } else {
      navigate(`/${key}`);
    }
    // Close mobile drawer on item click
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Sidebar Menu Items definition
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
      label: 'Leave Management',
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
      key: 'sidebar-divider',
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  // Profile Dropdown items definition
  const profileMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/profile#settings'),
    },
    {
      key: 'profile-divider',
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Breadcrumbs rendering
  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const breadcrumbItems = [
    { title: 'Home', key: 'home' },
    ...pathSnippets.map((snippet) => ({
      title: snippet.charAt(0).toUpperCase() + snippet.slice(1),
      key: snippet
    }))
  ];

  // Menu HTML structure to share between Sider & Drawer
  const renderSidebarMenu = () => (
    <>
      <div style={{
        height: '64px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        cursor: 'pointer'
      }} onClick={() => navigate('/dashboard')}>
        <img 
          src="/logo.png" 
          alt="HRMS Logo" 
          style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'contain' }} 
        />
        {(!collapsed || isMobile) && (
          <span style={{ 
            color: '#ffffff', 
            fontSize: '18px', 
            fontWeight: 700, 
            letterSpacing: '0.5px',
            fontFamily: "'Outfit', 'Inter', sans-serif"
          }}>
            HRMS
          </span>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        onClick={handleMenuClick}
        items={menuItems}
        style={{ borderRight: 0, marginTop: '16px' }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      {/* 1. Sidebar - Desktop Sider (Hidden on Mobile) */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={240}
          collapsedWidth={80}
          theme="dark"
          style={{
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 101,
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          {renderSidebarMenu()}
        </Sider>
      )}

      {/* 2. Sidebar - Mobile Drawer (Visible on Mobile Only) */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          styles={{ body: { padding: 0, backgroundColor: '#001529' } }}
          width={240}
          closable={false}
        >
          {renderSidebarMenu()}
        </Drawer>
      )}

      {/* 3. Main content Layout wrapper */}
      <Layout style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 240),
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}>
        
        {/* Sticky Fixed Header */}
        <Header style={{ 
          background: '#ffffff', 
          padding: '0 24px', 
          height: '64px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}>
          {/* Header Left: Menu Toggle Button & Breadcrumbs */}
          <Space size="middle">
            <Button
              type="text"
              icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
            {!isMobile && <Breadcrumb items={breadcrumbItems} />}
          </Space>

          {/* Header Right: Actions Panel */}
          <Space size="large" align="center">
            {/* Search Input (Hidden on mobile) */}
            {!isMobile && (
              <Input
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Search..."
                style={{ width: 200, borderRadius: '8px' }}
              />
            )}

            {/* Notification Center */}
            <Tooltip title="Notifications">
              <Badge count={3} size="small" offset={[-2, 2]}>
                <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: '18px' }} />} />
              </Badge>
            </Tooltip>

            {/* Message Center */}
            <Tooltip title="Messages">
              <Badge count={2} size="small" offset={[-2, 2]}>
                <Button type="text" shape="circle" icon={<MessageOutlined style={{ fontSize: '18px' }} />} />
              </Badge>
            </Tooltip>

            {/* Theme Toggle Placeholder */}
            <Tooltip title="Toggle Theme">
              <Button 
                type="text" 
                shape="circle" 
                icon={<BulbOutlined style={{ fontSize: '18px' }} />} 
                onClick={() => {
                  setDarkMode(!darkMode);
                  message.info('Dark Mode theme toggled (Visual simulator).');
                }}
              />
            </Tooltip>

            {/* User Dropdown Profile Container */}
            <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                {!isMobile && (
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#262626' }}>
                      {currentUser.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#1677ff', fontWeight: 600 }}>
                      {currentUser.role}
                    </span>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Scrollable Content Viewport */}
        <Content style={{ 
          padding: isMobile ? '16px' : '24px', 
          minHeight: 'calc(100vh - 134px)', // Header height (64px) + Footer height (70px)
          background: '#F5F7FA'
        }}>
          <div style={{
            animation: 'fadeIn 0.3s ease-in-out'
          }}>
            <Outlet />
          </div>
        </Content>

        {/* Footer Banner */}
        <Footer style={{ 
          textAlign: 'center', 
          background: '#ffffff',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          padding: '20px 24px',
          color: '#8c8c8c',
          fontSize: '13px'
        }}>
          © 2026 Human Resource Management System | Built for Hackathon
        </Footer>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
