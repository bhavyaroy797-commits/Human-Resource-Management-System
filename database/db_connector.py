
import os
import mysql.connector
from datetime import date, datetime
from dotenv import load_dotenv


class HRMSDatabase:
    """Direct MySQL connector for HRMS database operations."""

    def __init__(self, host=None, port=None, user=None, password=None, database=None):
        
        load_dotenv()
        
        self.host = host or os.getenv("MYSQL_HOST", "localhost")
        self.port = int(os.getenv("MYSQL_PORT", 3306))
        self.user = user or os.getenv("MYSQL_USER", "root")
        self.password = password or os.getenv("MYSQL_PASSWORD", "mysqlbhavya17#")
        self.database = database or os.getenv("MYSQL_DB", "hrms_db")
        
        self.connection = None
        self.connect()

    def connect(self):
        """Establish database connection."""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database
            )
        except mysql.connector.Error as err:
            raise Exception(f"Database connection failed: {err}")

    def _get_cursor(self):
        """Get a dictionary cursor (results as dicts)."""
        return self.connection.cursor(dictionary=True)

    def _serialize_row(self, row):
        """Convert date/datetime fields to ISO strings."""
        if row is None:
            return None
        return {
            k: (v.isoformat() if isinstance(v, (date, datetime)) else v)
            for k, v in row.items()
        }

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
        """Execute INSERT/UPDATE/DELETE query."""
        cur = self._get_cursor()
        try:
            cur.execute(query, params or ())
            self.connection.commit()
            return cur.rowcount
        except Exception as e:
            self.connection.rollback()
            raise e
        finally:
            cur.close()

    def close(self):
        """Close database connection."""
        if self.connection and self.connection.is_connected():
            self.connection.close()

    # ──── USER OPERATIONS ────

    def get_user_by_email(self, email):
        """Get user by email."""
        query = "SELECT * FROM users WHERE email = %s AND is_active = 1"
        return self.execute_query(query, (email,), fetch_one=True)

    def get_user_by_id(self, user_id):
        """Get user by ID."""
        query = "SELECT * FROM users WHERE user_id = %s"
        return self.execute_query(query, (user_id,), fetch_one=True)

    def get_all_users(self):
        """Get all active users."""
        query = "SELECT * FROM users WHERE is_active = 1 ORDER BY date_joined DESC"
        return self.execute_query(query)

    def create_user(self, employee_id, full_name, email, password_hash, role, 
                   department=None, job_title=None, phone=None, address=None):
        """Create new user."""
        query = """INSERT INTO users
                   (employee_id, full_name, email, password_hash, role,
                    department, job_title, phone, address)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        params = (employee_id, full_name, email, password_hash, role,
                 department, job_title, phone, address)
        self.execute_update(query, params)

    def update_user(self, user_id, **fields):
        """Update user fields."""
        if not fields:
            raise ValueError("No fields to update")
        
        set_clause = ", ".join(f"`{k}` = %s" for k in fields)
        query = f"UPDATE users SET {set_clause} WHERE user_id = %s"
        params = list(fields.values()) + [user_id]
        return self.execute_update(query, params)

    def deactivate_user(self, user_id):
        """Soft-delete user."""
        query = "UPDATE users SET is_active = 0 WHERE user_id = %s"
        return self.execute_update(query, (user_id,))

    # ──── ATTENDANCE OPERATIONS ────

    def check_in(self, user_id, att_date=None):
        """Record check-in."""
        att_date = att_date or date.today().isoformat()
        query = """INSERT INTO attendance (user_id, attendance_date, check_in, status)
                   VALUES (%s, %s, NOW(), 'present')
                   ON DUPLICATE KEY UPDATE check_in = NOW(), status = 'present'"""
        return self.execute_update(query, (user_id, att_date))

    def check_out(self, user_id, att_date=None):
        """Record check-out."""
        att_date = att_date or date.today().isoformat()
        query = "UPDATE attendance SET check_out = NOW() WHERE user_id = %s AND attendance_date = %s"
        return self.execute_update(query, (user_id, att_date))

    def get_attendance(self, user_id, month=None, year=None):
        """Get monthly attendance for user."""
        month = month or date.today().month
        year = year or date.today().year
        
        query = """SELECT attendance_date, check_in, check_out, status, remarks,
                          TIMEDIFF(check_out, check_in) AS hours_worked
                   FROM attendance
                   WHERE user_id = %s AND MONTH(attendance_date) = %s AND YEAR(attendance_date) = %s
                   ORDER BY attendance_date"""
        return self.execute_query(query, (user_id, month, year))

    def get_all_attendance(self, att_date=None):
        """Get all attendance for a specific date."""
        att_date = att_date or date.today().isoformat()
        query = """SELECT u.employee_id, u.full_name, u.department,
                          a.check_in, a.check_out, a.status, a.remarks
                   FROM attendance a
                   JOIN users u ON u.user_id = a.user_id
                   WHERE a.attendance_date = %s
                   ORDER BY u.department, u.full_name"""
        return self.execute_query(query, (att_date,))

    def update_attendance(self, user_id, att_date, **fields):
        """Update attendance record."""
        if not fields:
            raise ValueError("No fields to update")
        
        set_clause = ", ".join(f"`{k}` = %s" for k in fields)
        query = f"UPDATE attendance SET {set_clause} WHERE user_id = %s AND attendance_date = %s"
        params = list(fields.values()) + [user_id, att_date]
        return self.execute_update(query, params)

    def delete_attendance(self, user_id, att_date):
        """Delete attendance record."""
        query = "DELETE FROM attendance WHERE user_id = %s AND attendance_date = %s"
        return self.execute_update(query, (user_id, att_date))

    # ──── LEAVE OPERATIONS ────

    def apply_leave(self, user_id, leave_type, start_date, end_date, reason):
        """Submit leave request."""
        from datetime import datetime as dt
        start = dt.strptime(start_date, "%Y-%m-%d").date()
        end = dt.strptime(end_date, "%Y-%m-%d").date()
        total_days = (end - start).days + 1
        
        query = """INSERT INTO leaves
                   (user_id, leave_type, start_date, end_date, total_days, reason)
                   VALUES (%s, %s, %s, %s, %s, %s)"""
        params = (user_id, leave_type, start_date, end_date, total_days, reason)
        self.execute_update(query, params)

    def get_employee_leaves(self, user_id):
        """Get leave history for employee."""
        query = """SELECT leave_id, leave_type, start_date, end_date,
                          total_days, reason, status, admin_comment, applied_on
                   FROM leaves WHERE user_id = %s ORDER BY applied_on DESC"""
        return self.execute_query(query, (user_id,))

    def get_pending_leaves(self):
        """Get all pending leave requests."""
        query = """SELECT l.leave_id, u.employee_id, u.full_name, u.department,
                          l.leave_type, l.start_date, l.end_date,
                          l.total_days, l.reason, l.applied_on
                   FROM leaves l
                   JOIN users u ON u.user_id = l.user_id
                   WHERE l.status = 'pending'
                   ORDER BY l.applied_on ASC"""
        return self.execute_query(query)

    def review_leave(self, leave_id, status, reviewed_by, admin_comment=""):
        """Approve/reject leave request."""
        if status not in ("approved", "rejected"):
            raise ValueError("status must be 'approved' or 'rejected'")
        
        query = """UPDATE leaves
                   SET status = %s, reviewed_by = %s, admin_comment = %s, reviewed_on = NOW()
                   WHERE leave_id = %s"""
        params = (status, reviewed_by, admin_comment, leave_id)
        return self.execute_update(query, params)

    def cancel_leave(self, leave_id):
        """Cancel pending leave request."""
        query = "DELETE FROM leaves WHERE leave_id = %s AND status = 'pending'"
        return self.execute_update(query, (leave_id,))

    # ──── PAYROLL OPERATIONS ────

    def get_employee_payroll(self, user_id):
        """Get payroll records for employee."""
        query = """SELECT pay_year, pay_month, basic_salary, allowances,
                          deductions, net_salary, pay_status, payment_date
                   FROM payroll
                   WHERE user_id = %s
                   ORDER BY pay_year DESC, pay_month DESC"""
        return self.execute_query(query, (user_id,))

    def get_payroll_summary(self, month, year):
        """Get payroll summary for all employees."""
        query = """SELECT u.employee_id, u.full_name, u.department,
                          p.basic_salary, p.allowances, p.deductions,
                          p.net_salary, p.pay_status
                   FROM payroll p
                   JOIN users u ON u.user_id = p.user_id
                   WHERE p.pay_month = %s AND p.pay_year = %s
                   ORDER BY u.department, u.full_name"""
        return self.execute_query(query, (month, year))

    def create_payroll(self, user_id, pay_month, pay_year, basic_salary, 
                      allowances, deductions, created_by, pay_status="pending", notes=""):
        """Create payroll record."""
        query = """INSERT INTO payroll
                   (user_id, pay_month, pay_year, basic_salary, allowances,
                    deductions, pay_status, created_by, notes)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"""
        params = (user_id, pay_month, pay_year, basic_salary, allowances,
                 deductions, pay_status, created_by, notes)
        self.execute_update(query, params)

    def update_payroll(self, payroll_id, **fields):
        """Update payroll record."""
        if not fields:
            raise ValueError("No fields to update")
        
        set_clause = ", ".join(f"`{k}` = %s" for k in fields)
        query = f"UPDATE payroll SET {set_clause} WHERE payroll_id = %s"
        params = list(fields.values()) + [payroll_id]
        return self.execute_update(query, params)

    def delete_payroll(self, payroll_id):
        """Delete payroll record."""
        query = "DELETE FROM payroll WHERE payroll_id = %s"
        return self.execute_update(query, (payroll_id,))

    def __enter__(self):
        """Context manager support."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager support."""
        self.close()


# Example usage
if __name__ == "__main__":
    # Usage with context manager
    with HRMSDatabase() as db:
        # Get all users
        users = db.get_all_users()
        print(f"Total users: {len(users)}")
        
        # Get specific user
        user = db.get_user_by_email("ayesha.malik@hrms.com")
        if user:
            print(f"User: {user['full_name']} ({user['role']})")
        
        # Get attendance
        attendance = db.get_attendance(3, 6, 2025)
        print(f"June attendance records: {len(attendance)}")
        
        # Get pending leaves
        pending = db.get_pending_leaves()
        print(f"Pending leave requests: {len(pending)}")
