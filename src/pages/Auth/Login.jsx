import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Checkbox, Button, Typography, Divider, Space, message } from 'antd';
import { 
  MailOutlined, 
  LockOutlined, 
  GoogleOutlined, 
  WindowsOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  
  // Watch all form fields for value changes to dynamic validate submit state
  const values = Form.useWatch([], form);

  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(true))
      .catch(() => setSubmittable(false));
  }, [values, form]);

  // Form submission handler
  const onFinish = (values) => {
    setLoading(true);
    
    // Simulate authentication API call (e.g. Flask backend)
    setTimeout(() => {
      const isAdmin = values.email === 'admin@hrms.com';
      
      const userObj = {
        name: isAdmin ? 'Ratnadeep' : 'John Doe',
        role: isAdmin ? 'HR Manager' : 'Software Engineer',
        email: values.email,
        avatarUrl: null
      };

      // Set authentication tokens in local storage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      
      message.success({
        content: `Welcome back, ${userObj.name}!`,
        duration: 3
      });
      
      setLoading(false);
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <Card 
      style={{ 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)', 
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        background: '#ffffff',
        animation: 'fadeIn 0.6s ease-in-out'
      }}
      bodyStyle={{ padding: '40px 36px' }}
      className="login-card"
    >
      {/* Title & Welcome Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <Title level={3} style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#1F2937' }}>
          Welcome Back
        </Title>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          Sign in to access your HR dashboard.
        </Text>
      </div>

      {/* Main Login Form */}
      <Form
        form={form}
        name="hrms_login_form"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
        size="large"
      >
        {/* Email Address Input */}
        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 500, fontSize: '13px' }}>Email Address</span>}
          rules={[
            { required: true, message: 'Please enter your email address!' },
            { type: 'email', message: 'Please enter a valid corporate email!' }
          ]}
          hasFeedback
        >
          <Input 
            prefix={<MailOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />} 
            placeholder="name@company.com" 
            style={{ borderRadius: '8px' }}
            aria-label="Email Address"
          />
        </Form.Item>

        {/* Password Input */}
        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 500, fontSize: '13px' }}>Password</span>}
          rules={[
            { required: true, message: 'Please enter your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' }
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
            placeholder="••••••••"
            style={{ borderRadius: '8px' }}
            aria-label="Password"
          />
        </Form.Item>

        {/* Extra Actions Row (Remember me & Forgot password) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox style={{ fontSize: '13px' }}>Remember me</Checkbox>
          </Form.Item>
          <a 
            href="#forgot" 
            onClick={(e) => { 
              e.preventDefault(); 
              message.info('Forgot password link clicked (Visual placeholder).'); 
            }} 
            style={{ fontSize: '13px', color: '#1677ff', fontWeight: 500 }}
          >
            Forgot password?
          </a>
        </div>

        {/* Primary Submit Button */}
        <Form.Item style={{ marginBottom: '16px' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            disabled={!submittable}
            block 
            style={{ 
              borderRadius: '8px', 
              fontWeight: 600,
              height: '45px',
              backgroundColor: '#1677ff',
              boxShadow: submittable ? '0 4px 12px rgba(22, 119, 255, 0.2)' : 'none',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Log In
          </Button>
        </Form.Item>
      </Form>

      {/* Navigation to Signup */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#1677ff', fontWeight: 600 }}>
            Create Account
          </Link>
        </Text>
      </div>

      {/* Social Logins Dividers */}
      <Divider plain><span style={{ color: '#bfbfbf', fontSize: '11px', fontWeight: 500 }}>OR CONTINUE WITH</span></Divider>

      {/* Social Buttons List */}
      <Space direction="horizontal" style={{ width: '100%', justifyContent: 'center', marginBottom: '24px' }} size="middle">
        <Button 
          icon={<GoogleOutlined />} 
          style={{ borderRadius: '8px', width: '130px', fontWeight: 500 }}
          onClick={() => message.info('Google SSO authentication is simulated.')}
        >
          Google
        </Button>
        <Button 
          icon={<WindowsOutlined />} 
          style={{ borderRadius: '8px', width: '130px', fontWeight: 500 }}
          onClick={() => message.info('Microsoft SSO authentication is simulated.')}
        >
          Microsoft
        </Button>
      </Space>

      {/* Security Banner Info */}
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span>🔒</span> Your information is securely protected.
        </Text>
      </div>
    </Card>
  );
};

export default Login;
