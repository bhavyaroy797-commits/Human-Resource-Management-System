import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme, Button } from 'antd';
import AppRoutes from './routes/AppRoutes.jsx';

// Design System & Custom Global Styles
import './styles/variables.css';
import './styles/global.css';

/**
 * Clean Error Boundary Fallback component to handle React crashes gracefully.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: '#F5F7FA',
          padding: '24px',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ color: '#ff4d4f', marginBottom: '8px' }}>Application Error</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>Something went wrong while rendering this page.</p>
          <Button type="primary" onClick={() => window.location.reload()} style={{ borderRadius: '6px' }}>
            Refresh Portal
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Ant Design ConfigProvider Theme Settings Configuration
 */
const hrmsThemeConfig = {
  token: {
    // Primary Brand Color
    colorPrimary: '#1677FF',
    colorInfo: '#1677FF',
    
    // Border Radius Scale
    borderRadius: 8,
    
    // Typography Settings
    fontFamily: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: 14,
    colorText: '#1F2937',
  },
  components: {
    // Button Configurations
    Button: {
      controlHeight: 38,
      borderRadius: 6,
      fontWeight: 600,
      colorPrimaryHover: '#4096FF',
    },
    
    // Card Configurations
    Card: {
      borderRadiusLG: 12,
      boxShadowCard: '0 4px 20px rgba(0, 0, 0, 0.04)',
    },
    
    // Form & Input Configurations
    Form: {
      labelColor: '#1F2937',
      labelFontSize: 13,
      itemMarginBottom: 16,
    },
    Input: {
      controlHeight: 38,
      borderRadius: 6,
    },
    Select: {
      controlHeight: 38,
      borderRadius: 6,
    },
    
    // Table Configurations
    Table: {
      borderRadius: 8,
      headerBg: '#fafafa',
      headerColor: '#1F2937',
      headerFontWeight: 600,
      rowHoverBg: '#f5f5f5',
    }
  }
};

/**
 * Root Application Component.
 * Sets up custom Ant Design styling tokens and dynamic dark theme toggling.
 */
const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Monitor simulated theme mode changes (Light / Dark)
  useEffect(() => {
    const handleThemeCheck = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(currentTheme === 'dark');
    };

    handleThemeCheck();
    const themeSyncInterval = setInterval(handleThemeCheck, 1000);

    return () => {
      clearInterval(themeSyncInterval);
    };
  }, []);

  return (
    /* 
      Future Provider Wrappers:
      <AuthProvider>
        <ThemeProvider>
    */
    <ConfigProvider
      theme={{
        // Swaps Ant Design V5 light/dark algorithm on the fly
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        ...hrmsThemeConfig
      }}
    >
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </ConfigProvider>
    /* 
        </ThemeProvider>
      </AuthProvider>
    */
  );
};

export default App;
