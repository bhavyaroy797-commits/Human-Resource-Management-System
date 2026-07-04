USE hrms_db;

--table: users


--create-Register a new employee
INSERT INTO users
    (employee_id, full_name, email, password_hash, role, department, job_title, phone, address, date_joined)
VALUES
    ('EMP008', 'Naina Singh', 'naina.singh@hrms.com',
     '$2b$12$KIX9FwVDzNhW3v1A7Lfq2eYBqPz0H2mT1N5C3vRdMeWkJhGnPsXoK',
     'employee', 'Engineering', 'Backend Developer', '03711234567',
     '10 Server St, New Town', '2025-07-01');

--read-Get all active employees (admin view)
SELECT
    user_id, employee_id, full_name, email, role,
    department, job_title, phone, date_joined, is_active
FROM users
WHERE is_active = 1
ORDER BY date_joined DESC;

--read-Get a single employee profile by employee_id
SELECT
    user_id, employee_id, full_name, email, role,
    department, job_title, phone, address, profile_picture,
    date_joined, email_verified
FROM users
WHERE employee_id = 'EMP003';

-- read—Login lookup (email + verify role)
SELECT user_id, full_name, email, password_hash, role, is_active, email_verified
FROM users
WHERE email = 'ayesha.malik@hrms.com';

--updaate-Employee edits own limited fields (phone, address, profile_picture)
UPDATE users
SET
    phone   = '03299998888',
    address = '15 New Avenue, Salt Lake'
WHERE user_id = 3;

--update-Admin edits all employee fields
UPDATE users
SET
    full_name  = 'Ayesha Malik Dey',
    department = 'Engineering',
    job_title  = 'Senior Software Engineer'
WHERE user_id = 3;

--update-Deactivate / soft-delete an employee
UPDATE users
SET is_active = 0
WHERE employee_id = 'EMP008';

--delete-Hard delete (use only when absolutely needed)
DELETE FROM users WHERE employee_id = 'EMP008';

--table: attendance

--create-Employee checks in
INSERT INTO attendance (user_id, attendance_date, check_in, status)
VALUES (3, CURDATE(), CURTIME(), 'present')
ON DUPLICATE KEY UPDATE
    check_in = VALUES(check_in),
    status   = VALUES(status);

-- create-Employee checks out
UPDATE attendance
SET check_out = CURTIME()
WHERE user_id = 3 AND attendance_date = CURDATE();

--create-Admin manually marks attendance
INSERT INTO attendance
    (user_id, attendance_date, check_in, check_out, status, remarks, recorded_by)
VALUES
    (4, '2025-06-16', '09:00:00', '17:00:00', 'present', 'Manually added by admin', 1)
ON DUPLICATE KEY UPDATE
    check_in    = VALUES(check_in),
    check_out   = VALUES(check_out),
    status      = VALUES(status),
    remarks     = VALUES(remarks),
    recorded_by = VALUES(recorded_by);

--read-Employee views own attendance for current month
SELECT
    attendance_date,
    check_in,
    check_out,
    status,
    remarks,
    TIMEDIFF(check_out, check_in) AS hours_worked
FROM attendance
WHERE user_id = 3
  AND MONTH(attendance_date) = MONTH(CURDATE())
  AND YEAR(attendance_date)  = YEAR(CURDATE())
ORDER BY attendance_date ASC;

--read-Weekly view for one employee
SELECT
    attendance_date,
    DAYNAME(attendance_date) AS day_name,
    check_in, check_out, status
FROM attendance
WHERE user_id = 3
  AND attendance_date BETWEEN
      DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
      AND DATE_ADD(CURDATE(), INTERVAL (6 - WEEKDAY(CURDATE())) DAY)
ORDER BY attendance_date;

-- read-Admin views all employees' attendance for a specific date
SELECT
    u.employee_id,
    u.full_name,
    u.department,
    a.check_in,
    a.check_out,
    a.status,
    a.remarks
FROM attendance a
JOIN users u ON u.user_id = a.user_id
WHERE a.attendance_date = '2025-06-13'
ORDER BY u.department, u.full_name;

-- read-Monthly attendance summary per employee (admin report)
SELECT
    u.employee_id,
    u.full_name,
    COUNT(CASE WHEN a.status = 'present'  THEN 1 END) AS present_days,
    COUNT(CASE WHEN a.status = 'absent'   THEN 1 END) AS absent_days,
    COUNT(CASE WHEN a.status = 'half-day' THEN 1 END) AS half_days,
    COUNT(CASE WHEN a.status = 'leave'    THEN 1 END) AS on_leave_days
FROM attendance a
JOIN users u ON u.user_id = a.user_id
WHERE MONTH(a.attendance_date) = 6
  AND YEAR(a.attendance_date)  = 2025
GROUP BY u.user_id, u.employee_id, u.full_name
ORDER BY u.full_name;

--update-Admin corrects an attendance status
UPDATE attendance
SET status  = 'present',
    remarks = 'Corrected by admin — was wrongly marked absent'
WHERE user_id = 4 AND attendance_date = '2025-06-05';

--delete-Remove a wrong attendance entry
DELETE FROM attendance
WHERE user_id = 4 AND attendance_date = '2025-06-16';

--table: leaves

--create-Employee submits a leave request
INSERT INTO leaves
    (user_id, leave_type, start_date, end_date, total_days, reason)
VALUES
    (6, 'paid', '2025-07-14', '2025-07-15', 2, 'Festival holiday travel');

-- Compute total_days automatically (for future use in app logic)
-- total_days = DATEDIFF(end_date, start_date) + 1

-- read-Employee views own leave history
SELECT
    leave_id, leave_type, start_date, end_date,
    total_days, reason, status, admin_comment, applied_on
FROM leaves
WHERE user_id = 3
ORDER BY applied_on DESC;

-- read-Admin views all pending leave requests
SELECT
    l.leave_id,
    u.employee_id,
    u.full_name,
    u.department,
    l.leave_type,
    l.start_date,
    l.end_date,
    l.total_days,
    l.reason,
    l.applied_on
FROM leaves l
JOIN users u ON u.user_id = l.user_id
WHERE l.status = 'pending'
ORDER BY l.applied_on ASC;

-- read— Count leaves taken per employee this year (by type)
SELECT
    u.full_name,
    SUM(CASE WHEN l.leave_type = 'paid'   THEN l.total_days ELSE 0 END) AS paid_days,
    SUM(CASE WHEN l.leave_type = 'sick'   THEN l.total_days ELSE 0 END) AS sick_days,
    SUM(CASE WHEN l.leave_type = 'unpaid' THEN l.total_days ELSE 0 END) AS unpaid_days
FROM leaves l
JOIN users u ON u.user_id = l.user_id
WHERE l.status = 'approved'
  AND YEAR(l.start_date) = YEAR(CURDATE())
GROUP BY u.user_id, u.full_name;

--update-Admin approves a leave request
UPDATE leaves
SET
    status       = 'approved',
    reviewed_by  = 1,
    admin_comment = 'Approved. Enjoy your leave.',
    reviewed_on  = NOW()
WHERE leave_id = 2;

--update-Admin rejects a leave request
UPDATE leaves
SET
    status        = 'rejected',
    reviewed_by   = 1,
    admin_comment = 'Cannot approve due to project deadline.',
    reviewed_on   = NOW()
WHERE leave_id = 5;

--delete-Employee cancels a pending leave request
DELETE FROM leaves
WHERE leave_id = 5 AND status = 'pending';

--table: payroll

--NOTE: EMP008 / user_id 8 was added & then deleted in the users section above....
--The payroll example below therefore uses an existing employee (user_id 6 — Ujwal).

-- CREATE — Admin adds a payroll record for one employee
INSERT INTO payroll
    (user_id, pay_month, pay_year, basic_salary, allowances, deductions, pay_status, created_by, notes)
VALUES
    (6, 7, 2025, 70000.00, 10000.00, 8000.00, 'pending', 1, 'July payroll — Ujwal');

-- CREATE — Bulk insert payroll for all active employees (July 2025)
--  Run after verifying no existing record for (user_id, 7, 2025)
INSERT INTO payroll (user_id, pay_month, pay_year, basic_salary, allowances, deductions, pay_status, created_by)
SELECT
    u.user_id, 7, 2025,
    p_prev.basic_salary,
    p_prev.allowances,
    p_prev.deductions,
    'pending',
    1
FROM users u
JOIN payroll p_prev ON p_prev.user_id = u.user_id
                   AND p_prev.pay_month = 6
                   AND p_prev.pay_year  = 2025
WHERE u.is_active = 1
ON DUPLICATE KEY UPDATE updated_at = NOW(); -- skip if already exists

-- READ — Employee views own payroll record for a specific month
SELECT
    pay_month, pay_year,
    basic_salary, allowances, deductions, net_salary,
    pay_status, payment_date
FROM payroll
WHERE user_id = 3 AND pay_month = 6 AND pay_year = 2025;

-- READ — Employee views full payroll history
SELECT
    pay_year, pay_month, basic_salary, allowances,
    deductions, net_salary, pay_status, payment_date
FROM payroll
WHERE user_id = 3
ORDER BY pay_year DESC, pay_month DESC;

-- READ — Admin views payroll summary for all employees (one month)
SELECT
    u.employee_id,
    u.full_name,
    u.department,
    p.basic_salary,
    p.allowances,
    p.deductions,
    p.net_salary,
    p.pay_status
FROM payroll p
JOIN users u ON u.user_id = p.user_id
WHERE p.pay_month = 6 AND p.pay_year = 2025
ORDER BY u.department, u.full_name;

-- READ — Total payroll cost for the company per month
SELECT
    pay_year, pay_month,
    COUNT(*)             AS total_employees,
    SUM(basic_salary)    AS total_basic,
    SUM(allowances)      AS total_allowances,
    SUM(deductions)      AS total_deductions,
    SUM(net_salary)      AS total_net
FROM payroll
GROUP BY pay_year, pay_month
ORDER BY pay_year DESC, pay_month DESC;

-- UPDATE — Admin updates an employee's salary structure
UPDATE payroll
SET
    basic_salary = 95000.00,
    allowances   = 16000.00,
    deductions   = 11000.00,
    notes        = 'Salary revised after performance review'
WHERE user_id = 3 AND pay_month = 6 AND pay_year = 2025;

-- UPDATE — Mark payroll as paid
UPDATE payroll
SET
    pay_status   = 'paid',
    payment_date = CURDATE()
WHERE pay_month = 7 AND pay_year = 2025 AND pay_status = 'pending';

-- DELETE — Remove an incorrect payroll record (admin only)
DELETE FROM payroll
WHERE user_id = 8 AND pay_month = 7 AND pay_year = 2025;


-- ============================================================
--  VERIFICATION QUERIES — Run to confirm data integrity
-- ============================================================

-- Count rows in each table
SELECT 'users'      AS tbl, COUNT(*) AS rows FROM users
UNION ALL
SELECT 'attendance' AS tbl, COUNT(*) AS rows FROM attendance
UNION ALL
SELECT 'leaves'     AS tbl, COUNT(*) AS rows FROM leaves
UNION ALL
SELECT 'payroll'    AS tbl, COUNT(*) AS rows FROM payroll;

-- Full employee dashboard data (for one employee)
SELECT
    u.employee_id, u.full_name, u.department, u.job_title,

    -- today's attendance
    a.check_in, a.check_out, a.status AS today_status,

    -- pending leave count
    (SELECT COUNT(*) FROM leaves l
     WHERE l.user_id = u.user_id AND l.status = 'pending') AS pending_leaves,

    -- latest net salary
    p.net_salary, p.pay_status
FROM users u
LEFT JOIN attendance a ON a.user_id = u.user_id AND a.attendance_date = CURDATE()
LEFT JOIN payroll    p ON p.user_id = u.user_id
                      AND p.pay_month = MONTH(CURDATE())
                      AND p.pay_year  = YEAR(CURDATE())
WHERE u.user_id = 3;
