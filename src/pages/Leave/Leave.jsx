import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Select, DatePicker, Checkbox, Button, Table, Tag, Calendar, Badge, Progress, List, Space, Typography, Tooltip, message, Upload } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UploadOutlined,
  UserOutlined,
  CoffeeOutlined,
  InfoCircleOutlined,
  SmileOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../services/api.js';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Leave = () => {
  const [form] = Form.useForm();
  const [leavesList, setLeavesList] = useState([]);
  const [currentUser, setCurrentUser] = useState({ name: 'Ratnadeep', role: 'HR Manager' });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Watch range dates to auto calculate days
  const dateRange = Form.useWatch('dateRange', form);

  // Auto calculate and update days field
  useEffect(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const diffDays = dateRange[1].diff(dateRange[0], 'day') + 1;
      form.setFieldsValue({ days: diffDays });
    } else {
      form.setFieldsValue({ days: 0 });
    }
  }, [dateRange, form]);

  const loadLeaves = async () => {
    try {
      const res = await api.getLeaves();
      setLeavesList(res.data);
    } catch (err) {
      console.error(err);
    }
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  // Form submission: Apply Leave
  const onFinish = (values) => {
    setLoading(true);
    
    setTimeout(() => {
      const startStr = values.dateRange[0].format('YYYY-MM-DD');
      const endStr = values.dateRange[1].format('YYYY-MM-DD');
      const appliedStr = dayjs().format('YYYY-MM-DD');
      
      const newRequest = {
        empId: 'EMP003', // Logged in user profile ID
        employeeName: currentUser.name,
        type: values.type,
        startDate: startStr,
        endDate: endStr,
        days: values.days,
        reason: values.reason,
        status: 'Pending',
        approvedBy: '-'
      };

      api.applyLeave(newRequest)
        .then(() => {
          message.success('Leave application submitted successfully.');
          form.resetFields();
          setLoading(false);
          loadLeaves(); // Refresh historical logs
        })
        .catch(err => {
          message.error('Failed to submit leave request.');
          setLoading(false);
        });
    }, 1200);
  };

  // Compile Metric Cards
  const totalBalance = 24; // Static overall allocation
  const casualLimit = 12;
  const sickLimit = 10;
  const earnedLimit = 8;

  const casualUsed = leavesList.filter(l => l.employeeName === currentUser.name && l.type === 'Casual Leave' && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0);
  const sickUsed = leavesList.filter(l => l.employeeName === currentUser.name && l.type === 'Sick Leave' && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0);
  const earnedUsed = leavesList.filter(l => l.employeeName === currentUser.name && l.type === 'Earned Leave' && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0);

  const pendingRequestsCount = leavesList.filter(l => l.status === 'Pending').length;
  const approvedLeavesCount = leavesList.filter(l => l.status === 'Approved').length;

  const remainingCasual = Math.max(0, casualLimit - casualUsed);
  const remainingSick = Math.max(0, sickLimit - sickUsed);
  const remainingEarned = Math.max(0, earnedLimit - earnedUsed);
  const totalRemaining = remainingCasual + remainingSick + remainingEarned;

  // Search & Filter
  const filteredLeaves = leavesList.filter(l => {
    const matchesSearch = l.employeeName.toLowerCase().includes(searchText.toLowerCase()) || l.type.toLowerCase().includes(searchText.toLowerCase());
    const matchesType = typeFilter === 'All' || l.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Table Columns
  const columns = [
    {
      title: 'Leave ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'From',
      dataIndex: 'startDate',
      key: 'startDate'
    },
    {
      title: 'To',
      dataIndex: 'endDate',
      key: 'endDate'
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      sorter: (a, b) => a.days - b.days,
      render: (days) => `${days} Day${days > 1 ? 's' : ''}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold';
        if (status === 'Approved') color = 'green';
        if (status === 'Rejected') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Approved By',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      render: (text) => <Text type="secondary">{text}</Text>
    }
  ];

  // Calendar render highlights
  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayOfWeek = value.day();
    
    // Check if matched approved or pending leaves
    const matched = leavesList.find(l => {
      const start = dayjs(l.startDate);
      const end = dayjs(l.endDate);
      return (value.isSame(start, 'day') || value.isAfter(start, 'day')) && (value.isSame(end, 'day') || value.isBefore(end, 'day'));
    });

    if (matched) {
      const isApproved = matched.status === 'Approved';
      return <Badge status={isApproved ? "success" : "warning"} text={isApproved ? "Absence Approved" : "Absence Pending"} />;
    }

    if (dateStr === '2026-07-04') {
      return <Badge status="processing" text="Hackathon Day" />;
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return <Badge status="default" text="Weekend" />;
    }

    return null;
  };

  const cellRender = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Header */}
      <div>
        <Title level={3} style={{ margin: 0 }}>Leave Portal</Title>
        <Text type="secondary">Submit request logs, track remaining leave balances, and view approval boards.</Text>
      </div>

      {/* SECTION 1: Top Statistics Cards Row */}
      <Row gutter={[16, 16]}>
        {/* Total remaining */}
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Total Remaining</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#0050b3' }}>{totalRemaining} / {totalBalance}</Title>
            <Progress percent={Math.round((totalRemaining / totalBalance) * 100)} size="small" showInfo={false} strokeColor="#0050b3" style={{ marginTop: '8px' }} />
          </Card>
        </Col>

        {/* Casual Remaining */}
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Casual Leave</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#1d39c4' }}>{remainingCasual} / {casualLimit}</Title>
            <Progress percent={Math.round((remainingCasual / casualLimit) * 100)} size="small" showInfo={false} strokeColor="#1d39c4" style={{ marginTop: '8px' }} />
          </Card>
        </Col>

        {/* Sick Remaining */}
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #fff1f0 0%, #ffd6e7 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Sick Leave</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#c41d7f' }}>{remainingSick} / {sickLimit}</Title>
            <Progress percent={Math.round((remainingSick / sickLimit) * 100)} size="small" showInfo={false} strokeColor="#c41d7f" style={{ marginTop: '8px' }} />
          </Card>
        </Col>

        {/* Earned Remaining */}
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Earned Leave</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#531dab' }}>{remainingEarned} / {earnedLimit}</Title>
            <Progress percent={Math.round((remainingEarned / earnedLimit) * 100)} size="small" showInfo={false} strokeColor="#531dab" style={{ marginTop: '8px' }} />
          </Card>
        </Col>

        {/* Pending Approval */}
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Pending Requests</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#d48806' }}>{pendingRequestsCount}</Title>
            <Progress percent={pendingRequestsCount > 0 ? 50 : 0} size="small" showInfo={false} strokeColor="#d48806" style={{ marginTop: '8px' }} />
          </Card>
        </Col>

        {/* Approved Leave Absences */}
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Approved Absences</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#389e0d' }}>{approvedLeavesCount}</Title>
            <Progress percent={100} size="small" showInfo={false} strokeColor="#389e0d" style={{ marginTop: '8px' }} />
          </Card>
        </Col>
      </Row>

      {/* SECTION 2: Form & Sidebar Lists */}
      <Row gutter={[16, 16]}>
        
        {/* Apply Leave Form */}
        <Col xs={24} lg={14}>
          <Card title={<Space><FileTextOutlined /><span>Apply for Time Off</span></Space>} bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', height: '100%' }}>
            <Form
              form={form}
              onFinish={onFinish}
              layout="vertical"
              requiredMark={false}
              size="large"
              initialValues={{ days: 0 }}
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="type" label="Leave Type" rules={[{ required: true, message: 'Please select leave category' }]}>
                    <Select placeholder="Select category">
                      <Option value="Sick Leave">Sick Leave</Option>
                      <Option value="Casual Leave">Casual Leave</Option>
                      <Option value="Earned Leave">Earned Leave</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="days" label="Calculated Duration (Days)">
                    <Input disabled prefix={<ClockCircleOutlined />} style={{ borderRadius: '8px' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="dateRange" label="Leave Period Date Boundaries" rules={[{ required: true, message: 'Select period' }]}>
                <RangePicker style={{ width: '100%', borderRadius: '8px' }} />
              </Form.Item>

              <Form.Item name="reason" label="Reason for Leave" rules={[{ required: true, message: 'Please specify reason' }]}>
                <Input.TextArea placeholder="Enter explanation for request..." rows={3} style={{ borderRadius: '8px' }} />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="emergencyContact" label="Emergency Contact (Name & Phone)" rules={[{ required: true, message: 'Required!' }]}>
                    <Input placeholder="John Doe (+15550098)" style={{ borderRadius: '8px' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="attachment" label="Supporting Certificates (Optional)">
                    <Upload beforeUpload={() => false}>
                      <Button icon={<UploadOutlined />} style={{ borderRadius: '8px', width: '100%' }}>Select PDF/Doc</Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ margin: '16px 0 0', display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                  <Button onClick={() => form.resetFields()}>Reset</Button>
                  <Button type="primary" htmlType="submit" loading={loading} style={{ borderRadius: '8px' }}>Apply Leave</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Notifications & Dynamic SVGs */}
        <Col xs={24} lg={10}>
          <Space direction="vertical" style={{ width: '100%', height: '100%' }} size="middle">
            
            {/* SVG Leave statistics */}
            <Card title="Leave Allocations Distribution" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '140px' }}>
                <svg width="100" height="100" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f5f5f5" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1d39c4" strokeWidth="3" strokeDasharray="50 100" strokeDashoffset="0" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#c41d7f" strokeWidth="3" strokeDasharray="30 100" strokeDashoffset="-50" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#531dab" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="-80" />
                </svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                  <div><Badge color="#1d39c4" /> Casual (50%)</div>
                  <div><Badge color="#c41d7f" /> Sick (30%)</div>
                  <div><Badge color="#531dab" /> Earned (20%)</div>
                </div>
              </div>
            </Card>

            {/* Leave notifications list */}
            <Card title="Leave Notification Stream" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '8px 24px' }}>
              <List
                itemLayout="horizontal"
                dataSource={[
                  { title: 'Sarah Jenkins sick leave approved', date: 'Today', status: 'Approved', color: 'green' },
                  { title: 'David Kim casual leave submitted', date: 'Yesterday', status: 'Pending', color: 'orange' },
                  { title: 'Company Holiday announcement: July 4th Hackathon Day', date: '01-07-2026', status: 'Holiday', color: 'blue' }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Badge status={item.color} />}
                      title={<Text style={{ fontSize: '12px', fontWeight: 500 }}>{item.title}</Text>}
                      description={<Text type="secondary" style={{ fontSize: '10px' }}>{item.date} | {item.status}</Text>}
                    />
                  </List.Item>
                )}
              />
            </Card>

          </Space>
        </Col>
      </Row>

      {/* SECTION 3: Leave Calendar */}
      <Card title="Absence & Out-Of-Office Planner" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <Calendar cellRender={cellRender} />
      </Card>

      {/* SECTION 4: Leave History table */}
      <Card title="Request History Ledger" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <Space direction="horizontal" style={{ marginBottom: '16px', width: '100%', justifyContent: 'space-between' }} wrap>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Search employee names..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, borderRadius: '6px' }}
          />
          <Space>
            <Text>Leave Type:</Text>
            <Select value={typeFilter} onChange={(val) => setTypeFilter(val)} style={{ width: 140 }}>
              <Option value="All">All Types</Option>
              <Option value="Sick Leave">Sick Leave</Option>
              <Option value="Casual Leave">Casual Leave</Option>
              <Option value="Earned Leave">Earned Leave</Option>
            </Select>
          </Space>
        </Space>

        <Table
          dataSource={filteredLeaves}
          columns={columns}
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      </Card>

    </div>
  );
};

export default Leave;
