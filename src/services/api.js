import axios from 'axios';
import { message } from 'antd';
import { 
  initialEmployees, 
  initialLeaveRequests, 
  initialAttendanceLogs 
} from '../data/dummyData.js';

// Toggle this to false to connect to the actual Flask + MySQL backend API
const MOCK_MODE = true;

const API_BASE_URL = 'http://localhost:5000/api';

// Create Axios Instance
const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Request Interceptor: Attach JWT Token & Log Requests
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

// Response Interceptor: Centralized Status & Auth Redirects
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        message.error('Session expired. Redirecting to Login...');
        window.location.href = '/login';
      }
      
      const errorMsg = error.response.data?.message || `Request failed with status ${status}`;
      return Promise.reject(new Error(errorMsg));
    } else if (error.request) {
      return Promise.reject(new Error('Network error: No response received from server.'));
    } else {
      return Promise.reject(error);
    }
  }
);

// LocalStorage Database Initializer for Mock Mode
const initializeMockDB = () => {
  if (!localStorage.getItem('employeesList')) {
    localStorage.setItem('employeesList', JSON.stringify(initialEmployees));
  }
  if (!localStorage.getItem('leaveRequestsList')) {
    localStorage.setItem('leaveRequestsList', JSON.stringify(initialLeaveRequests));
  }
  if (!localStorage.getItem('attendanceLogsList')) {
    localStorage.setItem('attendanceLogsList', JSON.stringify(initialAttendanceLogs));
  }
};
initializeMockDB();

// Simulated API Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Exported API Methods
export const api = {
  // 1. Authentication
  login: async (email, password) => {
    if (MOCK_MODE) {
      await delay(800);
      const isAdmin = email === 'admin@hrms.com';
      const mockUser = {
        name: isAdmin ? 'Ratnadeep' : 'John Doe',
        role: isAdmin ? 'HR Manager' : 'Software Engineer',
        email: email
      };
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock_jwt_token_payload');
      return { data: { user: mockUser, token: 'mock_jwt_token_payload' } };
    }
    return apiInstance.post('/auth/login', { email, password });
  },

  signup: async (signupData) => {
    if (MOCK_MODE) {
      await delay(1000);
      const currentEmployees = JSON.parse(localStorage.getItem('employeesList')) || [];
      const newEmp = {
        key: signupData.employeeId,
        id: signupData.employeeId,
        name: signupData.fullName,
        email: signupData.email,
        role: signupData.role === 'Admin' ? 'HR Manager' : signupData.designation,
        department: signupData.department,
        status: 'Onboarding',
        joinDate: new Date().toISOString().split('T')[0],
        salary: 75000,
        phone: signupData.phone
      };
      currentEmployees.push(newEmp);
      localStorage.setItem('employeesList', JSON.stringify(currentEmployees));
      return { data: { success: true, employee: newEmp } };
    }
    return apiInstance.post('/auth/signup', signupData);
  },

  logout: async () => {
    if (MOCK_MODE) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      return { data: { success: true } };
    }
    return apiInstance.post('/auth/logout');
  },

  // 2. Employee Directory
  getEmployees: async () => {
    if (MOCK_MODE) {
      await delay(200);
      const list = JSON.parse(localStorage.getItem('employeesList')) || [];
      return { data: list };
    }
    return apiInstance.get('/employees');
  },

  getEmployeeById: async (id) => {
    if (MOCK_MODE) {
      const list = JSON.parse(localStorage.getItem('employeesList')) || [];
      const emp = list.find(e => e.id === id);
      return { data: emp || null };
    }
    return apiInstance.get(`/employees/${id}`);
  },

  createEmployee: async (empData) => {
    if (MOCK_MODE) {
      await delay(400);
      const list = JSON.parse(localStorage.getItem('employeesList')) || [];
      const newEmp = { ...empData, key: empData.id || `EMP0${list.length + 1}` };
      list.push(newEmp);
      localStorage.setItem('employeesList', JSON.stringify(list));
      return { data: newEmp };
    }
    return apiInstance.post('/employees', empData);
  },

  updateEmployee: async (updatedEmp) => {
    if (MOCK_MODE) {
      await delay(300);
      const list = JSON.parse(localStorage.getItem('employeesList')) || [];
      const index = list.findIndex(emp => emp.id === updatedEmp.id);
      if (index !== -1) {
        list[index] = updatedEmp;
        localStorage.setItem('employeesList', JSON.stringify(list));
        return { data: updatedEmp };
      }
      throw new Error('Employee not found in local state.');
    }
    return apiInstance.put(`/employees/${updatedEmp.id}`, updatedEmp);
  },

  deleteEmployee: async (id) => {
    if (MOCK_MODE) {
      await delay(300);
      const list = JSON.parse(localStorage.getItem('employeesList')) || [];
      const filtered = list.filter(emp => emp.id !== id);
      localStorage.setItem('employeesList', JSON.stringify(filtered));
      return { data: { success: true } };
    }
    return apiInstance.delete(`/employees/${id}`);
  },

  // 3. Attendance Tracker
  getAttendance: async () => {
    if (MOCK_MODE) {
      await delay(200);
      const logs = JSON.parse(localStorage.getItem('attendanceLogsList')) || [];
      return { data: logs };
    }
    return apiInstance.get('/attendance');
  },

  markAttendance: async (logData) => {
    if (MOCK_MODE) {
      await delay(400);
      const list = JSON.parse(localStorage.getItem('attendanceLogsList')) || [];
      const newLog = { ...logData, key: `AT0${list.length + 1}` };
      list.push(newLog);
      localStorage.setItem('attendanceLogsList', JSON.stringify(list));
      return { data: newLog };
    }
    return apiInstance.post('/attendance', logData);
  },

  // 4. Leave Management
  getLeaves: async () => {
    if (MOCK_MODE) {
      await delay(200);
      const leaves = JSON.parse(localStorage.getItem('leaveRequestsList')) || [];
      return { data: leaves };
    }
    return apiInstance.get('/leaves');
  },

  applyLeave: async (leaveData) => {
    if (MOCK_MODE) {
      await delay(400);
      const list = JSON.parse(localStorage.getItem('leaveRequestsList')) || [];
      const newReq = { 
        ...leaveData, 
        id: `LV-${100 + list.length + 1}`,
        key: `LV-${100 + list.length + 1}`
      };
      list.push(newReq);
      localStorage.setItem('leaveRequestsList', JSON.stringify(list));
      return { data: newReq };
    }
    return apiInstance.post('/leaves', leaveData);
  },

  updateLeaveStatus: async (id, status) => {
    if (MOCK_MODE) {
      await delay(300);
      const list = JSON.parse(localStorage.getItem('leaveRequestsList')) || [];
      const index = list.findIndex(req => req.id === id);
      if (index !== -1) {
        list[index].status = status;
        localStorage.setItem('leaveRequestsList', JSON.stringify(list));
        return { data: list[index] };
      }
      throw new Error('Leave request not found.');
    }
    return apiInstance.patch(`/leaves/${id}`, { status });
  },

  // 5. Payroll portal
  getPayroll: async () => {
    if (MOCK_MODE) {
      return { data: { success: true } };
    }
    return apiInstance.get('/payroll');
  },

  downloadPayslip: async (month) => {
    if (MOCK_MODE) {
      return { data: { success: true } };
    }
    return apiInstance.get(`/payroll/download/${month}`, { responseType: 'blob' });
  },

  // 6. Profile Summary
  getProfile: async () => {
    if (MOCK_MODE) {
      const storedUser = localStorage.getItem('currentUser');
      return { data: storedUser ? JSON.parse(storedUser) : null };
    }
    return apiInstance.get('/profile');
  },

  updateProfile: async (profileData) => {
    if (MOCK_MODE) {
      return api.updateEmployee(profileData);
    }
    return apiInstance.put('/profile', profileData);
  },

  // 7. Dashboard analytics
  getDashboardStats: async () => {
    if (MOCK_MODE) {
      const employees = api.getEmployees();
      const leaves = api.getLeaves();
      const attendance = api.getAttendance();
      return {
        data: {
          employees: (await employees).data,
          leaves: (await leaves).data,
          attendance: (await attendance).data
        }
      };
    }
    return apiInstance.get('/dashboard/stats');
  }
};
