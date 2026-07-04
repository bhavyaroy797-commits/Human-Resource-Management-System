"""
Direct MySQL connector for HRMS.
Wraps mysql.connector with dict-cursor results and ISO-serialized dates.
"""

import os
import mysql.connector
from mysql.connector import pooling
from datetime import date, datetime, timedelta
from dotenv import load_dotenv


class HRMSDatabase:
    """Direct MySQL connector for HRMS database operations."""

    _pool = None

    def __init__(self, host=None, port=None, user=None, password=None, database=None, use_pool=True):
        load_dotenv()

        self.host = host or os.getenv("MYSQL_HOST", "localhost")
        self.port = int(port or os.getenv("MYSQL_PORT", 3306))
        self.user = user or os.getenv("MYSQL_USER", "root")
        self.password = password or os.getenv("MYSQL_PASSWORD", "")
        self.database = database or os.getenv("MYSQL_DB", "hrms_db")

        self.use_pool = use_pool
        self.connection = None
        self.connect()

    def connect(self):
        """Establish database connection (pooled for concurrent Flask requests)."""
        try:
            if self.use_pool:
                if HRMSDatabase._pool is None:
                    HRMSDatabase._pool = pooling.MySQLConnectionPool(
                        pool_name="hrms_pool",
                        pool_size=10,
                        pool_reset_session=True,
                        host=self.host,
                        port=self.port,
                        user=self.user,
                        password=self.password,
                        database=self.database,
                    )
                self.connection = HRMSDatabase._pool.get_connection()
            else:
                self.connection = mysql.connector.connect(
                    host=self.host, port=self.port, user=self.user,
                    password=self.password, database=self.database,
                )
        except mysql.connector.Error as err:
            raise Exception(f"Database connection failed: {err}")

    def _get_cursor(self):
        return self.connection.cursor(dictionary=True)

    def _serialize_row(self, row):
        if row is None:
            return None
        out = {}
        for k, v in row.items():
            if isinstance(v, (date, datetime)):
                out[k] = v.isoformat()
            elif isinstance(v, timedelta):
                out[k] = str(v)
            else:
                out[k] = v
        return out

    def execute_query(self, query, params=None, fetch_one=False):
        """Execute SELECT query and return results."""
        cur = self._get_cursor()
        try:
            cur.execute(query, params or ())
            result = cur.fetchone() if fetch_one else cur.fetchall()
            if fetch_one:
                return self._serialize_row(result)
            return [self._serialize_row(r) for r in result]
        finally:
            cur.close()

    def execute_update(self, query, params=None):
        """Execute INSERT/UPDATE/DELETE query. Returns (rowcount, lastrowid)."""
        cur = self._get_cursor()
        try:
            cur.execute(query, params or ())
            self.connection.commit()
            return cur.rowcount, cur.lastrowid
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cur.close()

    def close(self):
        if self.connection and self.connection.is_connected():
            self.connection.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    # ──────────────────────── USERS ────────────────────────

    def get_user_by_email(self, email, active_only=False):
        query = "SELECT * FROM users WHERE email = %s"
        if active_only:
            query += " AND is_active = 1"
        return self.execute_query(query, (email,), fetch_one=True)

    def get_user_by_id(self, user_id):
        return self.execute_query("SELECT * FROM users WHERE user_id = %s", (user_id,), fetch_one=True)

    def get_user_by_employee_id(self, employee_id):
        return self.execute_query("SELECT * FROM users WHERE employee_id = %s", (employee_id,), fetch_one=True)

    def get_all_users(self, include_inactive=False):
        query = "SELECT user_id, employee_id, full_name, email, role, department, job_title, phone, date_joined, is_active FROM users"
        if not include_inactive:
            query += " WHERE is_active = 1"
        query += " ORDER BY date_joined DESC"
        return self.execute_query(query)

    def get_employee_directory(self, include_inactive=False):
        query = """SELECT u.user_id, u.employee_id, u.full_name, u.email, u.role,
                          u.department, u.job_title, u.phone, u.address,
                          u.profile_picture, u.date_joined, u.is_active,
                          COALESCE(MAX(p.net_salary) * 12, 0) AS annual_salary
                   FROM users u
                   LEFT JOIN payroll p ON p.user_id = u.user_id"""
        params = []
        if not include_inactive:
            query += " WHERE u.is_active = 1"
        query += """ GROUP BY u.user_id, u.employee_id, u.full_name, u.email, u.role,
                            u.department, u.job_title, u.phone, u.address,
                            u.profile_picture, u.date_joined, u.is_active
                     ORDER BY u.date_joined DESC"""
        return self.execute_query(query, params)

    def create_user(self, employee_id, full_name, email, password_hash, role,
                     department=None, job_title=None, phone=None, address=None, date_joined=None):
        query = """INSERT INTO users
                   (employee_id, full_name, email, password_hash, role,
                    department, job_title, phone, address, date_joined)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, COALESCE(%s, CURDATE()))"""
        params = (employee_id, full_name, email, password_hash, role,
                  department, job_title, phone, address, date_joined)
        _, new_id = self.execute_update(query, params)
        return new_id

    def update_user(self, user_id, **fields):
        if not fields:
            raise ValueError("No fields to update")
        set_clause = ", ".join(f"`{k}` = %s" for k in fields)
        query = f"UPDATE users SET {set_clause} WHERE user_id = %s"
        params = list(fields.values()) + [user_id]
        rowcount, _ = self.execute_update(query, params)
        return rowcount

    def deactivate_user(self, user_id):
        rowcount, _ = self.execute_update("UPDATE users SET is_active = 0 WHERE user_id = %s", (user_id,))
        return rowcount

    def delete_user(self, user_id):
        """Hard delete — use sparingly."""
        rowcount, _ = self.execute_update("DELETE FROM users WHERE user_id = %s", (user_id,))
        return rowcount

    # ──────────────────────── ATTENDANCE ────────────────────────

    def check_in(self, user_id, att_date=None):
        att_date = att_date or date.today().isoformat()
        query = """INSERT INTO attendance (user_id, attendance_date, check_in, status)
                   VALUES (%s, %s, CURTIME(), 'present')
                   ON DUPLICATE KEY UPDATE check_in = VALUES(check_in), status = VALUES(status)"""
        rowcount, _ = self.execute_update(query, (user_id, att_date))
        return rowcount

    def check_out(self, user_id, att_date=None):
        att_date = att_date or date.today().isoformat()
        query = "UPDATE attendance SET check_out = CURTIME() WHERE user_id = %s AND attendance_date = %s"
        rowcount, _ = self.execute_update(query, (user_id, att_date))
        return rowcount

    def mark_attendance(self, user_id, att_date, check_in=None, check_out=None,
                         status="present", remarks=None, recorded_by=None):
        """Admin manually marks/overwrites attendance for an employee."""
        query = """INSERT INTO attendance
                   (user_id, attendance_date, check_in, check_out, status, remarks, recorded_by)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                   ON DUPLICATE KEY UPDATE
                       check_in = VALUES(check_in), check_out = VALUES(check_out),
                       status = VALUES(status), remarks = VALUES(remarks), recorded_by = VALUES(recorded_by)"""
        params = (user_id, att_date, check_in, check_out, status, remarks, recorded_by)
        rowcount, _ = self.execute_update(query, params)
        return rowcount

    def get_attendance(self, user_id, month=None, year=None):
        month = month or date.today().month
        year = year or date.today().year
        query = """SELECT attendance_date, check_in, check_out, status, remarks,
                          TIMEDIFF(check_out, check_in) AS hours_worked
                   FROM attendance
                   WHERE user_id = %s AND MONTH(attendance_date) = %s AND YEAR(attendance_date) = %s
                   ORDER BY attendance_date"""
        return self.execute_query(query, (user_id, month, year))

    def get_weekly_attendance(self, user_id):
        query = """SELECT attendance_date, DAYNAME(attendance_date) AS day_name,
                          check_in, check_out, status
                   FROM attendance
                   WHERE user_id = %s
                     AND attendance_date BETWEEN
                         DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                         AND DATE_ADD(CURDATE(), INTERVAL (6 - WEEKDAY(CURDATE())) DAY)
                   ORDER BY attendance_date"""
        return self.execute_query(query, (user_id,))

    def get_all_attendance(self, att_date=None):
        att_date = att_date or date.today().isoformat()
        query = """SELECT u.employee_id, u.full_name, u.department,
                          a.check_in, a.check_out, a.status, a.remarks
                   FROM attendance a
                   JOIN users u ON u.user_id = a.user_id
                   WHERE a.attendance_date = %s
                   ORDER BY u.department, u.full_name"""
        return self.execute_query(query, (att_date,))

    def get_attendance_history(self, limit=250):
        query = """SELECT a.attendance_id, u.employee_id, u.full_name, u.department,
                          a.attendance_date, a.check_in, a.check_out, a.status,
                          a.remarks, TIMEDIFF(a.check_out, a.check_in) AS hours_worked
                   FROM attendance a
                   JOIN users u ON u.user_id = a.user_id
                   ORDER BY a.attendance_date DESC, u.full_name
                   LIMIT %s"""
        return self.execute_query(query, (limit,))

    def get_monthly_attendance_summary(self, month, year):
        query = """SELECT u.employee_id, u.full_name,
                          COUNT(CASE WHEN a.status = 'present'  THEN 1 END) AS present_days,
                          COUNT(CASE WHEN a.status = 'absent'   THEN 1 END) AS absent_days,
                          COUNT(CASE WHEN a.status = 'half-day' THEN 1 END) AS half_days,
                          COUNT(CASE WHEN a.status = 'leave'    THEN 1 END) AS on_leave_days
                   FROM attendance a
                   JOIN users u ON u.user_id = a.user_id
                   WHERE MONTH(a.attendance_date) = %s AND YEAR(a.attendance_date) = %s
                   GROUP BY u.user_id, u.employee_id, u.full_name
                   ORDER BY u.full_name"""
        return self.execute_query(query, (month, year))

    def update_attendance(self, user_id, att_date, **fields):
        if not fields:
            raise ValueError("No fields to update")
        set_clause = ", ".join(f"`{k}` = %s" for k in fields)
        query = f"UPDATE attendance SET {set_clause} WHERE user_id = %s AND attendance_date = %s"
        params = list(fields.values()) + [user_id, att_date]
        rowcount, _ = self.execute_update(query, params)
        return rowcount

    def delete_attendance(self, user_id, att_date):
        rowcount, _ = self.execute_update(
            "DELETE FROM attendance WHERE user_id = %s AND attendance_date = %s", (user_id, att_date)
        )
        return rowcount

    # ──────────────────────── LEAVES ────────────────────────

    def apply_leave(self, user_id, leave_type, start_date, end_date, reason):
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        total_days = (end - start).days + 1
        query = """INSERT INTO leaves
                   (user_id, leave_type, start_date, end_date, total_days, reason)
                   VALUES (%s, %s, %s, %s, %s, %s)"""
        params = (user_id, leave_type, start_date, end_date, total_days, reason)
        _, new_id = self.execute_update(query, params)
        return new_id

    def get_employee_leaves(self, user_id):
        query = """SELECT leave_id, leave_type, start_date, end_date,
                          total_days, reason, status, admin_comment, applied_on
                   FROM leaves WHERE user_id = %s ORDER BY applied_on DESC"""
        return self.execute_query(query, (user_id,))

    def get_leave_by_id(self, leave_id):
        return self.execute_query("SELECT * FROM leaves WHERE leave_id = %s", (leave_id,), fetch_one=True)

    def get_pending_leaves(self):
        query = """SELECT l.leave_id, u.employee_id, u.full_name, u.department,
                          l.leave_type, l.start_date, l.end_date,
                          l.total_days, l.reason, l.applied_on
                   FROM leaves l
                   JOIN users u ON u.user_id = l.user_id
                   WHERE l.status = 'pending'
                   ORDER BY l.applied_on ASC"""
        return self.execute_query(query)

    def get_all_leaves(self, limit=250):
        query = """SELECT l.leave_id, u.employee_id, u.full_name, u.department,
                          l.leave_type, l.start_date, l.end_date, l.total_days,
                          l.reason, l.status, l.admin_comment, l.applied_on,
                          reviewer.full_name AS reviewed_by_name
                   FROM leaves l
                   JOIN users u ON u.user_id = l.user_id
                   LEFT JOIN users reviewer ON reviewer.user_id = l.reviewed_by
                   ORDER BY l.applied_on DESC
                   LIMIT %s"""
        return self.execute_query(query, (limit,))

    def get_leave_summary(self, year=None):
        year = year or date.today().year
        query = """SELECT u.full_name,
                          SUM(CASE WHEN l.leave_type = 'paid'   THEN l.total_days ELSE 0 END) AS paid_days,
                          SUM(CASE WHEN l.leave_type = 'sick'   THEN l.total_days ELSE 0 END) AS sick_days,
                          SUM(CASE WHEN l.leave_type = 'unpaid' THEN l.total_days ELSE 0 END) AS unpaid_days
                   FROM leaves l
                   JOIN users u ON u.user_id = l.user_id
                   WHERE l.status = 'approved' AND YEAR(l.start_date) = %s
                   GROUP BY u.user_id, u.full_name"""
        return self.execute_query(query, (year,))

    def review_leave(self, leave_id, status, reviewed_by, admin_comment=""):
        if status not in ("approved", "rejected"):
            raise ValueError("status must be 'approved' or 'rejected'")
        query = """UPDATE leaves
                   SET status = %s, reviewed_by = %s, admin_comment = %s, reviewed_on = NOW()
                   WHERE leave_id = %s"""
        rowcount, _ = self.execute_update(query, (status, reviewed_by, admin_comment, leave_id))
        return rowcount

    def cancel_leave(self, leave_id, user_id=None):
        """Cancel a pending leave. If user_id given, restricts to that owner (self-service)."""
        query = "DELETE FROM leaves WHERE leave_id = %s AND status = 'pending'"
        params = [leave_id]
        if user_id is not None:
            query += " AND user_id = %s"
            params.append(user_id)
        rowcount, _ = self.execute_update(query, params)
        return rowcount

    # ──────────────────────── PAYROLL ────────────────────────

    def create_payroll(self, user_id, pay_month, pay_year, basic_salary,
                        allowances, deductions, created_by, pay_status="pending", notes=""):
        query = """INSERT INTO payroll
                   (user_id, pay_month, pay_year, basic_salary, allowances,
                    deductions, pay_status, created_by, notes)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        params = (user_id, pay_month, pay_year, basic_salary, allowances,
                  deductions, pay_status, created_by, notes)
        _, new_id = self.execute_update(query, params)
        return new_id

    def get_payroll_by_id(self, payroll_id):
        return self.execute_query("SELECT * FROM payroll WHERE payroll_id = %s", (payroll_id,), fetch_one=True)

    def get_employee_payroll(self, user_id, month=None, year=None):
        query = """SELECT payroll_id, pay_year, pay_month, basic_salary, allowances,
                          deductions, net_salary, pay_status, payment_date
                   FROM payroll WHERE user_id = %s"""
        params = [user_id]
        if month:
            query += " AND pay_month = %s"
            params.append(month)
        if year:
            query += " AND pay_year = %s"
            params.append(year)
        query += " ORDER BY pay_year DESC, pay_month DESC"
        return self.execute_query(query, params)

    def get_payroll_summary(self, month, year):
        query = """SELECT p.payroll_id, u.employee_id, u.full_name, u.department,
                          p.basic_salary, p.allowances, p.deductions,
                          p.net_salary, p.pay_status
                   FROM payroll p
                   JOIN users u ON u.user_id = p.user_id
                   WHERE p.pay_month = %s AND p.pay_year = %s
                   ORDER BY u.department, u.full_name"""
        return self.execute_query(query, (month, year))

    def get_total_payroll_cost(self):
        query = """SELECT pay_year, pay_month, COUNT(*) AS total_employees,
                          SUM(basic_salary) AS total_basic, SUM(allowances) AS total_allowances,
                          SUM(deductions) AS total_deductions, SUM(net_salary) AS total_net
                   FROM payroll GROUP BY pay_year, pay_month
                   ORDER BY pay_year DESC, pay_month DESC"""
        return self.execute_query(query)

    def get_all_payroll(self, limit=250):
        query = """SELECT p.payroll_id, u.employee_id, u.full_name, u.department,
                          p.pay_year, p.pay_month, p.basic_salary, p.allowances,
                          p.deductions, p.net_salary, p.pay_status, p.payment_date
                   FROM payroll p
                   JOIN users u ON u.user_id = p.user_id
                   ORDER BY p.pay_year DESC, p.pay_month DESC, u.full_name
                   LIMIT %s"""
        return self.execute_query(query, (limit,))

    def bulk_generate_payroll(self, pay_month, pay_year, created_by):
        """Copy previous month's salary structure to a new month for all active employees."""
        prev_month, prev_year = (pay_month - 1, pay_year) if pay_month > 1 else (12, pay_year - 1)
        query = """INSERT INTO payroll (user_id, pay_month, pay_year, basic_salary, allowances, deductions, pay_status, created_by)
                   SELECT u.user_id, %s, %s, p_prev.basic_salary, p_prev.allowances, p_prev.deductions, 'pending', %s
                   FROM users u
                   JOIN payroll p_prev ON p_prev.user_id = u.user_id
                                       AND p_prev.pay_month = %s AND p_prev.pay_year = %s
                   WHERE u.is_active = 1
                   ON DUPLICATE KEY UPDATE updated_at = NOW()"""
        rowcount, _ = self.execute_update(query, (pay_month, pay_year, created_by, prev_month, prev_year))
        return rowcount

    def update_payroll(self, payroll_id, **fields):
        if not fields:
            raise ValueError("No fields to update")
        set_clause = ", ".join(f"`{k}` = %s" for k in fields)
        query = f"UPDATE payroll SET {set_clause} WHERE payroll_id = %s"
        params = list(fields.values()) + [payroll_id]
        rowcount, _ = self.execute_update(query, params)
        return rowcount

    def mark_payroll_paid(self, pay_month, pay_year):
        query = """UPDATE payroll SET pay_status = 'paid', payment_date = CURDATE()
                   WHERE pay_month = %s AND pay_year = %s AND pay_status = 'pending'"""
        rowcount, _ = self.execute_update(query, (pay_month, pay_year))
        return rowcount

    def delete_payroll(self, payroll_id):
        rowcount, _ = self.execute_update("DELETE FROM payroll WHERE payroll_id = %s", (payroll_id,))
        return rowcount

    # ──────────────────────── DASHBOARD ────────────────────────

    def get_employee_dashboard(self, user_id):
        query = """SELECT u.employee_id, u.full_name, u.department, u.job_title,
                          a.check_in, a.check_out, a.status AS today_status,
                          (SELECT COUNT(*) FROM leaves l
                           WHERE l.user_id = u.user_id AND l.status = 'pending') AS pending_leaves,
                          p.net_salary, p.pay_status
                   FROM users u
                   LEFT JOIN attendance a ON a.user_id = u.user_id AND a.attendance_date = CURDATE()
                   LEFT JOIN payroll p ON p.user_id = u.user_id
                                       AND p.pay_month = MONTH(CURDATE()) AND p.pay_year = YEAR(CURDATE())
                   WHERE u.user_id = %s"""
        return self.execute_query(query, (user_id,), fetch_one=True)

    def get_dashboard_stats(self):
        query = """SELECT
                       (SELECT COUNT(*) FROM users) AS total_employees,
                       (SELECT COUNT(*) FROM users WHERE is_active = 1) AS active_employees,
                       (SELECT COUNT(*) FROM attendance
                        WHERE attendance_date = CURDATE() AND status = 'present') AS present_today,
                       (SELECT COUNT(*) FROM attendance
                        WHERE attendance_date = CURDATE() AND status = 'absent') AS absent_today,
                       (SELECT COUNT(*) FROM leaves
                        WHERE status = 'approved'
                          AND CURDATE() BETWEEN start_date AND end_date) AS employees_on_leave,
                       (SELECT COUNT(*) FROM leaves WHERE status = 'pending') AS pending_leave_requests,
                       (SELECT COALESCE(SUM(net_salary), 0) FROM payroll
                        WHERE pay_month = MONTH(CURDATE()) AND pay_year = YEAR(CURDATE())) AS monthly_payroll,
                       (SELECT COUNT(DISTINCT department) FROM users
                        WHERE is_active = 1 AND department IS NOT NULL) AS total_departments,
                       (SELECT COUNT(*) FROM users
                        WHERE YEAR(date_joined) = YEAR(CURDATE())
                          AND MONTH(date_joined) = MONTH(CURDATE())) AS new_employees_this_month"""
        return self.execute_query(query, fetch_one=True)
