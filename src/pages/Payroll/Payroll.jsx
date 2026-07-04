import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Tag, Button, Typography, Space, Progress, List, Divider, Input, Select, message, Tooltip, Modal, Badge } from 'antd';
import {
  WalletOutlined,
  DollarCircleOutlined,
  PercentageOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  ArrowUpOutlined,
  NotificationOutlined,
  SearchOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { api } from '../../services/api.js';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Payroll = () => {
  const [currentUser, setCurrentUser] = useState({ name: 'Ratnadeep', role: 'HR Manager', salary: 95000 });
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const printSectionRef = useRef();

  useEffect(() => {
    // Sync current logged in user details to customize payslip values
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const sessionUser = JSON.parse(storedUser);
        api.getEmployees().then(res => {
          const allEmps = res.data;
          const matched = allEmps.find(e => e.email === sessionUser.email);
          if (matched) {
            setCurrentUser(matched);
          } else {
            // Fallback matching default session
            setCurrentUser({
              name: sessionUser.name,
              role: sessionUser.role,
              salary: sessionUser.role === 'HR Manager' ? 95000 : 85000,
              id: 'EMP003',
              department: 'HR'
            });
          }
        }).catch(err => {
          console.error('Failed to load employee list for payroll sync:', err);
        });
      } catch (e) {}
    }
  }, []);

  // Compute monthly calculations based on annual salary
  const annualSalary = currentUser.salary || 85000;
  const monthlyBase = Math.round(annualSalary / 12);
  const hra = Math.round(monthlyBase * 0.15); // 15% housing allowance
  const medical = Math.round(monthlyBase * 0.05); // 5% medical
  const transport = 200; // flat
  const bonus = 400; // average monthly target bonus
  const grossSalary = monthlyBase + hra + medical + transport + bonus;

  const pf = Math.round(monthlyBase * 0.08); // 8% retirement fund
  const tax = Math.round(grossSalary * 0.12); // 12% income tax
  const deductions = pf + tax + 50; // other small deductions
  const netSalary = grossSalary - deductions;

  // Mock Payment Info
  const paymentDetails = {
    bankName: 'Silicon Valley Corporate Bank',
    accountNumber: '•••• •••• 4096',
    ifsc: 'SVCB0004928',
    paymentMode: 'Direct Deposit / ACH',
    upi: `${currentUser.name.toLowerCase().replace(' ', '')}@svcb`
  };

  // Mock Notifications
  const payrollNotifications = [
    { title: 'Salary Credited successfully.', desc: `Net pay $${netSalary.toLocaleString()} deposited on June 30, 2026.`, type: 'success' },
    { title: 'PF Contribution logged.', desc: `Provident Fund contribution of $${pf.toLocaleString()} credited.`, type: 'info' },
    { title: 'Tax Report generated.', desc: 'Quarterly tax report is available for download.', type: 'warning' }
  ];

  // Mock History logs
  const payrollHistory = [
    { key: 'P001', month: 'June 2026', gross: grossSalary, deductions: deductions, net: netSalary, status: 'Credited', date: '2026-06-30' },
    { key: 'P002', month: 'May 2026', gross: grossSalary, deductions: deductions, net: netSalary, status: 'Credited', date: '2026-05-31' },
    { key: 'P003', month: 'April 2026', gross: grossSalary, deductions: deductions, net: netSalary, status: 'Credited', date: '2026-04-30' },
    { key: 'P004', month: 'March 2026', gross: grossSalary, deductions: deductions, net: netSalary, status: 'Credited', date: '2026-03-31' }
  ];

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const handleExportCSV = () => {
    message.success('Payroll history exported successfully (CSV generated).');
  };

  const filteredHistory = payrollHistory.filter(h => {
    const matchesSearch = h.month.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'All' || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Pay Period / Month',
      dataIndex: 'month',
      key: 'month',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Gross Salary',
      dataIndex: 'gross',
      key: 'gross',
      render: (val) => `$${val.toLocaleString()}`
    },
    {
      title: 'Total Deductions',
      dataIndex: 'deductions',
      key: 'deductions',
      render: (val) => `-$${val.toLocaleString()}`,
      style: { color: '#ff4d4f' }
    },
    {
      title: 'Net Salary Paid',
      dataIndex: 'net',
      key: 'net',
      render: (val) => <Text strong style={{ color: '#52c41a' }}>${val.toLocaleString()}</Text>
    },
    {
      title: 'Payment Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color="green">{status}</Tag>
    },
    {
      title: 'Payment Date',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'Payslip',
      key: 'download',
      render: () => (
        <Button 
          type="text" 
          icon={<DownloadOutlined style={{ color: '#1677ff' }} />} 
          onClick={() => message.success('Downloading payslip PDF...')}
        />
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome Title */}
      <div>
        <Title level={3} style={{ margin: 0 }}>Payroll & Compensation Portal</Title>
        <Text type="secondary">Review payslip breakdowns, download tax documentation, and track history payments.</Text>
      </div>

      {/* SECTION 1: Summary Cards Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>Basic Pay / mo</Text>
            <Title level={3} style={{ margin: '4px 0 0' }}>${monthlyBase.toLocaleString()}</Title>
            <Tag color="blue" style={{ marginTop: '8px' }}>Base rate</Tag>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>HRA & Allowances</Text>
            <Title level={3} style={{ margin: '4px 0 0' }}>${(hra + medical + transport).toLocaleString()}</Title>
            <Tag color="cyan" style={{ marginTop: '8px' }}>Housing & Travel</Tag>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>Monthly Bonus</Text>
            <Title level={3} style={{ margin: '4px 0 0' }}>${bonus.toLocaleString()}</Title>
            <Tag color="purple" style={{ marginTop: '8px' }}>Target bonus</Tag>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>Deductions / PF</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#ff4d4f' }}>-${deductions.toLocaleString()}</Title>
            <Tag color="red" style={{ marginTop: '8px' }}>Tax & Ret. funds</Tag>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>Income Tax / mo</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#ff4d4f' }}>-${tax.toLocaleString()}</Title>
            <Tag color="red" style={{ marginTop: '8px' }}>12% gross tax</Tag>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Text type="secondary" style={{ fontSize: '11px', color: '#389e0d' }}>Net Monthly Pay</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#389e0d' }}>${netSalary.toLocaleString()}</Title>
            <Tag color="green" style={{ marginTop: '8px' }}>Direct deposit</Tag>
          </Card>
        </Col>
      </Row>

      {/* SECTION 2: Payslip Card & Bank Info */}
      <Row gutter={[16, 16]}>
        
        {/* Left Sub-Section: Payslip Card */}
        <Col xs={24} lg={14}>
          <Card 
            title={<Space><FileTextOutlined /><span>Current Period Payslip (June 2026)</span></Space>}
            bordered={false} 
            style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
            extra={
              <Space>
                <Button size="small" icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
                <Button size="small" type="primary" icon={<DownloadOutlined />} onClick={() => message.success('Downloading payslip PDF...')}>Download</Button>
              </Space>
            }
          >
            {/* Header Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>EMPLOYEE NAME</Text>
                <Text strong>{currentUser.name}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>EMPLOYEE ID</Text>
                <Text strong>{currentUser.id || 'EMP003'}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>DEPARTMENT</Text>
                <Text strong>{currentUser.department || 'HR'}</Text>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>DESIGNATION</Text>
                <Text strong>{currentUser.role}</Text>
              </div>
            </div>

            {/* Breakdown Columns */}
            <Row gutter={24}>
              {/* Earnings Column */}
              <Col span={12} style={{ borderRight: '1px solid #f0f0f0' }}>
                <Divider orientation="left" style={{ margin: '0 0 12px 0' }}><span style={{ fontSize: '12px' }}>Earnings</span></Divider>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Basic Base Pay</Text>
                    <Text strong>${monthlyBase.toLocaleString()}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>House Rent Allowance</Text>
                    <Text strong>${hra.toLocaleString()}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Medical Allowance</Text>
                    <Text strong>${medical.toLocaleString()}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Transport Allowance</Text>
                    <Text strong>${transport.toLocaleString()}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Target Bonus</Text>
                    <Text strong>${bonus.toLocaleString()}</Text>
                  </div>
                </Space>
              </Col>

              {/* Deductions Column */}
              <Col span={12}>
                <Divider orientation="left" style={{ margin: '0 0 12px 0' }}><span style={{ fontSize: '12px' }}>Deductions</span></Divider>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Provident Fund (PF)</Text>
                    <Text strong style={{ color: '#ff4d4f' }}>-${pf.toLocaleString()}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Income Tax (TDS)</Text>
                    <Text strong style={{ color: '#ff4d4f' }}>-${tax.toLocaleString()}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Other Insurance Deductions</Text>
                    <Text strong style={{ color: '#ff4d4f' }}>-$50</Text>
                  </div>
                </Space>
              </Col>
            </Row>

            <Divider style={{ margin: '24px 0 16px 0' }} />
            
            {/* Net Total Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>Net Salary Paid (Direct Credit)</Title>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>${netSalary.toLocaleString()}</Title>
            </div>
          </Card>
        </Col>

        {/* Right Sub-Section: Bank & Notifications */}
        <Col xs={24} lg={10}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            
            {/* Bank Card Info */}
            <Card title={<Space><BankOutlined /><span>Direct Deposit Account</span></Space>} bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Bank">{paymentDetails.bankName}</Descriptions.Item>
                <Descriptions.Item label="Account Number">{paymentDetails.accountNumber}</Descriptions.Item>
                <Descriptions.Item label="IFSC Code">{paymentDetails.ifsc}</Descriptions.Item>
                <Descriptions.Item label="Payment Type">{paymentDetails.paymentMode}</Descriptions.Item>
                <Descriptions.Item label="UPI Alias">{paymentDetails.upi}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Notifications Feed */}
            <Card title="Payroll Notification Stream" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '8px 24px' }}>
              <List
                itemLayout="horizontal"
                dataSource={payrollNotifications}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Badge status={item.type === 'success' ? 'success' : item.type === 'warning' ? 'warning' : 'processing'} />}
                      title={<Text style={{ fontSize: '13px', fontWeight: 500 }}>{item.title}</Text>}
                      description={<Text type="secondary" style={{ fontSize: '11px' }}>{item.desc}</Text>}
                    />
                  </List.Item>
                )}
              />
            </Card>

            {/* SVG Salary growth chart */}
            <Card title="Net Monthly Salary Trend (Jun - Aug)" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '110px', paddingBottom: '12px' }}>
                {[
                  { month: 'Jun', salary: netSalary },
                  { month: 'Jul (Est)', salary: netSalary + 200 },
                  { month: 'Aug (Est)', salary: netSalary + 200 }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
                    <Text strong style={{ fontSize: '10px', color: '#722ed1' }}>${item.salary.toLocaleString()}</Text>
                    <div style={{ 
                      width: '24px', 
                      height: `${(item.salary / grossSalary) * 90}px`, // Scale
                      backgroundColor: '#722ed1', 
                      borderRadius: '4px 4px 0 0'
                    }} />
                    <span style={{ fontSize: '11px', color: '#8c8c8c', marginTop: '6px' }}>{item.month}</span>
                  </div>
                ))}
              </div>
            </Card>

          </Space>
        </Col>
      </Row>

      {/* SECTION 3: Historic Ledger list */}
      <Card title="Consolidated Payment History" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <Space direction="horizontal" style={{ marginBottom: '16px', width: '100%', justifyContent: 'space-between' }} wrap>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Search periods (e.g. May 2026)..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, borderRadius: '6px' }}
          />
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>Export CSV</Button>
          </Space>
        </Space>

        <Table
          dataSource={filteredHistory}
          columns={columns}
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      </Card>

      {/* Print PDF Simulator Modal */}
      <Modal
        title="Payslip Invoice Printer"
        open={isPrintModalOpen}
        onCancel={() => setIsPrintModalOpen(false)}
        onOk={() => {
          message.success('Routing print jobs to systems...');
          setIsPrintModalOpen(false);
        }}
        okText="Confirm Print"
      >
        <div style={{ padding: '16px', border: '1px dashed #d9d9d9', borderRadius: '8px', background: '#fafafa' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <img src="/logo.png" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
            <Title level={4} style={{ margin: '8px 0 0' }}>HRMS Portal Invoice</Title>
            <Text type="secondary" style={{ fontSize: '11px' }}>Period: June 2026</Text>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <p><strong>Employee:</strong> {currentUser.name}</p>
          <p><strong>Designation:</strong> {currentUser.role}</p>
          <p><strong>Gross Pay:</strong> ${grossSalary.toLocaleString()}</p>
          <p><strong>Total Deductions:</strong> -${deductions.toLocaleString()}</p>
          <p><strong>Net Salary Disbursed:</strong> <strong>${netSalary.toLocaleString()}</strong></p>
          <Divider style={{ margin: '8px 0' }} />
          <Text style={{ fontSize: '10px', display: 'block', textAlign: 'center', color: '#bfbfbf' }}>
            🔒 Authenticated and securely signed by HRMS Operations.
          </Text>
        </div>
      </Modal>

    </div>
  );
};

export default Payroll;
