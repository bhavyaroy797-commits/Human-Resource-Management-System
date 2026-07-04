import React from 'react';
import { Outlet } from 'react-router-dom';
import { Row, Col, Space, Typography, Card } from 'antd';
import { 
  TeamOutlined, 
  CheckSquareOutlined, 
  CoffeeOutlined, 
  DollarOutlined 
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const AuthLayout = () => {
  // Feature highlights to render in left branding panel
  const features = [
    {
      icon: <TeamOutlined style={{ fontSize: '20px', color: '#ffffff' }} />,
      title: 'Employee Directory',
      desc: 'Centralized staff database and profile management.'
    },
    {
      icon: <CheckSquareOutlined style={{ fontSize: '20px', color: '#ffffff' }} />,
      title: 'Attendance Tracker',
      desc: 'Accurate time logging and presence dashboards.'
    },
    {
      icon: <CoffeeOutlined style={{ fontSize: '20px', color: '#ffffff' }} />,
      title: 'Leave Portal',
      desc: 'Automated time-off submissions and approvals.'
    },
    {
      icon: <DollarOutlined style={{ fontSize: '20px', color: '#ffffff' }} />,
      title: 'Payroll Automation',
      desc: 'Payslip generators and compensation logs.'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#F5F7FA',
      fontFamily: "'Inter', 'Poppins', sans-serif"
    }}>
      
      {/* Main Split-Screen Section */}
      <Row style={{ flex: 1 }} align="stretch">
        
        {/* Left Branding Panel (Hidden on mobile/tablet viewports) */}
        <Col 
          xs={0} 
          md={10} 
          lg={11} 
          style={{
            background: 'linear-gradient(135deg, #1677FF 0%, #002766 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '4px 0 24px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Subtle Decorative Floating Shapes */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(64, 150, 255, 0.15)',
            top: '-50px',
            left: '-50px',
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(22, 119, 255, 0.2)',
            bottom: '-50px',
            right: '-30px',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }} />

          {/* Branding Content */}
          <div style={{ maxWidth: '480px', margin: '0 auto', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <img 
                src="/logo.png" 
                alt="HRMS logo icon" 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  padding: '8px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                }} 
              />
              <span style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '1px' }}>HRMS</span>
            </div>

            <Title level={2} style={{ color: '#ffffff', fontWeight: 700, margin: '0 0 12px 0', fontSize: '32px' }}>
              Human Resource Management System
            </Title>
            
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', marginBottom: '40px' }}>
              Manage your workforce efficiently with one intelligent platform.
            </Paragraph>

            {/* Feature lists */}
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {features.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    padding: '10px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                      {item.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </Space>
          </div>
        </Col>

        {/* Right Authentication Card Container (Always visible) */}
        <Col 
          xs={24} 
          md={14} 
          lg={13} 
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            position: 'relative'
          }}
        >
          {/* Card Wrapper with responsive widths */}
          <div style={{
            width: '100%',
            maxWidth: '440px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Header branding on top of card (Highly visual on mobile) */}
            <div className="mobile-header" style={{ textAlign: 'center', marginBottom: '8px' }}>
              <img 
                src="/logo.png" 
                alt="HRMS Logo" 
                style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '12px',
                  objectFit: 'contain',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }} 
              />
              <Title level={4} style={{ margin: '0 0 4px', fontWeight: 700, color: '#1F2937' }}>
                Welcome Back
              </Title>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Please sign in to continue to your workspace.
              </Text>
            </div>

            {/* Child component loading area */}
            <Outlet />
          </div>
        </Col>
      </Row>

      {/* Global Footer banner */}
      <footer style={{
        textAlign: 'center',
        padding: '20px 24px',
        background: '#ffffff',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        color: '#8c8c8c',
        fontSize: '12px',
        zIndex: 5
      }}>
        © 2026 Human Resource Management System | Built for Hackathon
      </footer>
    </div>
  );
};

export default AuthLayout;
