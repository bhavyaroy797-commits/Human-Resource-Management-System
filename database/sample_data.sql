--run this after schema.sql
USE hrms_db;

--users(passwords are bcrypt hashes of "Password@123")

INSERT INTO users
    (employee_id, full_name, email, password_hash, role, department, job_title, phone, address, date_joined, is_active, email_verified)
VALUES
--admin
('EMP001', 'Sarah Johnson',   'sarah.johnson@hrms.com',   '$2b$12$KIX9FwVDzNhW3v1A7Lfq2eYBqPz0H2mT1N5C3vRdMeWkJhGnPsXoK', 'admin',    'Human Resources', 'HR Manager',          '03001234567', '12 Admin Lane, New Town',    '2023-01-10', 1, 1),
--HR Officer
('EMP002', 'Rahul',      'rahul@hrms.com',      '$2b$12$KIX9FwVDzNhW3v1A7Lfq2eYBqPz0H2mT1N5C3vRdMeWkJhGnPsXoK', 'hr',       'Human Resources', 'HR Officer',          '03111234567', '45 Officer St, Barasat',     '2023-03-15', 1, 1),
--employees
('EMP003', 'Ayesha Malik',    'ayesha.malik@hrms.com',    '$2b$12$KIX9FwVDzNhW3v1A7Lfq2eYBqPz0H2mT1N5C3vRdMeWkJhGnPsXoK', 'employee', 'Engineering',     'Software Engineer',   '03211234567', '7 Tech Park, Salt Lake',    '2023-06-01', 1, 1),
('EMP004', 'Bidesh Saha',     'bidesh.saha@hrms.com',     '$2b$12$KIX9FwVDzNhW3v1A7Lfq2eYBqPz0H2mT1N5C3vRdMeWkJhGnPsXoK', 'employee', 'Engineering',     'Junior Developer',    '03311234567', '22 Code Ave, New Town',      '2024-01-20', 1, 1),
('EMP005', 'Fatima Zahra',    'fatima.zahra@hrms.com',    '$2b$12$KIX9FwVDzNhW3v1A7Lfq2eYBqPz0H2mT1N5C3vRdMeWkJhGnPsXoK', 'employee', 'Finance',         'Accountant',          '03411234567', '99 Finance Rd, Barasat',     '2023-09-05', 1, 1),
('EMP006', 'Ujwal Kumar',     'ujwal.kumar@hrms.com',     '$2b$12$KIX9FwVDzNhW3v1A7Lfq2eYBqPz0H2mT1N5C3vRdMeWkJhGnPsXoK', 'employee', 'Marketing',       'Marketing Executive', '03511234567', '3 Brand Blvd, Salt Lake',   '2024-03-10', 1, 1),
('EMP007', 'Zara Hill',     'zara.hill@hrms.com',     '$2b$12$KIX9FwVDzNhW3v1A7Lfq2eYBqPz0H2mT1N5C3vRdMeWkJhGnPsXoK', 'employee', 'Engineering',     'QA Engineer',         '03611234567', '58 Quality St, New Town',   '2023-11-22', 1, 1);

--attendance(June 2025-last 10 working days for 3 employees)

INSERT INTO attendance (user_id, attendance_date, check_in, check_out, status, remarks) VALUES
--Ayesha Malik (EMP003->user_id 3)
(3, '2025-06-02', '08:58:00', '17:05:00', 'present',  NULL),
(3, '2025-06-03', '09:10:00', '17:00:00', 'present',  NULL),
(3, '2025-06-04', '09:00:00', '13:00:00', 'half-day', 'Doctor appointment'),
(3, '2025-06-05', '08:55:00', '17:02:00', 'present',  NULL),
(3, '2025-06-06', NULL,       NULL,       'absent',   'Sick'),

(3, '2025-06-09', '09:05:00', '17:10:00', 'present',  NULL),
(3, '2025-06-10', '08:50:00', '17:00:00', 'present',  NULL),
(3, '2025-06-11', NULL,       NULL,       'leave',    'Annual leave approved'),
(3, '2025-06-12', NULL,       NULL,       'leave',    'Annual leave approved'),
(3, '2025-06-13', '09:00:00', '17:00:00', 'present',  NULL),

--Bidesh Saha (EMP004->user_id 4)
(4, '2025-06-02', '09:20:00', '17:30:00', 'present',  'Late arrival'),
(4, '2025-06-03', '09:00:00', '17:00:00', 'present',  NULL),
(4, '2025-06-04', '09:00:00', '17:00:00', 'present',  NULL),
(4, '2025-06-05', NULL,       NULL,       'absent',   NULL),
(4, '2025-06-06', '09:05:00', '17:00:00', 'present',  NULL),
(4, '2025-06-09', '08:55:00', '17:00:00', 'present',  NULL),
(4, '2025-06-10', '09:00:00', '17:05:00', 'present',  NULL),
(4, '2025-06-11', '09:10:00', '17:00:00', 'present',  NULL),
(4, '2025-06-12', '09:00:00', '13:00:00', 'half-day', 'Personal errand'),
(4, '2025-06-13', '09:00:00', '17:00:00', 'present',  NULL),

--Fatima Zahra (EMP005->user_id 5)
(5, '2025-06-02', '08:45:00', '17:00:00', 'present',  NULL),
(5, '2025-06-03', '08:50:00', '17:00:00', 'present',  NULL),
(5, '2025-06-04', '09:00:00', '17:00:00', 'present',  NULL),
(5, '2025-06-05', '09:00:00', '17:00:00', 'present',  NULL),
(5, '2025-06-06', '08:55:00', '17:05:00', 'present',  NULL),
--'sick' is not in attendance ENUM; leave was approved->status='leave'
(5, '2025-06-09', NULL,       NULL,       'leave',    'Approved sick leave – Flu'),
(5, '2025-06-10', NULL,       NULL,       'absent',   'Sick – unplanned absence'),
(5, '2025-06-11', '09:00:00', '17:00:00', 'present',  NULL),
(5, '2025-06-12', '09:05:00', '17:00:00', 'present',  NULL),
(5, '2025-06-13', '08:58:00', '17:00:00', 'present',  NULL);

--leaves..

INSERT INTO leaves
    (user_id, leave_type, start_date, end_date, total_days, reason, status, reviewed_by, admin_comment, applied_on, reviewed_on)
VALUES
--approved leave-Ayesha
(3, 'paid',   '2025-06-11', '2025-06-12', 2, 'Family function out of city',
 'approved', 1, 'Approved. Enjoy your time.', '2025-06-05 10:00:00', '2025-06-06 09:00:00'),

--pending leave-Bidesh
(4, 'sick',   '2025-06-20', '2025-06-20', 1, 'Medical procedure follow-up',
 'pending',  NULL, NULL, '2025-06-13 11:30:00', NULL),

--rejected leave-Ujwal
(6, 'unpaid', '2025-06-16', '2025-06-18', 3, 'Personal travel',
 'rejected', 1, 'Staffing shortage during this period.', '2025-06-10 14:00:00', '2025-06-11 10:30:00'),

--approved sick leave-Fatima
(5, 'sick',   '2025-06-09', '2025-06-10', 2, 'Flu recovery',
 'approved', 2, 'Get well soon.', '2025-06-09 08:00:00', '2025-06-09 08:45:00'),

--pending-Zara
(7, 'paid',   '2025-07-01', '2025-07-05', 5, 'Annual vacation',
 'pending',  NULL, NULL, '2025-06-13 09:00:00', NULL);

--payroll(June 2025)

INSERT INTO payroll
    (user_id, pay_month, pay_year, basic_salary, allowances, deductions, pay_status, payment_date, created_by, notes)
VALUES
--Sarah Johnson (Admin)
(1, 6, 2025, 150000.00, 30000.00, 18000.00, 'paid', '2025-06-30', 1, 'June salary processed'),
--Rahul (HR)
(2, 6, 2025, 100000.00, 20000.00, 12000.00, 'paid', '2025-06-30', 1, 'June salary processed'),
--Ayesha Malik
(3, 6, 2025,  90000.00, 15000.00, 10500.00, 'paid', '2025-06-30', 1, 'June salary processed'),
--Bidesh Saha
(4, 6, 2025,  65000.00, 10000.00,  7500.00, 'paid', '2025-06-30', 1, 'June salary processed'),
--Fatima Zahra
(5, 6, 2025,  80000.00, 12000.00,  9200.00, 'paid', '2025-06-30', 1, 'June salary processed'),
--Ujwal Kumar
(6, 6, 2025,  70000.00, 10000.00,  8000.00, 'paid', '2025-06-30', 1, 'June salary processed'),
--Zara Hill
(7, 6, 2025,  85000.00, 13000.00,  9800.00, 'paid', '2025-06-30', 1, 'June salary processed');
