import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Layout structures
import AuthLayout from '../layouts/AuthLayout.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import Loader from '../components/Loader/Loader.jsx';

// Lazy load Page Components to optimize performance bundle splits
const Login = lazy(() => import('../pages/Auth/Login.jsx'));
const Signup = lazy(() => import('../pages/Auth/Signup.jsx'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard.jsx'));
const Profile = lazy(() => import('../pages/Profile/Profile.jsx'));
const Attendance = lazy(() => import('../pages/Attendance/Attendance.jsx'));
const Leave = lazy(() => import('../pages/Leave/Leave.jsx'));
const Payroll = lazy(() => import('../pages/Payroll/Payroll.jsx'));
const Employees = lazy(() => import('../pages/Employees/Employees.jsx'));
const NotFound = lazy(() => import('../pages/NotFound.jsx'));

/**
 * Main Application Routing Component.
 * Registers public authentication screens and protected internal dashboards.
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader tip="Loading page components..." />}>
      <Routes>
        
        {/* 1. Public Authentication Routes (uses AuthLayout) */}
        <Route element={<AuthLayout />}>
          {/* Default landing redirect rules */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* 2. Protected HRMS Portal Routes (uses MainLayout & ProtectedRoute) */}
        <Route 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/employees" element={<Employees />} />
        </Route>

        {/* 3. Fallback Catch-all Route (404 Page Not Found) */}
        <Route path="*" element={<NotFound />} />
        
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
