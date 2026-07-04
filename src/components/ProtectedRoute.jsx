import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check both authentication state flag and active JWT token presence
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const token = localStorage.getItem('token');

  if (!isAuthenticated || !token) {
    // Redirect to login page if unauthorized or token is missing
    return <Navigate to="/login" replace />;
  }

  // Render children (MainLayout -> page subroutes) if authenticated
  return children;
};

export default ProtectedRoute;
