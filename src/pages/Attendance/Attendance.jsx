import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Table, Tag, Button, Typography, Space, Progress, Calendar, Badge, Input, Select, message, Tooltip } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  LoginOutlined,
  LogoutOutlined,
  SearchOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { api } from '../../services/api.js';

const { Title, Text } = Typography;
const { Option } = Select;

const Attendance = () => {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('Checked Out'); // Checked Out, Checked In, On Break
  const [checkInTime, setCheckInTime] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const timerRef = useRef(null);

  // Load attendance data
  const loadLogs = async () => {
    try {
      const res = await api.getAttendance();
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLogs();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer logic for live check-in hours
  useEffect(() => {
    if (status === 'Checked In') {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else if (status === 'On Break') {
      timerRef.current = setInterval(() => {
        setBreakSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Format seconds to HH:MM:SS
  const formatDuration = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clock Actions
  const handleCheckIn = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setCheckInTime(timeStr);
    setStatus('Checked In');
    setSecondsElapsed(0);
    setBreakSeconds(0);
    message.success(`Checked In successfully at ${timeStr}`);
  };

  const handleBreakToggle = () => {
    if (status === 'Checked In') {
      setStatus('On Break');
      message.info('Break started.');
    } else if (status === 'On Break') {
      setStatus('Checked In');
      message.success('Break ended. Back to work.');
    }
  };

  const handleCheckOut = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const finalHours = (secondsElapsed / 3600).toFixed(2);
    const finalBreaks = (breakSeconds / 3600).toFixed(2);
    
    // Create new attendance record
    const newLog = {
      empId: 'EMP003', // Represent logged in HR/User
      name: 'Ratnadeep',
      date: dateStr,
      checkIn: checkInTime,
      checkOut: timeStr,
      totalHours: `${finalHours} hrs`,
      breakHours: `${finalBreaks} hrs`,
      status: Number(finalHours) >= 8 ? 'On Time' : 'Short Hours',
      remarks: 'Clocked via web portal'
    };

    api.markAttendance(newLog)
      .then(() => {
        setStatus('Checked Out');
        setCheckInTime(null);
        setSecondsElapsed(0);
        setBreakSeconds(0);
        message.success(`Checked Out successfully at ${timeStr}`);
        loadLogs(); // Reload logs list
      })
      .catch(err => {
        message.error('Failed to log attendance check-out.');
      });
  };

  // Calendar render logic
  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayOfWeek = value.day();
    
    // Hardcoded demo indicators for June/July 2026 Calendar
    const matchedLog = logs.find(l => l.date === dateStr);
    
    if (matchedLog) {
      const isLate = matchedLog.status === 'Late';
      return <Badge status={isLate ? "warning" : "success"} text={isLate ? "Late" : "Present"} />;
    }

    if (dateStr === '2026-07-06' || dateStr === '2026-07-07') {
      return <Badge status="processing" text="Leave Approved" />;
    }

    if (dateStr === '2026-07-15') {
      return <Badge status="warning" text="Leave Pending" />;
    }

    // Weekends check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return <Badge status="default" text="Weekend" />;
    }
    
    return null;
  };

  const cellRender = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  // Filtered and searched logs table mapping
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.date.includes(searchText) || log.status.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Check-In',
      dataIndex: 'checkIn',
      key: 'checkIn',
    },
    {
      title: 'Check-Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (text) => text || <Tag color="orange">Active Shift</Tag>
    },
    {
      title: 'Working Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (text) => text || '-'
    },
    {
      title: 'Break Hours',
      dataIndex: 'breakHours',
      key: 'breakHours',
      render: (text) => text || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        if (status === 'Late') color = 'orange';
        if (status === 'Absent') color = 'red';
        if (status === 'Short Hours') color = 'blue';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (text) => <Text type="secondary" style={{ fontSize: '12px' }}>{text || 'N/A'}</Text>
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Welcome & Live Time Title */}
      <div>
        <Title level={3} style={{ margin: 0 }}>Attendance Hub</Title>
        <Text type="secondary">Monitor shift logs, manage daily attendance checks, and log break states.</Text>
      </div>

      {/* SECTION 1: Top Statistics Cards Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Present Days</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#52c41a' }}>22</Title>
            <Progress percent={90} size="small" strokeColor="#52c41a" showInfo={false} style={{ marginTop: '8px' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Absent Days</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#ff4d4f' }}>1</Title>
            <Progress percent={8} size="small" strokeColor="#ff4d4f" showInfo={false} style={{ marginTop: '8px' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Leaves Taken</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#1677ff' }}>2</Title>
            <Progress percent={16} size="small" strokeColor="#1677ff" showInfo={false} style={{ marginTop: '8px' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={4}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Late Arrivals</Text>
            <Title level={3} style={{ margin: '4px 0 0', color: '#faad14' }}>3</Title>
            <Progress percent={25} size="small" strokeColor="#faad14" showInfo={false} style={{ marginTop: '8px' }} />
          </Card>
        </Col>
        <Col xs={24} sm={24} xl={8}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>Monthly Average Attendance</Text>
                <Title level={3} style={{ margin: '4px 0 0', color: '#52c41a' }}>95.6%</Title>
              </div>
              <Progress type="circle" percent={95.6} width={50} strokeColor="#52c41a" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* SECTION 2: Dynamic Check-In Panel & Analytics */}
      <Row gutter={[16, 16]}>
        
        {/* Check-In/Out Clock In Simulator Card */}
        <Col xs={24} lg={10}>
          <Card 
            title={<Space><FieldTimeOutlined /><span>Shift Tracker Portal</span></Space>}
            bordered={false} 
            style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', height: '100%' }}
          >
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              
              {/* Dynamic Live Counter */}
              <Title level={1} style={{ fontSize: '42px', margin: '0 0 16px 0', fontFamily: 'monospace' }}>
                {status === 'Checked Out' ? '00:00:00' : formatDuration(secondsElapsed)}
              </Title>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
                <Tag color={status === 'Checked In' ? 'green' : status === 'On Break' ? 'orange' : 'default'} style={{ padding: '4px 12px', fontSize: '13px' }}>
                  Status: {status}
                </Tag>
              </div>

              {/* Working breakdown indicators */}
              <Row gutter={12} style={{ marginBottom: '32px', backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px' }}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Break Timer</Text>
                  <Text strong>{formatDuration(breakSeconds)}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>Shift Started</Text>
                  <Text strong>{checkInTime || '--:--'}</Text>
                </Col>
              </Row>

              {/* Control Action Buttons */}
              <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                {status === 'Checked Out' ? (
                  <Button 
                    type="primary" 
                    icon={<LoginOutlined />} 
                    size="large"
                    onClick={handleCheckIn}
                    style={{ borderRadius: '8px', width: '160px', height: '48px', backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Check In
                  </Button>
                ) : (
                  <>
                    <Button 
                      type="default" 
                      icon={status === 'On Break' ? <PlayCircleOutlined /> : <PauseCircleOutlined />} 
                      size="large"
                      onClick={handleBreakToggle}
                      style={{ borderRadius: '8px', width: '130px', height: '48px' }}
                    >
                      {status === 'On Break' ? 'End Break' : 'Take Break'}
                    </Button>
                    <Button 
                      type="primary" 
                      danger
                      icon={<LogoutOutlined />} 
                      size="large"
                      onClick={handleCheckOut}
                      style={{ borderRadius: '8px', width: '130px', height: '48px' }}
                    >
                      Check Out
                    </Button>
                  </>
                )}
              </Space>
            </div>
          </Card>
        </Col>

        {/* Charts: Weekly Hours Analytics (SVG rendering) */}
        <Col xs={24} lg={14}>
          <Card title="Working Hours Trend (Weekly)" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '200px', paddingBottom: '20px' }}>
              {[
                { day: 'Mon', hours: 8.2 },
                { day: 'Tue', hours: 8.5 },
                { day: 'Wed', hours: 9.0 },
                { day: 'Thu', hours: 7.8 },
                { day: 'Fri', hours: 8.0 }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48px' }}>
                  <Text strong style={{ fontSize: '11px', color: '#1677ff' }}>{item.hours}h</Text>
                  <div style={{ 
                    width: '20px', 
                    height: `${item.hours * 15}px`, // Scaled
                    backgroundColor: '#1677ff', 
                    borderRadius: '4px 4px 0 0'
                  }} />
                  <span style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '8px' }}>{item.day}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: '12px', fontSize: '12px', color: '#8c8c8c' }}>
              <span>Total worked: <strong>41.5 hrs</strong></span>
              <span>Target requirement: <strong>40.0 hrs</strong></span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* SECTION 3: Calendar View Grid */}
      <Card title="Attendance & Absence Ledger Calendar" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <div className="attendance-calendar-wrapper">
          <Calendar cellRender={cellRender} />
        </div>
      </Card>

      {/* SECTION 4: Historic Table & Search filters */}
      <Card title="Shift Log Archive" bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <Space direction="horizontal" style={{ marginBottom: '16px', width: '100%', justifyContent: 'space-between' }} wrap>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="Search dates (YYYY-MM-DD)..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, borderRadius: '6px' }}
          />
          <Space>
            <Text>Status Filter:</Text>
            <Select value={statusFilter} onChange={(val) => setStatusFilter(val)} style={{ width: 140 }}>
              <Option value="All">All Logs</Option>
              <Option value="On Time">On Time</Option>
              <Option value="Late">Late</Option>
              <Option value="Short Hours">Short Hours</Option>
            </Select>
          </Space>
        </Space>

        <Table
          dataSource={filteredLogs}
          columns={columns}
          pagination={{ pageSize: 5 }}
          size="middle"
        />
      </Card>
      
    </div>
  );
};

export default Attendance;
