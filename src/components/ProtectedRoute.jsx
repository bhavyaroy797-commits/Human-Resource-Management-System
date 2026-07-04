import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Read simulated authentication state from LocalStorage
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    // Redirect to login page if unauthorized
    return <Navigate to="/login" replace />;
  }

  // Render children (MainLayout -> page subroutes) if authenticated
  return children;
};

export default ProtectedRoute;
