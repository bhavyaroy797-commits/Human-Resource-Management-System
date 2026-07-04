import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Button, Tag, Tabs, Descriptions, Space, Progress, Timeline, List, Modal, Form, Input, Select, Upload, message, Typography, Empty, Divider } from 'antd';
import {
  UserOutlined,
  EditOutlined,
  UploadOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { api } from '../../services/api.js';

const { Title, Text, Paragraph } = Typography;

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          name: parsed.name || 'Ratnadeep Sen',
          role: parsed.role || 'HR Manager',
          email: parsed.email || 'ratna123@gmail.com',
          id: 'EMP001',
          department: 'HR',
          status: 'Active',
          phone: '+91 99999 88888',
          gender: 'Male',
          dob: '1990-09-09',
          address: 'Mumbai HQ',
          emergencyContact: 'Family: (+91 98765 43210)',
          joinDate: '2021-01-10'
        };
      } catch (e) {}
    }
    return {
      name: 'Ratnadeep Sen',
      role: 'HR Manager',
      email: 'ratna123@gmail.com',
      id: 'EMP001',
      department: 'HR',
      status: 'Active',
      phone: '+91 99999 88888',
      gender: 'Male',
      dob: '1990-09-09',
      address: 'Mumbai HQ',
      emergencyContact: 'Family: (+91 98765 43210)',
      joinDate: '2021-01-10'
    };
  });
  const [employees, setEmployees] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Load employee profile details
  const loadProfile = async () => {
    const storedUser = localStorage.getItem('currentUser');
    try {
      const res = await api.getEmployees();
      const allEmps = res.data;
      setEmployees(allEmps);

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Find full profile matching the logged-in user email
        const matchedProfile = allEmps.find(e => e.email === parsedUser.email);
        if (matchedProfile) {
          setCurrentUser(matchedProfile);
        }
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle Edit profile submission
  const handleEditSubmit = (values) => {
    const updatedUser = {
      ...currentUser,
      name: values.name,
      phone: values.phone,
      address: values.address,
      dob: values.dob,
      gender: values.gender,
      emergencyContact: values.emergencyContact
    };
    
    // Save updated details using API
    api.updateProfile(updatedUser)
      .then(() => {
        // Update logged in user sync state
        const currentSession = JSON.parse(localStorage.getItem('currentUser')) || {};
        localStorage.setItem('currentUser', JSON.stringify({
          ...currentSession,
          name: values.name
        }));

        message.success('Profile updated successfully.');
        setIsEditModalOpen(false);
        loadProfile();
        // Dispatch storage event to trigger navbar update
        window.dispatchEvent(new Event('storage'));
      })
      .catch(err => {
        message.error('Failed to update profile details.');
      });
  };

  // Mock document checklist
  const documents = [
    { name: 'Resume_CV.pdf', size: '2.4 MB', type: 'Resume' },
    { name: 'National_ID_Card.pdf', size: '1.2 MB', type: 'ID Card' },
    { name: 'Degree_Certificate.pdf', size: '4.1 MB', type: 'Certificates' },
    { name: 'HRMS_Offer_Letter.pdf', size: '980 KB', type: 'Offer Letter' }
  ];

  // Mock timeline logs
  const activities = [
    { time: '09:02 AM Today', title: 'Clocked In', desc: 'Clocked in at San Francisco office, late by 2 minutes.' },
    { time: 'Yesterday', title: 'Leave Request Approved', desc: 'Sick Leave request for July 6th has been approved by HR.' },
    { time: '01-07-2026', title: 'Bank Info Updated', desc: 'Updated direct deposit routing credentials.' },
    { time: '15-06-2026', title: 'Profile Updated', desc: 'Edited primary residence address field.' }
  ];

  // Overview Tab Layout component
  const OverviewTab = () => (
    <Row gutter={[16, 16]}>
      {/* 1. Personal info card */}
      <Col xs={24} lg={12}>
        <Card title={<Space><UserOutlined style={{ color: '#1677ff' }} /><span>Personal Details</span></Space>} bordered={false} style={{ borderRadius: '12px' }}>
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="Full Name">{currentUser.name}</Descriptions.Item>
            <Descriptions.Item label="Email Address">{currentUser.email}</Descriptions.Item>
            <Descriptions.Item label="Phone Number">{currentUser.phone || '+1 (555) 019-2834'}</Descriptions.Item>
            <Descriptions.Item label="Gender">{currentUser.gender || 'Male'}</Descriptions.Item>
            <Descriptions.Item label="Date of Birth">{currentUser.dob || '1995-08-20'}</Descriptions.Item>
            <Descriptions.Item label="Address">{currentUser.address || 'Not Configured'}</Descriptions.Item>
            <Descriptions.Item label="Emergency Contact">{currentUser.emergencyContact || 'Spouse: Jane Doe (+1 555 987-6543)'}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      {/* 2. Professional info card */}
      <Col xs={24} lg={12}>
        <Card title={<Space><IdcardOutlined style={{ color: '#52c41a' }} /><span>Professional Details</span></Space>} bordered={false} style={{ borderRadius: '12px' }}>
          <Descriptions column={1} bordered size="middle">
            <Descriptions.Item label="Employee ID">{currentUser.id}</Descriptions.Item>
            <Descriptions.Item label="Department">{currentUser.department}</Descriptions.Item>
            <Descriptions.Item label="Designation">{currentUser.role}</Descriptions.Item>
            <Descriptions.Item label="Reporting Manager">Amanda Ross (HR Lead)</Descriptions.Item>
            <Descriptions.Item label="Joining Date">{currentUser.joinDate}</Descriptions.Item>
            <Descriptions.Item label="Employment Type">Full-Time Permanent</Descriptions.Item>
            <Descriptions.Item label="Work Location">San Francisco HQ</Descriptions.Item>
            <Descriptions.Item label="Shift Timing">09:00 AM - 05:00 PM EST</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      {/* 3. Skill Badge Tags */}
      <Col xs={24}>
        <Card title="Skills & Competencies" bordered={false} style={{ borderRadius: '12px' }}>
          <Space wrap size="middle">
            {['React.js', 'Vite & Webpack', 'Javascript (ES6)', 'Ant Design UI', 'Python Flask', 'SQL Databases', 'Corporate Communication', 'Agile Workflows'].map(skill => (
              <Tag key={skill} color="blue" style={{ padding: '4px 12px', fontSize: '13px', borderRadius: '4px' }}>
                {skill}
              </Tag>
            ))}
          </Space>
        </Card>
      </Col>
    </Row>
  );

  // Tab Menu elements definition
  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: <OverviewTab />
    },
    {
      key: 'documents',
      label: 'Documents',
      children: (
        <Card title="Uploaded Official Documents" bordered={false} style={{ borderRadius: '12px' }}>
          <Row gutter={[16, 16]}>
            {documents.map((doc, idx) => (
              <Col xs={24} sm={12} md={6} key={idx}>
                <Card hoverable style={{ textAlign: 'center', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                  <FilePdfOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{doc.type}</div>
                  <div style={{ color: '#8c8c8c', fontSize: '12px', marginBottom: '16px' }}>{doc.name} ({doc.size})</div>
                  <Button type="primary" ghost size="small" style={{ borderRadius: '6px' }}>Download</Button>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )
    },
    {
      key: 'attendance',
      label: 'Attendance',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="Attendance Performance Tracker" bordered={false} style={{ borderRadius: '12px' }}>
              <Row gutter={[16, 16]} style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Col xs={12} md={6}>
                  <Card style={{ backgroundColor: '#e6f7ff', borderRadius: '8px' }}>
                    <Text type="secondary">Days Present</Text>
                    <Title level={3} style={{ margin: '4px 0 0', color: '#1677ff' }}>22</Title>
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card style={{ backgroundColor: '#fff1f0', borderRadius: '8px' }}>
                    <Text type="secondary">Days Absent</Text>
                    <Title level={3} style={{ margin: '4px 0 0', color: '#ff4d4f' }}>1</Title>
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card style={{ backgroundColor: '#fffbe6', borderRadius: '8px' }}>
                    <Text type="secondary">Leaves Taken</Text>
                    <Title level={3} style={{ margin: '4px 0 0', color: '#faad14' }}>2</Title>
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card style={{ backgroundColor: '#f6ffed', borderRadius: '8px' }}>
                    <Text type="secondary">Attendance %</Text>
                    <Title level={3} style={{ margin: '4px 0 0', color: '#52c41a' }}>95.6%</Title>
                  </Card>
                </Col>
              </Row>
              
              <Divider orientation="left">Leave Entitlements Summary</Divider>
              <Row gutter={[16, 16]}>
                {[
                  { title: 'Sick Leave', used: 2, max: 10, color: '#ff4d4f' },
                  { title: 'Casual Leave', used: 1, max: 12, color: '#faad14' },
                  { title: 'Paid Leaves', used: 4, max: 20, color: '#52c41a' }
                ].map((l, i) => (
                  <Col xs={24} md={8} key={i}>
                    <Card style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text strong>{l.title}</Text>
                        <Text type="secondary">{l.max - l.used} days remaining</Text>
                      </div>
                      <Progress percent={Math.round((l.used / l.max) * 100)} strokeColor={l.color} status="normal" />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: 'payroll',
      label: 'Payroll',
      children: (() => {
        const salary = currentUser.salary || 85000;
        return (
          <Card title="Compensation Summary" bordered={false} style={{ borderRadius: '12px' }}>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} md={12}>
                <Descriptions title="Salary Structure" column={1} bordered size="middle">
                  <Descriptions.Item label="Basic Base Salary">${(salary * 0.75).toLocaleString()} / year</Descriptions.Item>
                  <Descriptions.Item label="Housing Allowance">${(salary * 0.15).toLocaleString()} / year</Descriptions.Item>
                  <Descriptions.Item label="Health & Medical Allowances">${(salary * 0.1).toLocaleString()} / year</Descriptions.Item>
                  <Descriptions.Item label="Bonus Allowances (Target-based)">$5,000 / year</Descriptions.Item>
                  <Descriptions.Item label="Deductions (Insurance/Tax)">-$8,400 / year</Descriptions.Item>
                  <Descriptions.Item label="Net Annually Compensation" style={{ fontWeight: 'bold' }}>
                    <span style={{ color: '#52c41a' }}>${(salary - 8400 + 5000).toLocaleString()} / year</span>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={12} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa', borderRadius: '8px', padding: '24px' }}>
                <WalletOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '12px' }} />
                <Title level={4} style={{ margin: '0 0 8px 0' }}>Payslip Generator</Title>
                <Text type="secondary" style={{ textAlign: 'center', marginBottom: '20px', fontSize: '13px' }}>
                  View, download, or print your official consolidated payroll payslip.
                </Text>
                <Button type="primary" onClick={() => navigate('/payroll')} style={{ borderRadius: '6px' }}>Go to Payroll Portal</Button>
              </Col>
            </Row>
          </Card>
        );
      })()
    },
    {
      key: 'activity',
      label: 'Activity',
      children: (
        <Card title="Employee Action History Logs" bordered={false} style={{ borderRadius: '12px' }}>
          <Timeline 
            mode="left"
            items={activities.map(act => ({
              label: act.time,
              children: (
                <div>
                  <Text strong style={{ fontSize: '14px' }}>{act.title}</Text>
                  <p style={{ margin: '4px 0 0', color: '#8c8c8c', fontSize: '12px' }}>{act.desc}</p>
                </div>
              )
            }))}
          />
        </Card>
      )
    }
  ];

  if (!currentUser || !currentUser.email) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '24px' }}>
        <Card bordered={false} style={{ borderRadius: '16px', maxWidth: '480px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size="small">
                <Text strong style={{ fontSize: '16px' }}>Profile Folder Not Found</Text>
                <Text type="secondary">We were unable to retrieve your detailed employee record from the server. Check your backend status or try refreshing.</Text>
              </Space>
            }
          >
            <Button type="primary" onClick={loadProfile} style={{ borderRadius: '6px', marginTop: '12px' }}>
              Sync Profile Data
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Header Profile Info Panel */}
      <Card 
        bordered={false} 
        style={{ 
          borderRadius: '16px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          background: 'linear-gradient(180deg, #e6f7ff 0%, #ffffff 100%)'
        }}
      >
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={6} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              size={120} 
              style={{ backgroundColor: '#1677ff', fontSize: '48px', fontWeight: 600, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
            >
              {(currentUser.name || currentUser.fullName || 'Employee').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
            </Avatar>
            <Upload showUploadList={false} beforeUpload={() => { message.info('Upload photo simulation.'); return false; }}>
              <Button size="small" icon={<UploadOutlined />} style={{ marginTop: '12px', borderRadius: '6px' }}>Upload Photo</Button>
            </Upload>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Space direction="vertical" size="small">
              <Space align="center" wrap>
                <Title level={2} style={{ margin: 0, fontWeight: 700 }}>{currentUser.name || currentUser.fullName || 'Employee'}</Title>
                <Tag color={currentUser.status === 'Active' ? 'green' : 'orange'} style={{ borderRadius: '4px' }}>
                  {currentUser.status}
                </Tag>
              </Space>
              <Text type="secondary" style={{ fontSize: '15px', display: 'block' }}>{currentUser.role || currentUser.designation || ''}</Text>
              <Space split={<Divider type="vertical" />} style={{ fontSize: '13px', color: '#8c8c8c' }}>
                <span>ID: {currentUser.id}</span>
                <span>Dept: {currentUser.department}</span>
                <span>HQ: San Francisco</span>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={6} style={{ display: 'flex', justifyContent: 'md-end', alignItems: 'center' }}>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              style={{ borderRadius: '8px' }}
              onClick={() => {
                form.setFieldsValue({
                  name: currentUser.name,
                  phone: currentUser.phone || '',
                  address: currentUser.address || '',
                  dob: currentUser.dob || '1995-08-20',
                  gender: currentUser.gender || 'Male',
                  emergencyContact: currentUser.emergencyContact || ''
                });
                setIsEditModalOpen(true);
              }}
            >
              Edit Profile
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 2. Main Dynamic Tabs Area */}
      <Tabs 
        defaultActiveKey="overview" 
        items={tabItems} 
        style={{ background: 'transparent' }}
        type="card"
      />

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile Information"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          size="large"
        >
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter name!' }]}>
            <Input />
          </Form.Item>
          
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="gender" label="Gender">
                <Select>
                  <Option value="Male">Male</Option>
                  <Option value="Female">Female</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dob" label="Date of Birth">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Please enter phone number!' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="address" label="Home Address">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="emergencyContact" label="Emergency Contact (Name & Phone)">
            <Input />
          </Form.Item>

          <Form.Item style={{ margin: '24px 0 0 0', display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Save Changes</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default Profile;
