import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

// Ant Design & Custom Design Styles
import 'antd/dist/reset.css'; // Ant Design Reset CSS
import './styles/variables.css';
import './styles/global.css';

/**
 * Application Entry Point.
 * Mounts the React application inside the DOM root and injects the routing context.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 
      FUTURE EXTENSIBILITY WRAPPERS
      Place your provider elements here when integrating Flask/Auth/Notification backends:
      
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
    */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* 
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    */}
  </React.StrictMode>
);
