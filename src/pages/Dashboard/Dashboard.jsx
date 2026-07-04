import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Table, Tag, Button, Typography, Space, Avatar, Timeline, Badge, List, Tooltip, Divider, Modal, message } from 'antd';
import {
  TeamOutlined,
  CheckCircleOutlined,
  CoffeeOutlined,
  UserAddOutlined,
  DollarCircleOutlined,
  PercentageOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  NotificationOutlined,
  EyeOutlined,
  SmileOutlined,
  GiftOutlined,
  BellOutlined
} from '@ant-design/icons';
import { api } from '../../services/api.js';

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [currentUser, setCurrentUser] = useState({ name: 'Ratnadeep', role: 'HR Manager' });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock simulator hook
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const empRes = await api.getEmployees();
      const leaveRes = await api.getLeaves();
      const attRes = await api.getAttendance();
      
      setEmployees(empRes.data);
      setLeaves(leaveRes.data);
      setAttendance(attRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
    
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format date and time
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Calculate Metrics
  const totalEmployees = employees.length;
  const presentCount = attendance.filter(a => a.status === 'On Time' || a.status === 'On-time' || a.status === 'Late').length;
  const leaveCount = leaves.filter(l => l.status === 'Approved').length;
  const newEmployeesCount = employees.filter(e => e.status === 'Onboarding').length;
  
  const totalSalary = employees.reduce((acc, curr) => acc + (curr.salary || 0), 0);
  const monthlyPayroll = Math.round(totalSalary / 12);
  const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 100;

  // Recent Onboarding Employees
  const recentEmployeesList = [...employees]
    .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
    .slice(0, 4);

  // Table Columns
  const employeeColumns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1677ff' }}>
            {record.name.split(' ').map(n => n[0]).join('')}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text strong style={{ fontSize: '13px' }}>{record.name}</Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>{record.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Position',
      dataIndex: 'role',
      key: 'role',
      render: (text) => <Text style={{ fontSize: '13px' }}>{text}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'orange'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<EyeOutlined />} 
          onClick={() => navigate('/employees', { state: { searchId: record.id } })}
        />
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SECTION 1: Welcome Banner Card */}
      <Card 
        bordered={false} 
        style={{
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1677FF 0%, #003eb3 100%)',
          boxShadow: '0 8px 24px rgba(22, 119, 255, 0.15)',
          color: '#ffffff'
        }}
        bodyStyle={{ padding: '28px' }}
      >
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Space align="center" size="middle" style={{ marginBottom: '16px' }}>
              <Avatar size={64} style={{ backgroundColor: '#ffffff', color: '#1677ff', fontSize: '24px', fontWeight: 600 }}>
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
              <div>
                <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  Good Morning, {currentUser.name}!
                </Title>
                <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px' }}>
                  {formattedDate} | <span style={{ fontWeight: 600 }}>{formattedTime}</span>
                </Text>
              </div>
            </Space>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>
              "Workforce optimization isn't just about efficiency; it is about building environments where people thrive."
            </Paragraph>
          </Col>
          <Col xs={24} md={8} style={{ display: 'flex', justifyContent: 'md-end', alignItems: 'center' }}>
            <Space size="middle" wrap>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                style={{ backgroundColor: '#ffffff', color: '#1677ff', border: 'none', fontWeight: 600, borderRadius: '8px' }}
                onClick={() => navigate('/employees')}
              >
                Onboard Staff
              </Button>
              <Button 
                ghost 
                style={{ borderColor: '#ffffff', color: '#ffffff', fontWeight: 600, borderRadius: '8px' }}
                onClick={() => navigate('/leave')}
              >
                Time Off
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* SECTION 2: KPI Statistics Cards Grid */}
      <Row gutter={[16, 16]}>
        {/* Card 1: Total Staff */}
        <Col xs={24} sm={12} xl={4}>
          <Card 
            bordered={false} 
            className="kpi-card"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>Total Employees</Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 700, color: '#0050b3' }}>{totalEmployees}</Title>
                <Tag color="blue" style={{ marginTop: '8px' }}>+2 this month</Tag>
              </div>
              <TeamOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
            </div>
          </Card>
        </Col>

        {/* Card 2: Present Today */}
        <Col xs={24} sm={12} xl={4}>
          <Card 
            bordered={false} 
            className="kpi-card"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>Present Today</Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 700, color: '#389e0d' }}>{presentCount}</Title>
                <Tag color="green" style={{ marginTop: '8px' }}>Active shifts</Tag>
              </div>
              <CheckCircleOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
            </div>
          </Card>
        </Col>

        {/* Card 3: Employees on Leave */}
        <Col xs={24} sm={12} xl={4}>
          <Card 
            bordered={false} 
            className="kpi-card"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>On Leave</Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 700, color: '#d48806' }}>{leaveCount}</Title>
                <Tag color="warning" style={{ marginTop: '8px' }}>Approved absences</Tag>
              </div>
              <CoffeeOutlined style={{ fontSize: '32px', color: '#faad14' }} />
            </div>
          </Card>
        </Col>

        {/* Card 4: New Hires */}
        <Col xs={24} sm={12} xl={4}>
          <Card 
            bordered={false} 
            className="kpi-card"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>New Hires</Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 700, color: '#1d39c4' }}>{newEmployeesCount}</Title>
                <Tag color="geekblue" style={{ marginTop: '8px' }}>Onboarding</Tag>
              </div>
              <UserAddOutlined style={{ fontSize: '32px', color: '#2f54eb' }} />
            </div>
          </Card>
        </Col>

        {/* Card 5: Monthly Payroll */}
        <Col xs={24} sm={12} xl={4}>
          <Card 
            bordered={false} 
            className="kpi-card"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>Monthly Payroll</Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 700, color: '#531dab' }}>${monthlyPayroll.toLocaleString()}</Title>
                <Tag color="purple" style={{ marginTop: '8px' }}>Forecast cost</Tag>
              </div>
              <DollarCircleOutlined style={{ fontSize: '32px', color: '#722ed1' }} />
            </div>
          </Card>
        </Col>

        {/* Card 6: Attendance % */}
        <Col xs={24} sm={12} xl={4}>
          <Card 
            bordered={false} 
            className="kpi-card"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>Attendance Rate</Text>
                <Title level={2} style={{ margin: '4px 0 0', fontWeight: 700, color: '#c41d7f' }}>{attendanceRate}%</Title>
                <Tag color="magenta" style={{ marginTop: '8px' }}>Daily average</Tag>
              </div>
              <PercentageOutlined style={{ fontSize: '32px', color: '#eb2f96' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* SECTION 3: Charts Row */}
      <Row gutter={[16, 16]}>
        
        {/* Chart 1: Employee Growth (SVG Area Chart) */}
        <Col xs={24} lg={12} xl={6}>
          <Card title="Employee Headcount Growth" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ position: 'relative', width: '100%', height: '220px', display: 'flex', alignItems: 'flex-end', paddingBottom: '16px' }}>
              <svg width="100%" height="160" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', bottom: '30px', left: 0 }}>
                {/* Area Fill */}
                <path d="M 0 90 Q 20 70, 40 50 T 80 30 T 100 10 L 100 100 L 0 100 Z" fill="rgba(22, 119, 255, 0.15)" />
                {/* Line Path */}
                <path d="M 0 90 Q 20 70, 40 50 T 80 30 T 100 10" fill="none" stroke="#1677ff" strokeWidth="2.5" />
              </svg>
              {/* Custom SVG grid line labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: '#8c8c8c', fontSize: '11px', marginTop: '175px', zIndex: 2 }}>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </Card>
        </Col>

        {/* Chart 2: Monthly Attendance (SVG Bar Chart) */}
        <Col xs={24} lg={12} xl={6}>
          <Card title="Monthly Attendance Rate" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '220px', paddingBottom: '16px' }}>
              {[94, 97, 95, 98, 93, 96].map((rate, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px' }}>
                  <Text strong style={{ fontSize: '10px', color: '#52c41a' }}>{rate}%</Text>
                  <div style={{ 
                    width: '16px', 
                    height: `${rate * 1.5}px`, 
                    backgroundColor: '#52c41a', 
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.3s'
                  }} />
                  <span style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '6px' }}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][idx]}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Chart 3: Department Distribution (SVG Donut Chart) */}
        <Col xs={24} lg={12} xl={6}>
          <Card title="Department Distribution" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', height: '220px' }}>
              <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                {/* Donut sectors */}
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f5f5f5" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1677ff" strokeWidth="3" strokeDasharray="45 100" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#722ed1" strokeWidth="3" strokeDasharray="30 100" strokeDashoffset="-45" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#faad14" strokeWidth="3" strokeDasharray="25 100" strokeDashoffset="-75" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div><Badge color="#1677ff" /> Engineering (45%)</div>
                <div><Badge color="#722ed1" /> Sales & Mktg (30%)</div>
                <div><Badge color="#faad14" /> Design & HR (25%)</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Chart 4: Leave Statistics (SVG Horizontal Bar Chart) */}
        <Col xs={24} lg={12} xl={6}>
          <Card title="Leave Types Utilized" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '220px', gap: '16px' }}>
              {[
                { type: 'Sick Leave', used: 12, max: 15, color: '#ff4d4f' },
                { type: 'Casual Leave', used: 6, max: 12, color: '#faad14' },
                { type: 'Maternity/Paternity', used: 14, max: 30, color: '#722ed1' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <Text strong>{item.type}</Text>
                    <Text type="secondary">{item.used} / {item.max} days</Text>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(item.used / item.max) * 100}%`, backgroundColor: item.color, borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* SECTION 4: Split Content Row (Left: Table. Right: Sidebar panels) */}
      <Row gutter={[16, 16]}>
        
        {/* Left Sub-Section: Recent Employees Table */}
        <Col xs={24} xl={16}>
          <Card 
            title="Recent Onboarded Employees" 
            bordered={false} 
            style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={recentEmployeesList}
              columns={employeeColumns}
              pagination={false}
              size="middle"
              style={{ borderRadius: '0 0 16px 16px', overflow: 'hidden' }}
            />
          </Card>
        </Col>

        {/* Right Sub-Section: Quick Actions, Activities, Events */}
        <Col xs={24} xl={8}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            
            {/* Quick Actions Panel */}
            <Card title="Quick Tasks Portal" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Button 
                  type="default" 
                  icon={<UserAddOutlined style={{ color: '#1677ff' }} />} 
                  style={{ height: '54px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}
                  onClick={() => navigate('/employees')}
                >
                  Add Employee
                </Button>
                <Button 
                  type="default" 
                  icon={<CalendarOutlined style={{ color: '#faad14' }} />} 
                  style={{ height: '54px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}
                  onClick={() => navigate('/leave')}
                >
                  Apply Leave
                </Button>
                <Button 
                  type="default" 
                  icon={<ClockCircleOutlined style={{ color: '#52c41a' }} />} 
                  style={{ height: '54px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}
                  onClick={() => navigate('/attendance')}
                >
                  Log Hours
                </Button>
                <Button 
                  type="default" 
                  icon={<WalletOutlined style={{ color: '#722ed1' }} />} 
                  style={{ height: '54px', borderRadius: '10px', fontSize: '13px', fontWeight: 500 }}
                  onClick={() => navigate('/payroll')}
                >
                  View Payroll
                </Button>
              </div>
            </Card>

            {/* Notification Priority Panel */}
            <Card title="HR Notification Inbox" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '8px 24px' }}>
              <List
                itemLayout="horizontal"
                dataSource={[
                  { title: 'Tax document submission deadline is approaching.', priority: 'High', color: 'red' },
                  { title: 'New onboarding policy update guidelines.', priority: 'Medium', color: 'orange' },
                  { title: 'Summer office hours adjustment notice.', priority: 'Low', color: 'blue' }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Badge status={item.color} />}
                      title={<Text style={{ fontSize: '13px', fontWeight: 500 }}>{item.title}</Text>}
                      description={<Tag color={item.color} size="small">{item.priority}</Tag>}
                    />
                  </List.Item>
                )}
              />
            </Card>

            {/* Activities Timeline */}
            <Card title="Workspace Activity Stream" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <Timeline 
                mode="left"
                items={[
                  { label: '09:00 AM', children: 'Attendance check-ins locked successfully' },
                  { label: 'Yesterday', children: 'Monthly Payslips generated for accounts distribution' },
                  { label: '02-07-2026', children: 'Onboard status updated for Sarah Jenkins (EMP001)' },
                  { label: '30-06-2026', children: 'Leave request approved for Michael Chen' }
                ]}
              />
            </Card>

            {/* Upcoming Events Panel */}
            <Card title="Upcoming Office Events" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '12px 24px' }}>
              <List
                itemLayout="horizontal"
                dataSource={[
                  { icon: <GiftOutlined style={{ color: '#eb2f96' }} />, title: "Sarah Jenkins' Birthday", date: 'July 10, 2026' },
                  { icon: <CalendarOutlined style={{ color: '#52c41a' }} />, title: 'Mid-Year Appraisals Review', date: 'July 15, 2026' },
                  { icon: <SmileOutlined style={{ color: '#1890ff' }} />, title: 'Office Team Building Outing', date: 'August 01, 2026' }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>{item.icon}</div>}
                      title={<Text strong style={{ fontSize: '13px' }}>{item.title}</Text>}
                      description={<Text type="secondary" style={{ fontSize: '11px' }}>{item.date}</Text>}
                    />
                  </List.Item>
                )}
              />
            </Card>

          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
