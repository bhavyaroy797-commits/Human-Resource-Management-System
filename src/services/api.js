import axios from 'axios';
import { message } from 'antd';

// Set MOCK_MODE to false to connect directly to the actual Flask + MySQL backend API
const MOCK_MODE = false;

const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Create Axios Instance with credentials support for HTTP cookies/tokens
const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Request Interceptor: Attach JWT Access Token to every outgoing request
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling and session expiration redirects
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      // Handle 401 Unauthorized (invalid/expired tokens)
      if (status === 401) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        message.error('Session expired or unauthorized. Redirecting to Login...');
        // Prevent redirect loops
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      const errorMsg = error.response.data?.message || `Request failed with status ${status}`;
      return Promise.reject(new Error(errorMsg));
    } else if (error.request) {
      return Promise.reject(new Error('Network error: No response received from Flask backend server.'));
    } else {
      return Promise.reject(error);
    }
  }
);

// Exported API Methods connecting to Flask DB services
export const api = {
  // ==========================================
  // 1. Authentication Endpoints
  // ==========================================
  login: async (email, password) => {
    const res = await apiInstance.post('/auth/login', { email, password });
    const { accessToken, user } = res.data;
    
    // Save to LocalStorage
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', accessToken);
    
    return { data: { user, token: accessToken } };
  },

  signup: async (signupData) => {
    const res = await apiInstance.post('/auth/signup', {
      employeeId: signupData.employeeId,
      email: signupData.email,
      password: signupData.password,
      role: signupData.role || 'Employee'
    });
    return { data: res.data };
  },

  logout: async () => {
    const res = await apiInstance.post('/auth/logout');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    return { data: res.data };
  },

  // ==========================================
  // 2. Employee Directory Endpoints
  // ==========================================
  getEmployees: async () => {
    const res = await apiInstance.get('/employees');
    // Map response structure to align with page assumptions
    return { data: res.data.data };
  },

  getEmployeeById: async (id) => {
    const res = await apiInstance.get(`/employees/${id}`);
    return { data: res.data.data };
  },

  createEmployee: async (empData) => {
    const res = await apiInstance.post('/employees', {
      employeeId: empData.id || empData.employeeId,
      fullName: empData.name || empData.fullName,
      email: empData.email,
      phone: empData.phone,
      department: empData.department,
      designation: empData.role || empData.designation,
      salary: empData.salary || 85000,
      gender: empData.gender || 'Male',
      dateOfBirth: empData.dateOfBirth || '1995-08-20',
      joiningDate: empData.joinDate || empData.joiningDate || new Date().toISOString().split('T')[0],
      manager: empData.manager || 'HR Manager',
      workLocation: empData.workLocation || 'Mumbai HQ',
      employmentType: empData.employmentType || 'Full-Time Permanent',
      status: empData.status || 'Active'
    });
    return { data: res.data.data };
  },

  updateEmployee: async (updatedEmp) => {
    const id = updatedEmp.id || updatedEmp.employeeId;
    const res = await apiInstance.put(`/employees/${id}`, {
      fullName: updatedEmp.name || updatedEmp.fullName,
      email: updatedEmp.email,
      phone: updatedEmp.phone,
      department: updatedEmp.department,
      designation: updatedEmp.role || updatedEmp.designation,
      salary: updatedEmp.salary,
      gender: updatedEmp.gender || 'Male',
      dateOfBirth: updatedEmp.dateOfBirth || '1995-08-20',
      joiningDate: updatedEmp.joinDate || updatedEmp.joiningDate || new Date().toISOString().split('T')[0],
      manager: updatedEmp.manager || 'HR Manager',
      workLocation: updatedEmp.workLocation || 'Mumbai HQ',
      employmentType: updatedEmp.employmentType || 'Full-Time Permanent',
      status: updatedEmp.status || 'Active'
    });
    return { data: res.data.data };
  },

  deleteEmployee: async (id) => {
    const res = await apiInstance.delete(`/employees/${id}`);
    return { data: res.data };
  },

  // ==========================================
  // 3. Attendance Tracker Endpoints
  // ==========================================
  getAttendance: async () => {
    const res = await apiInstance.get('/attendance');
    return { data: res.data.data };
  },

  markAttendance: async (logData) => {
    if (logData.id || logData.logId) {
      // Check-out / Update log
      const id = logData.id || logData.logId;
      const res = await apiInstance.put(`/attendance/${id}`, {
        checkOut: logData.checkOut,
        workingHours: logData.workingHours,
        breakHours: logData.breakHours || '0.75 hrs',
        status: logData.status || 'On Time',
        remarks: logData.remarks || 'Clocked via web portal'
      });
      return { data: res.data };
    } else {
      // Check-in / Create log
      const res = await apiInstance.post('/attendance', {
        employeeId: logData.employeeId,
        name: logData.name,
        date: logData.date,
        checkIn: logData.checkIn
      });
      return { data: res.data.data };
    }
  },

  // ==========================================
  // 4. Leave Management Endpoints
  // ==========================================
  getLeaves: async () => {
    const res = await apiInstance.get('/leaves');
    return { data: res.data.data };
  },

  applyLeave: async (leaveData) => {
    const res = await apiInstance.post('/leaves', {
      employeeId: leaveData.employeeId || leaveData.empId,
      employeeName: leaveData.employeeName,
      type: leaveData.type,
      startDate: leaveData.startDate,
      endDate: leaveData.endDate,
      days: leaveData.days,
      reason: leaveData.reason,
      appliedDate: leaveData.appliedDate || new Date().toISOString().split('T')[0]
    });
    return { data: res.data.data };
  },

  updateLeaveStatus: async (id, status) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const approvedBy = currentUser.name || 'HR Manager';
    const res = await apiInstance.put(`/leaves/${id}`, {
      status,
      approvedBy
    });
    return { data: res.data };
  },

  // ==========================================
  // 5. Payroll Portal Endpoints
  // ==========================================
  getPayroll: async () => {
    const res = await apiInstance.get('/payroll');
    return { data: res.data.data };
  },

  downloadPayslip: async (employeeId, month) => {
    // Triggers direct browser download by passing JWT as cookie context
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/payroll/download/${employeeId}?month=${encodeURIComponent(month)}&token=${token}`;
    window.open(url, '_blank');
    return { data: { success: true } };
  },

  // ==========================================
  // 6. Profile Summary
  // ==========================================
  getProfile: async () => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const empId = parsed.id || parsed.employeeId;
        if (empId) {
          const res = await apiInstance.get(`/employees/${empId}`);
          return { data: res.data.data };
        }
      } catch (e) {
        console.error('Profile synchronization check failed:', e);
      }
    }
    return { data: storedUser ? JSON.parse(storedUser) : null };
  },

  updateProfile: async (profileData) => {
    const id = profileData.id || profileData.employeeId;
    const res = await apiInstance.put(`/employees/${id}`, {
      fullName: profileData.name || profileData.fullName,
      email: profileData.email,
      phone: profileData.phone,
      department: profileData.department,
      designation: profileData.role || profileData.designation,
      salary: profileData.salary,
      gender: profileData.gender || 'Male',
      dateOfBirth: profileData.dateOfBirth || profileData.dob || '1995-08-20',
      joiningDate: profileData.joinDate || profileData.joiningDate || new Date().toISOString().split('T')[0],
      manager: profileData.manager || 'HR Manager',
      workLocation: profileData.workLocation || 'Mumbai HQ',
      employmentType: profileData.employmentType || 'Full-Time Permanent',
      status: profileData.status || 'Active'
    });

    // Synchronize local storage session metadata
    const currentSession = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const updatedSession = {
      ...currentSession,
      name: profileData.name || profileData.fullName || currentSession.name,
      role: profileData.role || profileData.designation || currentSession.role,
      email: profileData.email || currentSession.email
    };
    localStorage.setItem('currentUser', JSON.stringify(updatedSession));

    return { data: res.data.data };
  },

  // ==========================================
  // 7. Dashboard Analytics Endpoint (Client-side Aggregator)
  // ==========================================
  getDashboardStats: async () => {
    // Queries employee lists, attendance records, and leave request tables in parallel
    const empReq = apiInstance.get('/employees');
    const leaveReq = apiInstance.get('/leaves');
    const attReq = apiInstance.get('/attendance');
    
    const [empRes, leaveRes, attRes] = await Promise.all([empReq, leaveReq, attReq]);
    
    return {
      data: {
        employees: empRes.data.data || [],
        leaves: leaveRes.data.data || [],
        attendance: attRes.data.data || []
      }
    };
  }
};
