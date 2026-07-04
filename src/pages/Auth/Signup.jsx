import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Checkbox, Button, Typography, Progress, message } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  IdcardOutlined, 
  PhoneOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Signup = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submittable, setSubmittable] = useState(false);
  
  // Watch fields dynamically
  const values = Form.useWatch([], form);
  const passwordVal = Form.useWatch('password', form) || '';
  const agreeVal = Form.useWatch('agree', form) || false;

  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => {
        // Form is valid, but is "Agree to terms" checkbox checked?
        setSubmittable(agreeVal);
      })
      .catch(() => setSubmittable(false));
  }, [values, agreeVal, form]);

  // Password strength checker helper
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { percent: 0, text: '', color: '#ff4d4f' };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { percent: 25, text: 'Weak (Add capital, number & symbol)', color: '#ff4d4f' };
    if (score <= 75) return { percent: 60, text: 'Medium (Add special characters)', color: '#faad14' };
    return { percent: 100, text: 'Strong Password', color: '#52c41a' };
  };

  const strength = getPasswordStrength(passwordVal);

  const onFinish = (formValues) => {
    setLoading(true);
    
    // Simulate API registration delay
    setTimeout(() => {
      const newUser = {
        name: formValues.fullName,
        role: formValues.role === 'Admin' ? 'HR Manager' : formValues.designation,
        email: formValues.email,
        department: formValues.department,
        employeeId: formValues.employeeId
      };
      
      // Save details to simulated DB
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
      // Add employee details to listing
      const currentEmployees = JSON.parse(localStorage.getItem('employeesList')) || [];
      const newEmp = {
        key: formValues.employeeId,
        id: formValues.employeeId,
        name: formValues.fullName,
        email: formValues.email,
        role: formValues.role === 'Admin' ? 'HR Manager' : formValues.designation,
        department: formValues.department,
        status: 'Onboarding',
        joinDate: new Date().toISOString().split('T')[0],
        salary: 75000,
        phone: formValues.phone
      };
      currentEmployees.push(newEmp);
      localStorage.setItem('employeesList', JSON.stringify(currentEmployees));

      message.success('Account successfully registered! Proceeding to Login.');
      setLoading(false);
      navigate('/login');
    }, 1500);
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
      bodyStyle={{ padding: '32px 30px' }}
      className="signup-card"
    >
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#1F2937' }}>
          Create Your Account
        </Title>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          Register to access the Human Resource Management System.
        </Text>
      </div>

      {/* Signup Form */}
      <Form
        form={form}
        name="hrms_signup_form"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
        size="large"
      >
        
        {/* SECTION 1: Personal Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
          <Form.Item
            name="fullName"
            label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Full Name</span>}
            rules={[{ required: true, message: 'Required!' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />} 
              placeholder="John Doe" 
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="employeeId"
            label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Employee ID</span>}
            rules={[
              { required: true, message: 'Required!' },
              { pattern: /^EMP\d+$/, message: 'Format: EMP[number]' }
            ]}
          >
            <Input 
              prefix={<IdcardOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />} 
              placeholder="EMP009" 
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Email Address</span>}
            rules={[
              { required: true, message: 'Required!' },
              { type: 'email', message: 'Enter a valid email!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />} 
              placeholder="name@company.com" 
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Phone Number</span>}
            rules={[
              { required: true, message: 'Required!' },
              { pattern: /^\+?[1-9]\d{9,14}$/, message: 'Invalid phone format!' }
            ]}
          >
            <Input 
              prefix={<PhoneOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />} 
              placeholder="+1555123456" 
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
        </div>

        {/* SECTION 2: Professional Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
          <Form.Item
            name="department"
            label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Department</span>}
            rules={[{ required: true, message: 'Select Dept!' }]}
          >
            <Select placeholder="Select" style={{ borderRadius: '8px' }}>
              <Option value="Engineering">Engineering</Option>
              <Option value="HR">Human Resources</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Design">UI/UX Design</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="Finance">Finance</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="designation"
            label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Designation</span>}
            rules={[{ required: true, message: 'Select Job!' }]}
          >
            <Select placeholder="Select" style={{ borderRadius: '8px' }}>
              <Option value="Software Engineer">Software Engineer</Option>
              <Option value="UI/UX Designer">UI/UX Designer</Option>
              <Option value="HR Specialist">HR Specialist</Option>
              <Option value="Account Analyst">Account Analyst</Option>
              <Option value="Product Manager">Product Manager</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="role"
          label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Workspace System Access Role</span>}
          rules={[{ required: true, message: 'Select user portal role' }]}
        >
          <Select placeholder="Select portal permission role" style={{ borderRadius: '8px' }}>
            <Option value="Employee">Employee (Normal Access)</Option>
            <Option value="HR">HR Officer (Approval Inbox access)</Option>
            <Option value="Admin">Admin (Full Control Access)</Option>
          </Select>
        </Form.Item>

        {/* SECTION 3: Account Information & Password */}
        <Form.Item
          name="password"
          label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Password</span>}
          rules={[
            { required: true, message: 'Required!' },
            { min: 8, message: 'Must be at least 8 characters!' }
          ]}
          style={{ marginBottom: '12px' }}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
            placeholder="Min 8 characters"
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        {/* Password Strength Indicator */}
        {passwordVal && (
          <div style={{ marginBottom: '16px', marginTop: '-4px' }}>
            <Progress 
              percent={strength.percent} 
              strokeColor={strength.color} 
              showInfo={false} 
              size="small" 
              style={{ margin: '0 0 4px 0' }}
            />
            <Text style={{ fontSize: '11px', color: strength.color, fontWeight: 500 }}>
              {strength.text}
            </Text>
          </div>
        )}

        <Form.Item
          name="confirmPassword"
          label={<span style={{ fontWeight: 500, fontSize: '12px' }}>Confirm Password</span>}
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />}
            placeholder="Verify password"
            style={{ borderRadius: '8px' }}
          />
        </Form.Item>

        {/* T&C Checklist */}
        <Form.Item 
          name="agree" 
          valuePropName="checked" 
          rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('You must accept terms!')) }]}
          style={{ marginBottom: '20px' }}
        >
          <Checkbox style={{ fontSize: '12px' }}>
            I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms & Conditions</a> and <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
          </Checkbox>
        </Form.Item>

        {/* Create Account Submit Button */}
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
            Create Account
          </Button>
        </Form.Item>
      </Form>

      {/* Navigation link */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Text type="secondary" style={{ fontSize: '13px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1677ff', fontWeight: 600 }}>
            Sign In
          </Link>
        </Text>
      </div>

      {/* Safety Notice Footer */}
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span>🔒</span> Your information is securely protected and encrypted.
        </Text>
      </div>
    </Card>
  );
};

export default Signup;
