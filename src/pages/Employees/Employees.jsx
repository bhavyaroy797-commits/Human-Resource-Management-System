import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, Card, Table, Tag, Button, Typography, Space, Drawer, Modal, Form, Input, Select, DatePicker, Popconfirm, Avatar, Badge, List, message, Tooltip, InputNumber, Radio, Descriptions } from 'antd';
import {
  TeamOutlined,
  UserCheckOutlined,
  UserAddOutlined,
  BlockOutlined,
  NodeIndexOutlined,
  UserDeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  GiftOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  TableOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../services/api.js';
import EmployeeCard from '../../components/EmployeeCard/EmployeeCard.jsx';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Employees = () => {
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table or grid
  const [searchText, setSearchText] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const loadEmployees = async () => {
    try {
      const res = await api.getEmployees();
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Handle query parameter search (e.g. from Dashboard view details redirect)
  useEffect(() => {
    if (location.state?.searchId && employees.length > 0) {
      const targetEmp = employees.find(e => e.employee_id === location.state.searchId || e.id === location.state.searchId);
      if (targetEmp) {
        setSelectedEmp(targetEmp);
        setIsDetailsDrawerOpen(true);
        // Clear history state to prevent repeating
        window.history.replaceState({}, document.title);
      }
    }
  }, [location, employees]);

  // CRUD Operations
  const handleAddEmployee = (values) => {
    const newEmp = {
      id: values.id,
      name: values.name,
      email: values.email,
      phone: values.phone,
      department: values.department,
      role: values.role,
      joinDate: values.joinDate.format('YYYY-MM-DD'),
      salary: values.salary,
      address: values.address,
      status: 'Active'
    };

    api.createEmployee(newEmp)
      .then(() => {
        message.success('Employee onboarded successfully.');
        setIsAddDrawerOpen(false);
        addForm.resetFields();
        loadEmployees();
      })
      .catch(err => {
        message.error('Failed to onboard employee.');
      });
  };

  const handleEditEmployee = (values) => {
    const updatedEmp = {
      ...selectedEmp,
      name: values.name,
      email: values.email,
      phone: values.phone,
      department: values.department,
      role: values.role,
      salary: values.salary,
      address: values.address
    };

    api.updateEmployee(updatedEmp)
      .then(() => {
        message.success('Employee details updated successfully.');
        setIsEditModalOpen(false);
        editForm.resetFields();
        loadEmployees();
      })
      .catch(err => {
        message.error('Failed to update employee.');
      });
  };

  const handleDeleteEmployee = (id) => {
    api.deleteEmployee(id)
      .then(() => {
        message.error('Employee records removed.');
        loadEmployees();
      })
      .catch(err => {
        message.error('Failed to delete employee.');
      });
  };

  // Metric Computations
  const totalEmployeesCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const onboardingCount = employees.filter(e => e.status === 'Onboarding').length;
  const deptCount = new Set(employees.map(e => e.department)).size;
  const resignedCount = 1; // Simulated statistic

  // Table rendering columns
  const columns = [
    {
      title: 'Employee ID',
      key: 'employee_id',
      render: (_, record) => <Text strong>{record.employee_id || record.id}</Text>,
      sorter: (a, b) => {
        const idA = String(a.employee_id || a.id || '');
        const idB = String(b.employee_id || b.id || '');
        return idA.localeCompare(idB);
      }
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => {
        const displayName = record.full_name || record.name || record.fullName || 'Employee';
        const initials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase();
        return (
          <Space>
            <Avatar style={{ backgroundColor: '#1677ff' }}>
              {initials}
            </Avatar>
            <Text strong style={{ fontSize: '13px' }}>{displayName}</Text>
          </Space>
        );
      },
      sorter: (a, b) => {
        const nameA = String(a.full_name || a.name || a.fullName || '');
        const nameB = String(b.full_name || b.name || b.fullName || '');
        return nameA.localeCompare(nameB);
      }
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <Text style={{ fontSize: '13px' }}>{text}</Text>
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Designation / Role',
      key: 'designation',
      render: (_, record) => <Text style={{ fontSize: '13px' }}>{record.designation || record.role || ''}</Text>
    },
    {
      title: 'Join Date',
      key: 'joining_date',
      render: (_, record) => <Text style={{ fontSize: '13px' }}>{record.joining_date || record.joinDate || ''}</Text>
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
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined style={{ color: '#1677ff' }} />} 
            onClick={() => {
              setSelectedEmp(record);
              setIsDetailsDrawerOpen(true);
            }} 
          />
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: '#faad14' }} />} 
            onClick={() => {
              setSelectedEmp(record);
              editForm.setFieldsValue({
                name: record.full_name || record.name || record.fullName,
                email: record.email,
                phone: record.phone,
                department: record.department,
                role: record.designation || record.role,
                salary: record.salary,
                address: record.address
              });
              setIsEditModalOpen(true);
            }} 
          />
          <Popconfirm
            title="Remove Employee"
            description="Are you sure you want to delete this employee record?"
            onConfirm={() => handleDeleteEmployee(record.employee_id || record.id)}
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Live filter computation
  const filteredEmployees = employees.filter(e => {
    const empName = String(e.full_name || e.name || e.fullName || '');
    const empId = String(e.employee_id || e.id || '');
    const empEmail = String(e.email || '');
    const matchesSearch = empName.toLowerCase().includes(searchText.toLowerCase()) || 
                          empId.toLowerCase().includes(searchText.toLowerCase()) ||
                          empEmail.toLowerCase().includes(searchText.toLowerCase());
    const matchesDept = deptFilter === 'All' || e.department === deptFilter;
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Header */}
      <div>
        <Title level={3} style={{ margin: 0 }}>Employee Management Directory</Title>
        <Text type="secondary">Manage profiles, add new staff logs, and view department distributions.</Text>
      </div>

      {/* SECTION 1: Top Statistics Cards Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>Total Staff</Text>
                <Title level={3} style={{ margin: '4px 0 0', color: '#0050b3' }}>{totalEmployeesCount}</Title>
              </div>
              <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>Active Staff</Text>
                <Title level={3} style={{ margin: '4px 0 0', color: '#389e0d' }}>{activeCount}</Title>
              </div>
              <UserCheckOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>New Onboarding</Text>
                <Title level={3} style={{ margin: '4px 0 0', color: '#1d39c4' }}>{onboardingCount}</Title>
              </div>
              <UserAddOutlined style={{ fontSize: '24px', color: '#2f54eb' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>Departments</Text>
                <Title level={3} style={{ margin: '4px 0 0', color: '#531dab' }}>{deptCount}</Title>
              </div>
              <BlockOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #fff2e8 0%, #ffd8bf 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>Managers</Text>
                <Title level={3} style={{ margin: '4px 0 0', color: '#d4380d' }}>1</Title>
              </div>
              <NodeIndexOutlined style={{ fontSize: '24px', color: '#fa541c' }} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #fff1f0 0%, #ffccc7 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>Resigned</Text>
                <Title level={3} style={{ margin: '4px 0 0', color: '#cf1322' }}>{resignedCount}</Title>
              </div>
              <UserDeleteOutlined style={{ fontSize: '24px', color: '#f5222d' }} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* SECTION 2: Dynamic Split Grid */}
      <Row gutter={[16, 16]}>
        
        {/* Left Side: Employee analytics charts */}
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="Staff Count by Department" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '140px', paddingBottom: '12px' }}>
                  {[
                    { dept: 'Eng', count: employees.filter(e=>e.department==='Engineering').length },
                    { dept: 'HR', count: employees.filter(e=>e.department==='HR').length },
                    { dept: 'Sales', count: employees.filter(e=>e.department==='Sales').length },
                    { dept: 'Design', count: employees.filter(e=>e.department==='Design').length }
                  ].map((d, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px' }}>
                      <Text strong style={{ fontSize: '10px' }}>{d.count}</Text>
                      <div style={{ width: '16px', height: `${d.count * 30}px`, backgroundColor: '#1677ff', borderRadius: '3px 3px 0 0' }} />
                      <span style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '6px' }}>{d.dept}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="Gender Diversity Ratio" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '140px' }}>
                  <svg width="100" height="100" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f5f5f5" strokeWidth="4" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1677ff" strokeWidth="4" strokeDasharray="60 100" />
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eb2f96" strokeWidth="4" strokeDasharray="40 100" strokeDashoffset="-60" />
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    <div><Badge color="#1677ff" /> Male (60%)</div>
                    <div><Badge color="#eb2f96" /> Female (40%)</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Right Side: Quick notifications panel */}
        <Col xs={24} lg={8}>
          <Card title="Activity & Occasions Feed" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', height: '100%' }} bodyStyle={{ padding: '8px 24px' }}>
            <List
              itemLayout="horizontal"
              dataSource={[
                { icon: <GiftOutlined style={{ color: '#eb2f96' }} />, title: "Marcus Brody's Birthday", desc: 'July 10th - Send congratulations!' },
                { icon: <CalendarOutlined style={{ color: '#52c41a' }} />, title: "Elena Rostova's Work Anniversary", desc: '4 years of service on Sep 1st.' },
                { icon: <UserAddOutlined style={{ color: '#1677ff' }} />, title: 'New onboarding pending approval', desc: 'EMP006 details verification.' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>{item.icon}</div>}
                    title={<Text style={{ fontSize: '13px', fontWeight: 500 }}>{item.title}</Text>}
                    description={<Text type="secondary" style={{ fontSize: '11px' }}>{item.desc}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* SECTION 3: Directory Table Panel */}
      <Card title="Employee Directory Ledger" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        {/* Filters and search triggers */}
        <Space direction="horizontal" style={{ marginBottom: '24px', width: '100%', justifyContent: 'space-between' }} wrap>
          <Space wrap>
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Search ID, name, email..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220, borderRadius: '6px' }}
            />
            <Select value={deptFilter} onChange={setDeptFilter} style={{ width: 140 }}>
              <Option value="All">All Departments</Option>
              <Option value="Engineering">Engineering</Option>
              <Option value="HR">Human Resources</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Design">UI/UX Design</Option>
              <Option value="Finance">Finance</Option>
            </Select>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
              <Option value="All">All Statuses</Option>
              <Option value="Active">Active</Option>
              <Option value="Onboarding">Onboarding</Option>
            </Select>
          </Space>
          <Space>
            <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid" style={{ marginRight: '8px' }}>
              <Radio.Button value="table"><TableOutlined /></Radio.Button>
              <Radio.Button value="grid"><AppstoreOutlined /></Radio.Button>
            </Radio.Group>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setIsAddDrawerOpen(true)}
              style={{ borderRadius: '6px' }}
            >
              Add Employee
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => message.success('Exporting directories...')} />
          </Space>
        </Space>

        {viewMode === 'table' ? (
          <Table
            dataSource={filteredEmployees}
            columns={columns}
            pagination={{ pageSize: 5 }}
            size="middle"
          />
        ) : (
          <Row gutter={[16, 16]} className="mt-3">
            {filteredEmployees.map((emp) => (
              <Col xs={24} sm={12} md={8} xl={6} key={emp.id}>
                <EmployeeCard
                  employee={emp}
                  onView={(employee) => {
                    setSelectedEmp(employee);
                    setIsDetailsDrawerOpen(true);
                  }}
                  onEdit={(employee) => {
                    setSelectedEmp(employee);
                    editForm.setFieldsValue({
                      name: employee.full_name || employee.name || employee.fullName,
                      email: employee.email,
                      phone: employee.phone,
                      department: employee.department,
                      role: employee.designation || employee.role,
                      salary: employee.salary,
                      address: employee.address
                    });
                    setIsEditModalOpen(true);
                  }}
                />
              </Col>
            ))}
            {filteredEmployees.length === 0 && (
              <Col span={24} style={{ textAlign: 'center', padding: '32px' }}>
                <Text type="secondary">No employees matched your active search query.</Text>
              </Col>
            )}
          </Row>
        )}
      </Card>

      {/* MODAL/DRAWER 1: Details Profile Drawer */}
      <Drawer
        title="Employee File Folder Detail"
        placement="right"
        width={500}
        onClose={() => setIsDetailsDrawerOpen(false)}
        open={isDetailsDrawerOpen}
        styles={{ body: { padding: '24px' } }}
      >
        {selectedEmp && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Avatar size={90} style={{ backgroundColor: '#1677ff', fontSize: '32px', fontWeight: 600 }}>
                {(selectedEmp.full_name || selectedEmp.name || selectedEmp.fullName || 'Employee').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()}
              </Avatar>
              <Title level={4} style={{ margin: 0 }}>{selectedEmp.full_name || selectedEmp.name || selectedEmp.fullName || 'Employee'}</Title>
              <Tag color="blue">{selectedEmp.designation || selectedEmp.role || ''}</Tag>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Content info mapping */}
            <Descriptions title="Personal Information" column={1} bordered size="small">
              <Descriptions.Item label="Email">{selectedEmp.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedEmp.phone}</Descriptions.Item>
              <Descriptions.Item label="Home Residence">{selectedEmp.address || 'Not Configured'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="Job Parameters" column={1} bordered size="small">
              <Descriptions.Item label="ID Code">{selectedEmp.employee_id || selectedEmp.id}</Descriptions.Item>
              <Descriptions.Item label="Department">{selectedEmp.department}</Descriptions.Item>
              <Descriptions.Item label="Date of Joining">{selectedEmp.joining_date || selectedEmp.joinDate}</Descriptions.Item>
              <Descriptions.Item label="Base Compensation">${Number(selectedEmp.salary || 65000).toLocaleString()} / year</Descriptions.Item>
            </Descriptions>

            <Descriptions title="Workspace Absence Summary" column={1} bordered size="small">
              <Descriptions.Item label="Present Shifts Logged">22 Days</Descriptions.Item>
              <Descriptions.Item label="Vacation/Leave balance">12 Days remaining</Descriptions.Item>
            </Descriptions>

          </Space>
        )}
      </Drawer>

      {/* MODAL/DRAWER 2: Add Employee Drawer */}
      <Drawer
        title="Onboard New Employee"
        placement="right"
        width={540}
        onClose={() => setIsAddDrawerOpen(false)}
        open={isAddDrawerOpen}
        styles={{ body: { padding: '24px' } }}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddEmployee}
          size="large"
          requiredMark={false}
        >
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please input full name!' }]}>
            <Input placeholder="John Doe" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="id" label="Employee ID Code" rules={[
                { required: true, message: 'Required!' },
                { pattern: /^EMP\d+$/, message: 'EMP[number]' }
              ]}>
                <Input placeholder="EMP009" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Corporate Email" rules={[
                { required: true, message: 'Required!' },
                { type: 'email', message: 'Enter a valid email' }
              ]}>
                <Input placeholder="name@company.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Contact" rules={[{ required: true, message: 'Required!' }]}>
                <Input placeholder="+15551234" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salary" label="Annual Base Compensation" rules={[{ required: true, message: 'Required!' }]}>
                <InputNumber style={{ width: '100%' }} formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} placeholder="85000" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Required!' }]}>
                <Select placeholder="Select">
                  <Option value="Engineering">Engineering</Option>
                  <Option value="HR">Human Resources</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Design">UI/UX Design</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="Finance">Finance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="Designation Position" rules={[{ required: true, message: 'Required!' }]}>
                <Input placeholder="Software Engineer" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="joinDate" label="Joining Date Calendar" rules={[{ required: true, message: 'Required!' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="address" label="Home Residence Address">
            <Input.TextArea rows={2} placeholder="123 Pine St, San Francisco..." />
          </Form.Item>

          <Form.Item style={{ margin: '24px 0 0 0', display: 'flex', justifyContent: 'flex-end' }}>
            <Space>
              <Button onClick={() => setIsAddDrawerOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Save & Onboard</Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>

      {/* MODAL/DRAWER 3: Edit Employee Modal */}
      <Modal
        title="Edit Employee Information Details"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditEmployee}
          size="large"
        >
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Required!' }]}>
            <Input />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="email" label="Corporate Email" rules={[
                { required: true, message: 'Required!' },
                { type: 'email', message: 'Enter a valid email' }
              ]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Contact">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Required!' }]}>
                <Select>
                  <Option value="Engineering">Engineering</Option>
                  <Option value="HR">Human Resources</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Design">UI/UX Design</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="Finance">Finance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="Designation Position" rules={[{ required: true, message: 'Required!' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="salary" label="Annual Base Compensation" rules={[{ required: true, message: 'Required!' }]}>
            <InputNumber style={{ width: '100%' }} formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
          </Form.Item>

          <Form.Item name="address" label="Home Residence Address">
            <Input.TextArea rows={2} />
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

export default Employees;
