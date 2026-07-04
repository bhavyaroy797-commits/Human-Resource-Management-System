import React from 'react';
import { Card, Statistic, Typography } from 'antd';
import './DashboardCard.css'; // Let's check if they want a separate CSS, we can write it or make inline styles. Let's make inline styles for simplicity, or write a CSS file if needed. But inline styles are self-contained. Let's use clean styles.

const { Text } = Typography;

const DashboardCard = ({ title, value, icon, color, trend, trendType }) => {
  return (
    <Card
      bordered={false}
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        background: 'var(--card-bg, #ffffff)',
        overflow: 'hidden',
        position: 'relative'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Statistic
            title={
              <span style={{ color: '#8c8c8c', fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                {title}
              </span>
            }
            value={value}
            valueStyle={{ fontSize: '28px', fontWeight: 700, color: '#141414' }}
          />
          {trend && (
            <div style={{ marginTop: '8px' }}>
              <span style={{ 
                color: trendType === 'up' ? '#52c41a' : trendType === 'down' ? '#f5222d' : '#8c8c8c', 
                fontWeight: 600,
                fontSize: '12px',
                background: trendType === 'up' ? '#f6ffed' : trendType === 'down' ? '#fff1f0' : '#f5f5f5',
                padding: '2px 8px',
                borderRadius: '4px',
                marginRight: '6px'
              }}>
                {trend}
              </span>
              <Text type="secondary" style={{ fontSize: '11px' }}>vs last month</Text>
            </div>
          )}
        </div>
        <div 
          style={{ 
            backgroundColor: color + '15', // 15 is hex opacity (approx 8%)
            color: color,
            padding: '12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px'
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: '4px', 
        backgroundColor: color 
      }} />
    </Card>
  );
};

export default DashboardCard;
