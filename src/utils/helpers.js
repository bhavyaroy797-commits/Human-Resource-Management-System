// HRMS Helper Utility Library (Indian Localization Context)
// Built using JavaScript ES6 modules with no external dependencies

// ==========================================
// 1. DATE HELPERS
// ==========================================

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatMonth = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
};

export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const getCurrentTime = () => {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

// ==========================================
// 2. CURRENCY HELPERS
// ==========================================

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const calculateSalary = (annualCTC) => {
  const monthlyGross = Math.round(annualCTC / 12);
  const basic = Math.round(monthlyGross * 0.50); // 50% basic pay
  const hra = Math.round(monthlyGross * 0.20);  // 20% HRA
  const allowances = monthlyGross - (basic + hra); // Special allowances
  return { basic, hra, allowances, monthlyGross };
};

// ==========================================
// 3. ATTENDANCE HELPERS
// ==========================================

export const calculateAttendancePercentage = (presentDays, totalWorkingDays) => {
  if (!totalWorkingDays || totalWorkingDays === 0) return 0;
  return Number(((presentDays / totalWorkingDays) * 100).toFixed(1));
};

export const calculateWorkingHours = (checkInStr, checkOutStr) => {
  if (!checkInStr || !checkOutStr || checkInStr === '-' || checkOutStr === '-') return 0;
  
  // Helper to parse time string format (e.g. "09:02 AM")
  const parseTime = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes; // returns minutes
  };

  try {
    const inMin = parseTime(checkInStr);
    const outMin = parseTime(checkOutStr);
    const diff = outMin - inMin - 45; // Subtract 45 minutes flat break
    return Number((Math.max(0, diff) / 60).toFixed(2)); // in decimal hours
  } catch (err) {
    return 0;
  }
};

export const calculateOvertime = (workingHours) => {
  const standardHours = 8.0;
  if (workingHours <= standardHours) return 0;
  return Number((workingHours - standardHours).toFixed(2));
};

// ==========================================
// 4. LEAVE HELPERS
// ==========================================

export const calculateRemainingLeave = (maxLeaves, leavesUsed) => {
  return Math.max(0, maxLeaves - leavesUsed);
};

export const calculateLeaveDays = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// ==========================================
// 5. EMPLOYEE HELPERS
// ==========================================

export const getEmployeeInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export const getEmployeeFullName = (emp) => {
  if (!emp) return '';
  return emp.fullName || emp.name || '';
};

export const getEmployeeStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'green';
    case 'onboarding': return 'orange';
    case 'suspended': return 'red';
    case 'terminated': return 'purple';
    default: return 'default';
  }
};

// ==========================================
// 6. PAYROLL HELPERS
// ==========================================

export const calculateTax = (grossSalary) => {
  // Simple TDS Tax calculations based on Indian slabs (e.g. 10% flat monthly TDS)
  return Math.round(grossSalary * 0.10);
};

export const calculateNetSalary = (grossSalary, pfDeduction, taxTDS, otherDeductions = 0) => {
  const totalDeductions = pfDeduction + taxTDS + otherDeductions;
  return Math.max(0, grossSalary - totalDeductions);
};

// ==========================================
// 7. VALIDATION HELPERS
// ==========================================

export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone) => {
  // Indian phone validation (supports +91 or standard 10 digit cell phone)
  const re = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
  return re.test(phone);
};

export const validatePassword = (password) => {
  // Minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special char
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return minLength && hasUpper && hasLower && hasDigit && hasSpecial;
};

// ==========================================
// 8. SEARCH & FILTER HELPERS
// ==========================================

export const searchEmployees = (employees, query) => {
  if (!query) return employees;
  const lowQuery = query.toLowerCase();
  return employees.filter(emp => 
    emp.name?.toLowerCase().includes(lowQuery) || 
    emp.id?.toLowerCase().includes(lowQuery) || 
    emp.email?.toLowerCase().includes(lowQuery) ||
    emp.role?.toLowerCase().includes(lowQuery)
  );
};

export const filterEmployeesByDepartment = (employees, dept) => {
  if (!dept || dept === 'All') return employees;
  return employees.filter(emp => emp.department === dept);
};

export const filterEmployeesByRole = (employees, role) => {
  if (!role || role === 'All') return employees;
  return employees.filter(emp => emp.role === role);
};

export const sortEmployees = (employees, key, order = 'asc') => {
  return [...employees].sort((a, b) => {
    const valA = a[key] !== undefined ? a[key] : '';
    const valB = b[key] !== undefined ? b[key] : '';
    
    if (typeof valA === 'string') {
      return order === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }
    return order === 'asc' ? valA - valB : valB - valA;
  });
};

// ==========================================
// 9. DASHBOARD HELPERS
// ==========================================

export const calculateDashboardStats = (employees = [], leaves = [], attendance = []) => {
  const total = employees.length;
  const active = employees.filter(e => e.status === 'Active').length;
  const present = attendance.filter(a => a.status === 'On Time' || a.status === 'Late').length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  
  const totalCTC = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const monthlyPayroll = Math.round(totalCTC / 12);
  
  const attendanceRate = total > 0 ? Number(((present / total) * 100).toFixed(1)) : 100;
  
  return {
    total,
    active,
    present,
    pendingLeaves,
    monthlyPayroll,
    attendanceRate
  };
};

export const generateChartData = (data, keyLabel, keyValue) => {
  return data.map(item => ({
    label: item[keyLabel],
    value: item[keyValue]
  }));
};

// ==========================================
// 10. GENERAL HELPERS
// ==========================================

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const generateUniqueId = (prefix = 'ID') => {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randNum}`;
};

export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalizeWords = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
