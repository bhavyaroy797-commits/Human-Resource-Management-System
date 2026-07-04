import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Input, Badge, Dropdown, Avatar, Space, Button, Popover, List, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  MessageOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined
} from '@ant-design/icons';
import './Navbar.css';

const { Header } = Layout;
const { Text } = Typography;

const Navbar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState({ name: 'Ratnadeep', role: 'HR Manager' });

  useEffect(() => {
    // Read localstorage to mock logged-in state if available
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        // Fallback to default
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

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
      label: 'System Settings',
      onClick: () => navigate('/profile#settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Mock Notifications
  const notificationsList = (
    <List
      size="small"
      style={{ width: 280 }}
      header={<div style={{ fontWeight: 'bold' }}>Notifications</div>}
      footer={<Button type="link" size="small" block>Clear all</Button>}
      dataSource={[
        { id: 1, text: 'Leave request from Jane Doe' },
        { id: 2, text: 'New employee onboarding pending' },
        { id: 3, text: 'Payroll generated for July' },
      ]}
      renderItem={(item) => (
        <List.Item style={{ cursor: 'pointer' }}>
          <Text ellipsis style={{ fontSize: '13px' }}>{item.text}</Text>
        </List.Item>
      )}
    />
  );

  // Mock Messages
  const messagesList = (
    <List
      size="small"
      style={{ width: 280 }}
      header={<div style={{ fontWeight: 'bold' }}>Messages</div>}
      footer={<Button type="link" size="small" block>View all messages</Button>}
      dataSource={[
        { id: 1, sender: 'Alex Rivera', text: 'Did you review the attendance report?' },
        { id: 2, sender: 'Sarah Chen', text: 'Sent you the onboarding documents.' },
      ]}
      renderItem={(item) => (
        <List.Item style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ fontSize: '12px' }}>{item.sender}</Text>
            <Text ellipsis style={{ fontSize: '12px', color: '#8c8c8c' }}>{item.text}</Text>
          </div>
        </List.Item>
      )}
    />
  );

  return (
    <Header className="navbar-header" style={{ background: 'var(--header-bg, #ffffff)', padding: '0 24px' }}>
      <Space size="large" align="center" style={{ width: '100%', justifyContent: 'space-between', height: '100%' }}>
        
        {/* Left Side: Collapse Toggle & Search */}
        <Space size="middle">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="navbar-toggle-btn"
          />
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Search employees, documents..."
            className="navbar-search"
            style={{ width: 260, borderRadius: '8px' }}
          />
        </Space>

        {/* Right Side: Notification, Messages, User Info */}
        <Space size="middle" align="center">
          {/* Notifications */}
          <Popover content={notificationsList} trigger="click" placement="bottomRight">
            <Badge count={3} size="small" offset={[-2, 2]}>
              <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: '18px' }} />} />
            </Badge>
          </Popover>

          {/* Messages */}
          <Popover content={messagesList} trigger="click" placement="bottomRight">
            <Badge count={2} size="small" offset={[-2, 2]}>
              <Button type="text" shape="circle" icon={<MessageOutlined style={{ fontSize: '18px' }} />} />
            </Badge>
          </Popover>

          {/* User Profile Dropdown */}
          <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" arrow>
            <Space className="navbar-profile-dropdown" style={{ cursor: 'pointer' }}>
              <Badge dot color="green" offset={[-2, 28]}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
              </Badge>
              <div className="navbar-user-info" style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                <span className="navbar-username" style={{ fontWeight: 600, fontSize: '14px', color: '#262626' }}>
                  {currentUser.name}
                </span>
                <span className="navbar-userrole" style={{ fontSize: '11px', color: '#8c8c8c' }}>
                  {currentUser.role}
                </span>
              </div>
            </Space>
          </Dropdown>
        </Space>
      </Space>
    </Header>
  );
};

export default Navbar;
