import os
from datetime import date, datetime
from functools import wraps
from dotenv import load_dotenv

import bcrypt
from flask import Flask, request, jsonify, session
from db import get_db

load_dotenv()

app = Flask(__name__)

_secret = os.getenv("SECRET_KEY")
if not _secret:
    raise RuntimeError("SECRET_KEY is not set in your .env file.")
app.secret_key = _secret


def serialize(row):
    """Convert date/datetime to string so Flask can return it as JSON."""
    if row is None:
        return None
    return {k: (v.isoformat() if isinstance(v, (date, datetime)) else v)
            for k, v in row.items()}

def err(msg, code=400):
    return jsonify({"error": msg}), code


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return err("Please log in first.", 401)
        return f(*args, **kwargs)
    return wrapper

def admin_or_hr(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return err("Please log in first.", 401)
        if session.get("role") not in ("admin", "hr"):
            return err("Admin or HR access required.", 403)
        return f(*args, **kwargs)
    return wrapper

def admin_only(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return err("Please log in first.", 401)
        if session.get("role") != "admin":
            return err("Admin access required.", 403)
        return f(*args, **kwargs)
    return wrapper


@app.route("/api/auth/register", methods=["POST"])
def register():
    """Register a new employee account."""
    data = request.get_json() or {}
    required = ["employee_id", "full_name", "email", "password", "role"]
    missing = [k for k in required if k not in data]
    if missing:
        return err(f"Missing fields: {', '.join(missing)}")

    password_hash = bcrypt.hashpw(
        data["password"].encode(), bcrypt.gensalt()
    ).decode()

    db = get_db()
    try:
        user_id = db.execute(
            """INSERT INTO users
               (employee_id, full_name, email, password_hash, role,
                department, job_title, phone, address)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (data["employee_id"], data["full_name"], data["email"],
             password_hash, data["role"],
             data.get("department"), data.get("job_title"),
             data.get("phone"), data.get("address"))
        )
        return jsonify({"message": "Registered successfully", "user_id": user_id}), 201
    except Exception:
        return err("Registration failed. Employee ID or email already exists.")


@app.route("/api/auth/login", methods=["POST"])
def login():
    """Login with email and password."""
    data = request.get_json() or {}
    if not data.get("email") or not data.get("password"):
        return err("Email and password are required.")

    db   = get_db()
    user = db.fetchone(
        "SELECT * FROM users WHERE email = %s AND is_active = 1",
        (data["email"],)
    )

    if not user or not bcrypt.checkpw(
        data["password"].encode(),
        user["password_hash"].encode()
    ):
        return err("Invalid email or password.", 401)

    session.clear()
    session["user_id"] = user["user_id"]
    session["role"]    = user["role"]

    return jsonify({
        "message":     "Login successful",
        "user_id":     user["user_id"],
        "full_name":   user["full_name"],
        "employee_id": user["employee_id"],
        "role":        user["role"],
    }), 200


@app.route("/api/auth/logout", methods=["POST"])
@login_required
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/users", methods=["GET"])
@admin_or_hr
def get_all_users():
    """Admin/HR: list all active employees."""
    db   = get_db()
    rows = db.execute(
        """SELECT user_id, employee_id, full_name, email, role,
                  department, job_title, phone, date_joined, is_active
           FROM users WHERE is_active = 1 ORDER BY date_joined DESC""",
        fetch=True
    )
    return jsonify([serialize(r) for r in rows]), 200


@app.route("/api/users/<int:user_id>", methods=["GET"])
@login_required
def get_user(user_id):
    """Get one employee profile. Employees can only view their own."""
    if session["role"] == "employee" and session["user_id"] != user_id:
        return err("Access denied.", 403)

    db   = get_db()
    user = db.fetchone(
        """SELECT user_id, employee_id, full_name, email, role,
                  department, job_title, phone, address,
                  profile_picture, date_joined, email_verified
           FROM users WHERE user_id = %s""",
        (user_id,)
    )
    if not user:
        return err("User not found.", 404)
    return jsonify(serialize(user)), 200


@app.route("/api/users/<int:user_id>", methods=["PUT"])
@login_required
def update_user(user_id):
    """
    Update profile.
    Employees: can only edit phone, address, profile_picture — and only their own.
    Admin/HR: can edit any non-system field.
    """
    data = request.get_json() or {}

    if session["role"] == "employee":
        if session["user_id"] != user_id:
            return err("Access denied.", 403)
        data = {k: v for k, v in data.items()
                if k in {"phone", "address", "profile_picture"}}
    else:
        strip = {"user_id", "password_hash", "created_at", "updated_at"}
        data  = {k: v for k, v in data.items() if k not in strip}

    if not data:
        return err("No valid fields to update.")

    set_clause = ", ".join(f"{k} = %s" for k in data)
    db = get_db()
    try:
        db.execute(
            f"UPDATE users SET {set_clause} WHERE user_id = %s",
            (*data.values(), user_id)
        )
        return jsonify({"message": "Profile updated"}), 200
    except Exception:
        return err("Update failed.")


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@admin_only
def deactivate_user(user_id):
    """Admin soft-deletes (deactivates) an employee."""
    db = get_db()
    db.execute("UPDATE users SET is_active = 0 WHERE user_id = %s", (user_id,))
    return jsonify({"message": "Employee deactivated"}), 200


@app.route("/api/attendance/checkin", methods=["POST"])
@login_required
def check_in():
    """Employee checks in. user_id always taken from session."""
    user_id = session["user_id"]
    today   = date.today().isoformat()
    db      = get_db()
    try:
        db.execute(
            """INSERT INTO attendance (user_id, attendance_date, check_in, status)
               VALUES (%s, %s, NOW(), 'present')
               ON DUPLICATE KEY UPDATE check_in = NOW(), status = 'present'""",
            (user_id, today)
        )
        return jsonify({"message": "Checked in successfully"}), 200
    except Exception:
        return err("Check-in failed.")


@app.route("/api/attendance/checkout", methods=["POST"])
@login_required
def check_out():
    """Employee checks out. user_id always taken from session."""
    user_id = session["user_id"]
    today   = date.today().isoformat()
    db      = get_db()
    try:
        db.execute(
            "UPDATE attendance SET check_out = NOW() WHERE user_id = %s AND attendance_date = %s",
            (user_id, today)
        )
        return jsonify({"message": "Checked out successfully"}), 200
    except Exception:
        return err("Check-out failed.")


@app.route("/api/attendance/<int:user_id>", methods=["GET"])
@login_required
def get_attendance(user_id):
    """Monthly attendance for one employee. Employees see only their own."""
    if session["role"] == "employee" and session["user_id"] != user_id:
        return err("Access denied.", 403)

    month = request.args.get("month", date.today().month)
    year  = request.args.get("year",  date.today().year)
    db    = get_db()
    rows  = db.execute(
        """SELECT attendance_date, check_in, check_out, status, remarks,
                  TIMEDIFF(check_out, check_in) AS hours_worked
           FROM attendance
           WHERE user_id = %s
             AND MONTH(attendance_date) = %s
             AND YEAR(attendance_date)  = %s
           ORDER BY attendance_date""",
        (user_id, month, year), fetch=True
    )
    return jsonify([serialize(r) for r in rows]), 200


@app.route("/api/attendance/all", methods=["GET"])
@admin_or_hr
def get_all_attendance():
    """Admin/HR: all employees' attendance for a date."""
    att_date = request.args.get("date", date.today().isoformat())
    db   = get_db()
    rows = db.execute(
        """SELECT u.employee_id, u.full_name, u.department,
                  a.check_in, a.check_out, a.status, a.remarks
           FROM attendance a
           JOIN users u ON u.user_id = a.user_id
           WHERE a.attendance_date = %s
           ORDER BY u.department, u.full_name""",
        (att_date,), fetch=True
    )
    return jsonify([serialize(r) for r in rows]), 200


@app.route("/api/attendance/summary", methods=["GET"])
@admin_or_hr
def attendance_summary():
    """Monthly attendance summary per employee (admin report)."""
    month = request.args.get("month", date.today().month)
    year  = request.args.get("year",  date.today().year)
    db    = get_db()
    rows  = db.execute(
        """SELECT u.employee_id, u.full_name,
                  COUNT(CASE WHEN a.status='present'  THEN 1 END) AS present_days,
                  COUNT(CASE WHEN a.status='absent'   THEN 1 END) AS absent_days,
                  COUNT(CASE WHEN a.status='half-day' THEN 1 END) AS half_days,
                  COUNT(CASE WHEN a.status='leave'    THEN 1 END) AS on_leave_days
           FROM attendance a
           JOIN users u ON u.user_id = a.user_id
           WHERE MONTH(a.attendance_date)=%s AND YEAR(a.attendance_date)=%s
           GROUP BY u.user_id, u.employee_id, u.full_name
           ORDER BY u.full_name""",
        (month, year), fetch=True
    )
    return jsonify([serialize(r) for r in rows]), 200


@app.route("/api/attendance/<int:user_id>/<att_date>", methods=["PUT"])
@admin_or_hr
def update_attendance(user_id, att_date):
    """Admin/HR corrects an attendance record."""
    data = request.get_json() or {}
    allowed = {"check_in", "check_out", "status", "remarks"}
    data    = {k: v for k, v in data.items() if k in allowed}
    data["recorded_by"] = session["user_id"]   # always from session

    set_clause = ", ".join(f"{k} = %s" for k in data)
    db = get_db()
    try:
        db.execute(
            f"UPDATE attendance SET {set_clause} WHERE user_id=%s AND attendance_date=%s",
            (*data.values(), user_id, att_date)
        )
        return jsonify({"message": "Attendance updated"}), 200
    except Exception:
        return err("Update failed.")


@app.route("/api/attendance/<int:user_id>/<att_date>", methods=["DELETE"])
@admin_only
def delete_attendance(user_id, att_date):
    """Admin removes a wrong attendance entry."""
    db = get_db()
    db.execute(
        "DELETE FROM attendance WHERE user_id=%s AND attendance_date=%s",
        (user_id, att_date)
    )
    return jsonify({"message": "Attendance record deleted"}), 200


@app.route("/api/leaves", methods=["POST"])
@login_required
def apply_leave():
    """Employee submits a leave request. user_id taken from session."""
    data = request.get_json() or {}
    required = ["leave_type", "start_date", "end_date", "reason"]
    missing  = [k for k in required if k not in data]
    if missing:
        return err(f"Missing fields: {', '.join(missing)}")

    start = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
    end   = datetime.strptime(data["end_date"],   "%Y-%m-%d").date()
    if end < start:
        return err("end_date must be on or after start_date.")

    total_days = (end - start).days + 1
    user_id    = session["user_id"]
    db         = get_db()
    try:
        leave_id = db.execute(
            """INSERT INTO leaves
               (user_id, leave_type, start_date, end_date, total_days, reason)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (user_id, data["leave_type"],
             data["start_date"], data["end_date"], total_days, data["reason"])
        )
        return jsonify({"message": "Leave request submitted", "leave_id": leave_id}), 201
    except Exception:
        return err("Could not submit leave request.")


@app.route("/api/leaves/user/<int:user_id>", methods=["GET"])
@login_required
def get_employee_leaves(user_id):
    """View leave history. Employees restricted to own records."""
    if session["role"] == "employee" and session["user_id"] != user_id:
        return err("Access denied.", 403)

    db   = get_db()
    rows = db.execute(
        """SELECT leave_id, leave_type, start_date, end_date,
                  total_days, reason, status, admin_comment, applied_on
           FROM leaves WHERE user_id=%s ORDER BY applied_on DESC""",
        (user_id,), fetch=True
    )
    return jsonify([serialize(r) for r in rows]), 200


@app.route("/api/leaves/pending", methods=["GET"])
@admin_or_hr
def get_pending_leaves():
    """Admin/HR: all pending leave requests."""
    db   = get_db()
    rows = db.execute(
        """SELECT l.leave_id, u.employee_id, u.full_name, u.department,
                  l.leave_type, l.start_date, l.end_date,
                  l.total_days, l.reason, l.applied_on
           FROM leaves l
           JOIN users u ON u.user_id = l.user_id
           WHERE l.status='pending'
           ORDER BY l.applied_on ASC""",
        fetch=True
    )
    return jsonify([serialize(r) for r in rows]), 200


@app.route("/api/leaves/<int:leave_id>/review", methods=["PUT"])
@admin_or_hr
def review_leave(leave_id):
    """Admin/HR approves or rejects a leave request."""
    data   = request.get_json() or {}
    status = data.get("status")
    if status not in ("approved", "rejected"):
        return err("status must be 'approved' or 'rejected'.")

    db = get_db()
    try:
        db.execute(
            """UPDATE leaves
               SET status=%s, reviewed_by=%s, admin_comment=%s, reviewed_on=NOW()
               WHERE leave_id=%s""",
            (status, session["user_id"], data.get("admin_comment", ""), leave_id)
        )
        return jsonify({"message": f"Leave {status}"}), 200
    except Exception:
        return err("Could not update leave.")


@app.route("/api/leaves/<int:leave_id>", methods=["DELETE"])
@login_required
def cancel_leave(leave_id):
    """Employee cancels their own pending leave."""
    db     = get_db()
    record = db.fetchone(
        "SELECT user_id, status FROM leaves WHERE leave_id=%s", (leave_id,)
    )
    if not record:
        return err("Leave not found.", 404)
    if session["role"] == "employee" and record["user_id"] != session["user_id"]:
        return err("Access denied.", 403)
    if record["status"] != "pending":
        return err("Only pending requests can be cancelled.")

    db.execute("DELETE FROM leaves WHERE leave_id=%s", (leave_id,))
    return jsonify({"message": "Leave request cancelled"}), 200


@app.route("/api/payroll/<int:user_id>", methods=["GET"])
@login_required
def get_employee_payroll(user_id):
    """Payroll history for one employee (read-only for employees)."""
    if session["role"] == "employee" and session["user_id"] != user_id:
        return err("Access denied.", 403)

    db   = get_db()
    rows = db.execute(
        """SELECT pay_year, pay_month, basic_salary, allowances,
                  deductions, net_salary, pay_status, payment_date
           FROM payroll WHERE user_id=%s
           ORDER BY pay_year DESC, pay_month DESC""",
        (user_id,), fetch=True
    )
    return jsonify([serialize(r) for r in rows]), 200


@app.route("/api/payroll/summary", methods=["GET"])
@admin_or_hr
def payroll_summary():
    """Admin/HR: payroll summary for all employees for a month."""
    month = request.args.get("month", date.today().month)
    year  = request.args.get("year",  date.today().year)
    db    = get_db()
    rows  = db.execute(
        """SELECT u.employee_id, u.full_name, u.department,
                  p.basic_salary, p.allowances, p.deductions,
                  p.net_salary, p.pay_status
           FROM payroll p
           JOIN users u ON u.user_id = p.user_id
           WHERE p.pay_month=%s AND p.pay_year=%s
           ORDER BY u.department, u.full_name""",
        (month, year), fetch=True
    )
    return jsonify([serialize(r) for r in rows]), 200


@app.route("/api/payroll", methods=["POST"])
@admin_only
def create_payroll():
    """Admin creates a payroll record."""
    data     = request.get_json() or {}
    required = ["user_id", "pay_month", "pay_year",
                "basic_salary", "allowances", "deductions"]
    missing  = [k for k in required if k not in data]
    if missing:
        return err(f"Missing fields: {', '.join(missing)}")

    db = get_db()
    try:
        pid = db.execute(
            """INSERT INTO payroll
               (user_id, pay_month, pay_year, basic_salary, allowances,
                deductions, pay_status, created_by, notes)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (data["user_id"], data["pay_month"], data["pay_year"],
             data["basic_salary"], data["allowances"], data["deductions"],
             data.get("pay_status", "pending"), session["user_id"],
             data.get("notes", ""))
        )
        return jsonify({"message": "Payroll record created", "payroll_id": pid}), 201
    except Exception:
        return err("Could not create payroll. Record may already exist for this month.")


@app.route("/api/payroll/<int:payroll_id>", methods=["PUT"])
@admin_only
def update_payroll(payroll_id):
    """Admin updates a payroll record."""
    data    = request.get_json() or {}
    allowed = {"basic_salary", "allowances", "deductions",
               "pay_status", "payment_date", "notes"}
    data    = {k: v for k, v in data.items() if k in allowed}
    if not data:
        return err("No valid fields to update.")

    set_clause = ", ".join(f"{k} = %s" for k in data)
    db = get_db()
    try:
        db.execute(
            f"UPDATE payroll SET {set_clause} WHERE payroll_id=%s",
            (*data.values(), payroll_id)
        )
        return jsonify({"message": "Payroll updated"}), 200
    except Exception:
        return err("Update failed.")


@app.route("/api/payroll/<int:payroll_id>", methods=["DELETE"])
@admin_only
def delete_payroll(payroll_id):
    """Admin removes an incorrect payroll record."""
    db = get_db()
    db.execute("DELETE FROM payroll WHERE payroll_id=%s", (payroll_id,))
    return jsonify({"message": "Payroll record deleted"}), 200



@app.route("/api/dashboard/<int:user_id>", methods=["GET"])
@login_required
def dashboard(user_id):
    """Quick dashboard data: profile + today's attendance + pending leaves + latest salary."""
    if session["role"] == "employee" and session["user_id"] != user_id:
        return err("Access denied.", 403)

    db   = get_db()
    row  = db.fetchone(
        """SELECT
               u.employee_id, u.full_name, u.department, u.job_title,
               a.check_in, a.check_out, a.status AS today_status,
               (SELECT COUNT(*) FROM leaves l
                WHERE l.user_id = u.user_id AND l.status = 'pending') AS pending_leaves,
               p.net_salary, p.pay_status
           FROM users u
           LEFT JOIN attendance a
               ON a.user_id = u.user_id AND a.attendance_date = CURDATE()
           LEFT JOIN payroll p
               ON p.user_id = u.user_id
               AND p.pay_month = MONTH(CURDATE())
               AND p.pay_year  = YEAR(CURDATE())
           WHERE u.user_id = %s""",
        (user_id,)
    )
    return jsonify(serialize(row)), 200

if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug, host="127.0.0.1", port=5000)
