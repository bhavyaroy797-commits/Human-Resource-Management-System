import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button, Space, Typography, Card } from 'antd';
import { 
  DashboardOutlined, 
  LoginOutlined, 
  ArrowLeftOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #F5F7FA 0%, #E4E9F2 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', 'Poppins', sans-serif"
    }}>
      
      {/* Subtle Floating Shapes for premium SaaS aesthetic */}
      <div style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'rgba(22, 119, 255, 0.08)',
        top: '-100px',
        left: '-100px',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'rgba(64, 150, 255, 0.06)',
        bottom: '-50px',
        right: '-50px',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      {/* Main card panel */}
      <Card
        bordered={false}
        style={{
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
          borderRadius: '16px',
          textAlign: 'center',
          background: '#ffffff',
          zIndex: 2,
          animation: 'fadeIn 0.6s ease-in-out'
        }}
        bodyStyle={{ padding: '48px 32px' }}
      >
        <Result
          status="404"
          title={<span style={{ fontSize: '72px', fontWeight: 800, color: '#1677ff', lineHeight: 1 }}>404</span>}
          subTitle={
            <div style={{ marginTop: '12px' }}>
              <Title level={4} style={{ margin: '0 0 8px 0', fontWeight: 700, color: '#1F2937' }}>
                Page Not Found
              </Title>
              <Text type="secondary" style={{ fontSize: '14px', display: 'block', maxWidth: '380px', margin: '0 auto' }}>
                The page you are looking for doesn't exist, has been moved, or you might not have authorization parameters.
              </Text>
            </div>
          }
          extra={
            <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '16px' }}>
              <Button 
                type="primary" 
                icon={<DashboardOutlined />} 
                size="large"
                onClick={() => navigate('/dashboard')}
                style={{ 
                  borderRadius: '8px', 
                  fontWeight: 600, 
                  height: '45px', 
                  width: '220px',
                  backgroundColor: '#1677ff',
                  boxShadow: '0 4px 12px rgba(22, 119, 255, 0.15)'
                }}
              >
                Back to Dashboard
              </Button>
              <Space size="middle" wrap style={{ justifyContent: 'center' }}>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate(-1)}
                  style={{ borderRadius: '8px', height: '40px' }}
                >
                  Go Back
                </Button>
                <Button 
                  icon={<LoginOutlined />} 
                  onClick={() => navigate('/login')}
                  style={{ borderRadius: '8px', height: '40px' }}
                >
                  Go to Login
                </Button>
              </Space>
            </Space>
          }
        />
      </Card>

      {/* Footer Banner */}
      <footer style={{
        position: 'absolute',
        bottom: '24px',
        color: '#8c8c8c',
        fontSize: '12px',
        textAlign: 'center',
        zIndex: 2
      }}>
        © 2026 Human Resource Management System | Built for Hackathon
      </footer>

    </div>
  );
};

export default NotFound;
