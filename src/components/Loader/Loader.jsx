import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const Loader = ({ tip = "Loading Portal..." }) => {
  const antIcon = (
    <LoadingOutlined 
      style={{ 
        fontSize: '48px', 
        color: '#1677ff',
        textShadow: '0 0 10px rgba(22, 119, 255, 0.2)'
      }} 
      spin 
    />
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(245, 247, 250, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      transition: 'all 0.3s ease-in-out',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Spin indicator={antIcon} />
        <span style={{ 
          fontSize: '15px', 
          fontWeight: 600, 
          color: '#1F2937',
          letterSpacing: '0.5px' 
        }}>
          {tip}
        </span>
      </div>
    </div>
  );
};

export default Loader;
