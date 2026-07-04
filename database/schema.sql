CREATE DATABASE IF NOT EXISTS hrms_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hrms_db;

-- tablw 1: users
-- stores all employee and admin accounts

CREATE TABLE IF NOT EXISTS users (
    user_id         INT             NOT NULL AUTO_INCREMENT,
    employee_id     VARCHAR(20)     NOT NULL UNIQUE,        -- e.g. EMP001
    full_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,               -- store hashed password
    role            ENUM('admin','hr','employee') NOT NULL DEFAULT 'employee',
    department      VARCHAR(100)    DEFAULT NULL,
    job_title       VARCHAR(100)    DEFAULT NULL,
    phone           VARCHAR(20)     DEFAULT NULL,
    address         TEXT            DEFAULT NULL,
    profile_picture VARCHAR(255)    DEFAULT NULL,           -- file path or URL
    date_joined     DATE            DEFAULT (CURRENT_DATE),
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,     -- 1 = active, 0 = disabled
    email_verified  TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    INDEX idx_email       (email),
    INDEX idx_employee_id (employee_id),
    INDEX idx_role        (role)
) ENGINE=InnoDB;

-- table 2: attendance
-- daily check-in / check-out records per employee

CREATE TABLE IF NOT EXISTS attendance (
    attendance_id   INT             NOT NULL AUTO_INCREMENT,
    user_id         INT             NOT NULL,
    attendance_date DATE            NOT NULL,
    check_in        TIME            DEFAULT NULL,
    check_out       TIME            DEFAULT NULL,
    status          ENUM('present','absent','half-day','leave') NOT NULL DEFAULT 'absent',
    remarks         VARCHAR(255)    DEFAULT NULL,
    recorded_by     INT             DEFAULT NULL,           -- admin who manually updated
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (attendance_id),
    UNIQUE KEY uq_user_date (user_id, attendance_date),     -- one record per day per user
    INDEX idx_att_date   (attendance_date),
    INDEX idx_att_user   (user_id),
    CONSTRAINT fk_att_user
        FOREIGN KEY (user_id)     REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_att_recorder
        FOREIGN KEY (recorded_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- table 3: leaves
-- employee leave / time-off requests

CREATE TABLE IF NOT EXISTS leaves (
    leave_id        INT             NOT NULL AUTO_INCREMENT,
    user_id         INT             NOT NULL,               -- employee making the request
    leave_type      ENUM('paid','sick','unpaid') NOT NULL,
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    total_days      INT             NOT NULL DEFAULT 1,
    reason          TEXT            DEFAULT NULL,
    status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    reviewed_by     INT             DEFAULT NULL,           -- admin/hr who actioned
    admin_comment   TEXT            DEFAULT NULL,
    applied_on      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_on     DATETIME        DEFAULT NULL,
    PRIMARY KEY (leave_id),
    INDEX idx_leave_user   (user_id),
    INDEX idx_leave_status (status),
    INDEX idx_leave_dates  (start_date, end_date),
    CONSTRAINT fk_leave_user
        FOREIGN KEY (user_id)     REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_reviewer
        FOREIGN KEY (reviewed_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- table 4: payroll
-- monthly salary records for each employee

CREATE TABLE IF NOT EXISTS payroll (
    payroll_id      INT             NOT NULL AUTO_INCREMENT,
    user_id         INT             NOT NULL,
    pay_month       TINYINT         NOT NULL,               -- 1-12
    pay_year        SMALLINT        NOT NULL,               -- e.g. 2025
    basic_salary    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    allowances      DECIMAL(12,2)   NOT NULL DEFAULT 0.00,  -- housing, transport, etc.
    deductions      DECIMAL(12,2)   NOT NULL DEFAULT 0.00,  -- tax, insurance, etc.
    net_salary      DECIMAL(12,2)   GENERATED ALWAYS AS
                        (basic_salary + allowances - deductions) STORED,
    pay_status      ENUM('pending','paid','on-hold') NOT NULL DEFAULT 'pending',
    payment_date    DATE            DEFAULT NULL,
    created_by      INT             DEFAULT NULL,           -- admin who entered the record
    notes           TEXT            DEFAULT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payroll_id),
    UNIQUE KEY uq_user_month_year (user_id, pay_month, pay_year),
    INDEX idx_pay_user   (user_id),
    INDEX idx_pay_period (pay_year, pay_month),
    CONSTRAINT fk_pay_user
        FOREIGN KEY (user_id)    REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_pay_creator
        FOREIGN KEY (created_by) REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB;
