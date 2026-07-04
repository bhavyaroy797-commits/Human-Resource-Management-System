import React from 'react';
import { Card, Avatar, Tag, Space, Button, Typography, Tooltip, message } from 'antd';
import { 
  MailOutlined, 
  PhoneOutlined, 
  EyeOutlined, 
  EditOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import './EmployeeCard.css';

const { Title, Text } = Typography;

const EmployeeCard = ({ employee, onView, onEdit }) => {
  const handleCopyEmail = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(employee.email);
    message.success('Email address copied to clipboard.');
  };

  const handleCopyPhone = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(employee.phone);
    message.success('Phone number copied to clipboard.');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'onboarding': return 'orange';
      case 'suspended': return 'red';
      default: return 'default';
    }
  };

  const initials = employee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card
      hoverable
      className="employee-directory-card"
      bordered={false}
      style={{
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        background: '#ffffff',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      {/* Top details layout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <Tag color={getStatusColor(employee.status)} style={{ borderRadius: '4px', margin: 0 }}>
          {employee.status}
        </Tag>
        <Text type="secondary" style={{ fontSize: '11px', fontWeight: 600 }}>{employee.id}</Text>
      </div>

      {/* Main profile layout */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
        <Avatar 
          size={72} 
          style={{ 
            backgroundColor: '#1677ff', 
            fontSize: '24px', 
            fontWeight: 600,
            marginBottom: '12px',
            boxShadow: '0 4px 10px rgba(22, 119, 255, 0.15)'
          }}
        >
          {initials}
        </Avatar>
        <Title level={5} style={{ margin: '0 0 4px 0', fontWeight: 700 }}>{employee.name}</Title>
        <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>{employee.role}</Text>
        <Tag color="blue" style={{ borderRadius: '4px' }}>{employee.department}</Tag>
      </div>

      {/* Contact Quick links */}
      <div className="card-contact-strip" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
        <Tooltip title={employee.email}>
          <Button 
            shape="circle" 
            icon={<MailOutlined />} 
            onClick={handleCopyEmail}
            style={{ color: '#6b7280' }}
          />
        </Tooltip>
        <Tooltip title={employee.phone}>
          <Button 
            shape="circle" 
            icon={<PhoneOutlined />} 
            onClick={handleCopyPhone}
            style={{ color: '#6b7280' }}
          />
        </Tooltip>
        <Tooltip title={`Joined: ${employee.joinDate}`}>
          <Button 
            shape="circle" 
            icon={<CalendarOutlined />} 
            style={{ color: '#6b7280', cursor: 'default' }}
            disabled
          />
        </Tooltip>
      </div>

      {/* Bottom control buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button 
          type="primary" 
          ghost 
          icon={<EyeOutlined />} 
          style={{ flex: 1, borderRadius: '8px', fontWeight: 500 }}
          onClick={() => onView(employee)}
        >
          View Profile
        </Button>
        <Button 
          icon={<EditOutlined />} 
          style={{ borderRadius: '8px' }}
          onClick={() => onEdit(employee)}
        />
      </div>
    </Card>
  );
};

export default EmployeeCard;
