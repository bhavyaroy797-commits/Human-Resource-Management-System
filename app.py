"""
HRMS Backend API
Flask + MySQL REST API for the HR Management System.

Run:
    pip install -r requirements.txt
    cp .env.example .env   # then fill in your DB credentials
    python app.py
"""

import os
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv

from db_connector import HRMSDatabase
from auth import (
    hash_password, verify_password, generate_token,
    token_required, roles_required, self_or_roles,
)

load_dotenv()

app = Flask(__name__)
CORS(app)

ADMIN_ROLES = ("admin", "hr")


def get_db():
    """One pooled connection per request."""
    if "db" not in g:
        g.db = HRMSDatabase()
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def err(message, code=400):
    return jsonify({"error": message}), code


def _as_float(value):
    return float(value or 0)


def _display_role(user):
    return user.get("job_title") or user.get("role") or "Employee"


def _frontend_employee(user):
    employee_id = user.get("employee_id")
    active = bool(user.get("is_active", 1))
    return {
        "key": employee_id,
        "id": employee_id,
        "userId": user.get("user_id"),
        "employeeId": employee_id,
        "fullName": user.get("full_name"),
        "name": user.get("full_name"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "department": user.get("department"),
        "designation": user.get("job_title"),
        "role": _display_role(user),
        "systemRole": user.get("role"),
        "joinDate": user.get("date_joined"),
        "joiningDate": user.get("date_joined"),
        "salary": _as_float(user.get("annual_salary")),
        "address": user.get("address"),
        "profileImage": user.get("profile_picture"),
        "status": "Active" if active else "Inactive",
    }


def _db_leave_type(label):
    mapping = {
        "sick leave": "sick",
        "casual leave": "paid",
        "earned leave": "paid",
        "paid": "paid",
        "sick": "sick",
        "unpaid": "unpaid",
    }
    return mapping.get(str(label or "").strip().lower(), "paid")


def _frontend_leave_type(label):
    mapping = {"paid": "Earned Leave", "sick": "Sick Leave", "unpaid": "Casual Leave"}
    return mapping.get(label, label or "Leave")


def _frontend_status(status):
    return str(status or "").replace("-", " ").title().replace(" ", "-")


def _frontend_leave(row):
    leave_id = f"LV-{row.get('leave_id')}"
    return {
        "key": leave_id,
        "id": leave_id,
        "leaveId": row.get("leave_id"),
        "empId": row.get("employee_id"),
        "employeeName": row.get("full_name"),
        "type": _frontend_leave_type(row.get("leave_type")),
        "startDate": row.get("start_date"),
        "endDate": row.get("end_date"),
        "days": row.get("total_days"),
        "reason": row.get("reason"),
        "status": _frontend_status(row.get("status")),
        "appliedDate": row.get("applied_on"),
        "approvedBy": row.get("reviewed_by_name") or "-",
        "adminComment": row.get("admin_comment"),
    }


def _frontend_attendance_status(status):
    mapping = {
        "present": "On Time",
        "half-day": "Short Hours",
        "absent": "Absent",
        "leave": "Leave",
    }
    return mapping.get(status, _frontend_status(status))


def _frontend_attendance(row):
    record_id = row.get("attendance_id") or f"{row.get('employee_id')}-{row.get('attendance_date')}"
    hours = row.get("hours_worked")
    return {
        "key": str(record_id),
        "id": record_id,
        "empId": row.get("employee_id"),
        "name": row.get("full_name"),
        "date": row.get("attendance_date"),
        "checkIn": row.get("check_in") or "-",
        "checkOut": row.get("check_out") or "-",
        "workingHours": str(hours) if hours else "0 hrs",
        "totalHours": str(hours) if hours else "0 hrs",
        "breakHours": "0 hrs",
        "attendanceStatus": _frontend_attendance_status(row.get("status")),
        "status": _frontend_attendance_status(row.get("status")),
        "remarks": row.get("remarks"),
    }


def _payroll_month_name(month, year):
    try:
        import calendar
        return f"{calendar.month_name[int(month)]} {year}"
    except Exception:
        return f"{month}/{year}"


def _frontend_payroll(row):
    return {
        "payrollId": row.get("payroll_id"),
        "employeeId": row.get("employee_id"),
        "employeeName": row.get("full_name"),
        "department": row.get("department"),
        "month": _payroll_month_name(row.get("pay_month"), row.get("pay_year")),
        "basicSalary": _as_float(row.get("basic_salary")),
        "allowances": _as_float(row.get("allowances")),
        "deductions": _as_float(row.get("deductions")),
        "netSalary": _as_float(row.get("net_salary")),
        "paymentStatus": _frontend_status(row.get("pay_status")),
        "paymentDate": row.get("payment_date"),
    }


# ════════════════════════════════════════════════════════════
#  AUTH
# ════════════════════════════════════════════════════════════

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return err("email and password are required")

    db = get_db()
    user = db.get_user_by_email(email)
    if not user or not user["is_active"]:
        return err("Invalid credentials", 401)
    if not verify_password(password, user["password_hash"]):
        return err("Invalid credentials", 401)

    token = generate_token(user)
    user.pop("password_hash", None)
    return jsonify({"token": token, "user": user})


@app.route("/api/auth/me", methods=["GET"])
@token_required
def me():
    db = get_db()
    user = db.get_user_by_id(g.current_user["user_id"])
    if not user:
        return err("User not found", 404)
    user.pop("password_hash", None)
    return jsonify(user)


# ════════════════════════════════════════════════════════════
#  USERS
# ════════════════════════════════════════════════════════════

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    employee_id = data.get("employee_id") or data.get("employeeId") or data.get("id")
    full_name = data.get("full_name") or data.get("fullName") or data.get("name")
    job_title = data.get("job_title") or data.get("designation") or data.get("role")
    password = data.get("password") or "Password@123"
    role = str(data.get("systemRole") or data.get("accountRole") or "employee").lower()
    if role not in ("admin", "hr", "employee"):
        role = "employee"

    required = {
        "employee_id": employee_id,
        "full_name": full_name,
        "email": data.get("email"),
        "password": password,
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        return err(f"Missing fields: {', '.join(missing)}")

    db = get_db()
    if db.get_user_by_employee_id(employee_id):
        return err("employee_id already exists", 409)
    if db.get_user_by_email(data["email"]):
        return err("email already exists", 409)

    user_id = db.create_user(
        employee_id=employee_id,
        full_name=full_name,
        email=data["email"],
        password_hash=hash_password(password),
        role=role,
        department=data.get("department"),
        job_title=job_title,
        phone=data.get("phone"),
        address=data.get("address"),
        date_joined=data.get("date_joined") or data.get("joinDate"),
    )
    user = db.get_user_by_id(user_id)
    token = generate_token(user)
    user.pop("password_hash", None)
    return jsonify({"message": "Account created", "token": token, "user": user}), 201


@app.route("/api/auth/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out"})


@app.route("/api/users", methods=["GET"])
@token_required
@roles_required(*ADMIN_ROLES)
def list_users():
    db = get_db()
    include_inactive = request.args.get("include_inactive", "false").lower() == "true"
    return jsonify(db.get_all_users(include_inactive=include_inactive))


@app.route("/api/users", methods=["POST"])
@token_required
@roles_required(*ADMIN_ROLES)
def create_user():
    data = request.get_json(silent=True) or {}
    required = ["employee_id", "full_name", "email", "password", "role"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return err(f"Missing fields: {', '.join(missing)}")

    db = get_db()
    if db.get_user_by_employee_id(data["employee_id"]):
        return err("employee_id already exists", 409)
    if db.get_user_by_email(data["email"]):
        return err("email already exists", 409)

    new_id = db.create_user(
        employee_id=data["employee_id"],
        full_name=data["full_name"],
        email=data["email"],
        password_hash=hash_password(data["password"]),
        role=data["role"],
        department=data.get("department"),
        job_title=data.get("job_title"),
        phone=data.get("phone"),
        address=data.get("address"),
        date_joined=data.get("date_joined"),
    )
    return jsonify({"message": "User created", "user_id": new_id}), 201


@app.route("/api/users/<int:user_id>", methods=["GET"])
@token_required
@self_or_roles(lambda kw: kw["user_id"], *ADMIN_ROLES)
def get_user(user_id):
    db = get_db()
    user = db.get_user_by_id(user_id)
    if not user:
        return err("User not found", 404)
    user.pop("password_hash", None)
    return jsonify(user)


EMPLOYEE_EDITABLE_FIELDS = {"phone", "address", "profile_picture"}
ADMIN_EDITABLE_FIELDS = EMPLOYEE_EDITABLE_FIELDS | {
    "full_name", "email", "department", "job_title", "role",
}


@app.route("/api/users/<int:user_id>", methods=["PUT"])
@token_required
@self_or_roles(lambda kw: kw["user_id"], *ADMIN_ROLES)
def update_user(user_id):
    data = request.get_json(silent=True) or {}
    is_admin = g.current_user["role"] in ADMIN_ROLES
    allowed = ADMIN_EDITABLE_FIELDS if is_admin else EMPLOYEE_EDITABLE_FIELDS

    fields = {k: v for k, v in data.items() if k in allowed}
    if "password" in data:
        fields["password_hash"] = hash_password(data["password"])
    if not fields:
        return err(f"No editable fields provided. Allowed: {sorted(allowed)}")

    db = get_db()
    db.update_user(user_id, **fields)
    return jsonify({"message": "User updated"})


@app.route("/api/users/<int:user_id>/deactivate", methods=["PUT"])
@token_required
@roles_required(*ADMIN_ROLES)
def deactivate_user(user_id):
    db = get_db()
    rowcount = db.deactivate_user(user_id)
    if not rowcount:
        return err("User not found", 404)
    return jsonify({"message": "User deactivated"})


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@token_required
@roles_required("admin")
def delete_user(user_id):
    db = get_db()
    rowcount = db.delete_user(user_id)
    if not rowcount:
        return err("User not found", 404)
    return jsonify({"message": "User permanently deleted"})


# ════════════════════════════════════════════════════════════
#  ATTENDANCE
# ════════════════════════════════════════════════════════════

@app.route("/api/employees", methods=["GET"])
@token_required
def employees_directory():
    db = get_db()
    include_inactive = request.args.get("include_inactive", "false").lower() == "true"
    rows = db.get_employee_directory(include_inactive=include_inactive)
    return jsonify([_frontend_employee(row) for row in rows])


@app.route("/api/employees/<employee_id>", methods=["GET"])
@token_required
def employee_by_employee_id(employee_id):
    db = get_db()
    user = db.get_user_by_employee_id(employee_id)
    if not user:
        return err("Employee not found", 404)
    return jsonify(_frontend_employee(user))


@app.route("/api/employees", methods=["POST"])
@token_required
@roles_required(*ADMIN_ROLES)
def create_employee():
    data = request.get_json(silent=True) or {}
    employee_id = data.get("employee_id") or data.get("employeeId") or data.get("id")
    full_name = data.get("full_name") or data.get("fullName") or data.get("name")
    job_title = data.get("job_title") or data.get("designation") or data.get("role")
    password = data.get("password") or "Password@123"
    role = str(data.get("systemRole") or data.get("accountRole") or "employee").lower()
    if role not in ("admin", "hr", "employee"):
        role = "employee"

    required = {
        "employee_id": employee_id,
        "full_name": full_name,
        "email": data.get("email"),
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        return err(f"Missing fields: {', '.join(missing)}")

    db = get_db()
    if db.get_user_by_employee_id(employee_id):
        return err("employee_id already exists", 409)
    if db.get_user_by_email(data["email"]):
        return err("email already exists", 409)

    user_id = db.create_user(
        employee_id=employee_id,
        full_name=full_name,
        email=data["email"],
        password_hash=hash_password(password),
        role=role,
        department=data.get("department"),
        job_title=job_title,
        phone=data.get("phone"),
        address=data.get("address"),
        date_joined=data.get("date_joined") or data.get("joinDate"),
    )
    user = db.get_user_by_id(user_id)
    return jsonify(_frontend_employee(user)), 201


@app.route("/api/employees/<employee_id>", methods=["PUT"])
@token_required
def update_employee(employee_id):
    db = get_db()
    user = db.get_user_by_employee_id(employee_id)
    if not user:
        return err("Employee not found", 404)
    if g.current_user["user_id"] != user["user_id"] and g.current_user["role"] not in ADMIN_ROLES:
        return err("Insufficient permissions", 403)

    data = request.get_json(silent=True) or {}
    field_map = {
        "name": "full_name",
        "fullName": "full_name",
        "full_name": "full_name",
        "email": "email",
        "phone": "phone",
        "department": "department",
        "role": "job_title",
        "designation": "job_title",
        "job_title": "job_title",
        "address": "address",
        "profileImage": "profile_picture",
    }
    is_admin = g.current_user["role"] in ADMIN_ROLES
    employee_editable = {"phone", "address", "profile_picture"}
    fields = {}
    for incoming, db_field in field_map.items():
        if incoming in data and (is_admin or db_field in employee_editable):
            fields[db_field] = data[incoming]
    if "password" in data:
        fields["password_hash"] = hash_password(data["password"])
    if not fields:
        return err("No editable fields provided")

    db.update_user(user["user_id"], **fields)
    updated = db.get_user_by_employee_id(employee_id)
    return jsonify(_frontend_employee(updated))


@app.route("/api/employees/<employee_id>", methods=["DELETE"])
@token_required
@roles_required(*ADMIN_ROLES)
def delete_employee(employee_id):
    db = get_db()
    user = db.get_user_by_employee_id(employee_id)
    if not user:
        return err("Employee not found", 404)
    db.deactivate_user(user["user_id"])
    return jsonify({"success": True, "message": "Employee deactivated"})


@app.route("/api/attendance", methods=["GET"])
@token_required
def attendance_index():
    db = get_db()
    if g.current_user["role"] in ADMIN_ROLES:
        rows = db.get_attendance_history()
    else:
        rows = db.get_attendance(g.current_user["user_id"])
        for row in rows:
            row["employee_id"] = g.current_user["employee_id"]
            row["full_name"] = g.current_user.get("employee_id")
    return jsonify([_frontend_attendance(row) for row in rows])


@app.route("/api/attendance", methods=["POST"])
@token_required
def attendance_create():
    data = request.get_json(silent=True) or {}
    db = get_db()
    if "empId" in data and g.current_user["role"] in ADMIN_ROLES:
        user = db.get_user_by_employee_id(data["empId"])
        if not user:
            return err("Employee not found", 404)
        user_id = user["user_id"]
    else:
        user_id = g.current_user["user_id"]

    status_map = {
        "on time": "present",
        "late": "present",
        "short hours": "half-day",
        "absent": "absent",
        "leave": "leave",
    }
    status = status_map.get(str(data.get("status") or "").lower(), "present")
    db.mark_attendance(
        user_id=user_id,
        att_date=data.get("date") or data.get("attendance_date"),
        check_in=data.get("checkIn") if data.get("checkIn") != "-" else None,
        check_out=data.get("checkOut") if data.get("checkOut") != "-" else None,
        status=status,
        remarks=data.get("remarks"),
        recorded_by=g.current_user["user_id"],
    )
    return jsonify({"message": "Attendance recorded"}), 201


@app.route("/api/attendance/checkin", methods=["POST"])
@token_required
def checkin():
    db = get_db()
    data = request.get_json(silent=True) or {}
    db.check_in(g.current_user["user_id"], data.get("date"))
    return jsonify({"message": "Checked in"})


@app.route("/api/attendance/checkout", methods=["POST"])
@token_required
def checkout():
    db = get_db()
    data = request.get_json(silent=True) or {}
    rowcount = db.check_out(g.current_user["user_id"], data.get("date"))
    if not rowcount:
        return err("No matching check-in found for that date")
    return jsonify({"message": "Checked out"})


@app.route("/api/attendance/mark", methods=["POST"])
@token_required
@roles_required(*ADMIN_ROLES)
def mark_attendance():
    """Admin manually marks/overwrites an employee's attendance."""
    data = request.get_json(silent=True) or {}
    required = ["user_id", "attendance_date"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return err(f"Missing fields: {', '.join(missing)}")

    db = get_db()
    db.mark_attendance(
        user_id=data["user_id"],
        att_date=data["attendance_date"],
        check_in=data.get("check_in"),
        check_out=data.get("check_out"),
        status=data.get("status", "present"),
        remarks=data.get("remarks"),
        recorded_by=g.current_user["user_id"],
    )
    return jsonify({"message": "Attendance recorded"})


@app.route("/api/attendance/me", methods=["GET"])
@token_required
def my_attendance():
    db = get_db()
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    return jsonify(db.get_attendance(g.current_user["user_id"], month, year))


@app.route("/api/attendance/me/weekly", methods=["GET"])
@token_required
def my_weekly_attendance():
    db = get_db()
    return jsonify(db.get_weekly_attendance(g.current_user["user_id"]))


@app.route("/api/attendance/user/<int:user_id>", methods=["GET"])
@token_required
@self_or_roles(lambda kw: kw["user_id"], *ADMIN_ROLES)
def user_attendance(user_id):
    db = get_db()
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    return jsonify(db.get_attendance(user_id, month, year))


@app.route("/api/attendance/all", methods=["GET"])
@token_required
@roles_required(*ADMIN_ROLES)
def all_attendance():
    db = get_db()
    att_date = request.args.get("date")
    return jsonify(db.get_all_attendance(att_date))


@app.route("/api/attendance/summary", methods=["GET"])
@token_required
@roles_required(*ADMIN_ROLES)
def attendance_summary():
    db = get_db()
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    if not month or not year:
        return err("month and year query params are required")
    return jsonify(db.get_monthly_attendance_summary(month, year))


@app.route("/api/attendance/<int:user_id>/<att_date>", methods=["PUT"])
@token_required
@roles_required(*ADMIN_ROLES)
def correct_attendance(user_id, att_date):
    data = request.get_json(silent=True) or {}
    if not data:
        return err("No fields to update")
    db = get_db()
    rowcount = db.update_attendance(user_id, att_date, **data)
    if not rowcount:
        return err("Attendance record not found", 404)
    return jsonify({"message": "Attendance updated"})


@app.route("/api/attendance/<int:user_id>/<att_date>", methods=["DELETE"])
@token_required
@roles_required(*ADMIN_ROLES)
def remove_attendance(user_id, att_date):
    db = get_db()
    rowcount = db.delete_attendance(user_id, att_date)
    if not rowcount:
        return err("Attendance record not found", 404)
    return jsonify({"message": "Attendance record deleted"})


# ════════════════════════════════════════════════════════════
#  LEAVES
# ════════════════════════════════════════════════════════════

@app.route("/api/leaves", methods=["GET"])
@token_required
def leaves_index():
    db = get_db()
    if g.current_user["role"] in ADMIN_ROLES:
        rows = db.get_all_leaves()
    else:
        rows = db.get_employee_leaves(g.current_user["user_id"])
        for row in rows:
            row["employee_id"] = g.current_user["employee_id"]
            row["full_name"] = g.current_user.get("employee_id")
            row["reviewed_by_name"] = None
    return jsonify([_frontend_leave(row) for row in rows])


@app.route("/api/leaves/<leave_ref>", methods=["PATCH"])
@token_required
@roles_required(*ADMIN_ROLES)
def patch_leave_status(leave_ref):
    leave_id = str(leave_ref).replace("LV-", "")
    data = request.get_json(silent=True) or {}
    raw_status = str(data.get("status") or "").lower()
    status = {"approved": "approved", "rejected": "rejected"}.get(raw_status)
    if not status:
        return err("status must be Approved or Rejected")
    db = get_db()
    rowcount = db.review_leave(
        int(leave_id), status, g.current_user["user_id"], data.get("admin_comment", "")
    )
    if not rowcount:
        return err("Leave request not found", 404)
    return jsonify({"message": f"Leave {status}"})


@app.route("/api/leaves", methods=["POST"])
@token_required
def apply_leave():
    data = request.get_json(silent=True) or {}
    leave_type = data.get("leave_type") or data.get("type")
    start_date = data.get("start_date") or data.get("startDate")
    end_date = data.get("end_date") or data.get("endDate")
    reason = data.get("reason")
    required = {
        "leave_type": leave_type,
        "start_date": start_date,
        "end_date": end_date,
        "reason": reason,
    }
    missing = [f for f, value in required.items() if not value]
    if missing:
        return err(f"Missing fields: {', '.join(missing)}")

    db = get_db()
    new_id = db.apply_leave(
        user_id=g.current_user["user_id"],
        leave_type=_db_leave_type(leave_type),
        start_date=start_date,
        end_date=end_date,
        reason=reason,
    )
    return jsonify({"message": "Leave request submitted", "leave_id": new_id, "id": f"LV-{new_id}"}), 201


@app.route("/api/leaves/me", methods=["GET"])
@token_required
def my_leaves():
    db = get_db()
    return jsonify(db.get_employee_leaves(g.current_user["user_id"]))


@app.route("/api/leaves/user/<int:user_id>", methods=["GET"])
@token_required
@self_or_roles(lambda kw: kw["user_id"], *ADMIN_ROLES)
def user_leaves(user_id):
    db = get_db()
    return jsonify(db.get_employee_leaves(user_id))


@app.route("/api/leaves/pending", methods=["GET"])
@token_required
@roles_required(*ADMIN_ROLES)
def pending_leaves():
    db = get_db()
    return jsonify(db.get_pending_leaves())


@app.route("/api/leaves/summary", methods=["GET"])
@token_required
@roles_required(*ADMIN_ROLES)
def leave_summary():
    db = get_db()
    year = request.args.get("year", type=int)
    return jsonify(db.get_leave_summary(year))


@app.route("/api/leaves/<int:leave_id>/review", methods=["PUT"])
@token_required
@roles_required(*ADMIN_ROLES)
def review_leave(leave_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("approved", "rejected"):
        return err("status must be 'approved' or 'rejected'")

    db = get_db()
    rowcount = db.review_leave(
        leave_id, status, g.current_user["user_id"], data.get("admin_comment", "")
    )
    if not rowcount:
        return err("Leave request not found", 404)
    return jsonify({"message": f"Leave {status}"})


@app.route("/api/leaves/<int:leave_id>", methods=["DELETE"])
@token_required
def cancel_leave(leave_id):
    db = get_db()
    is_admin = g.current_user["role"] in ADMIN_ROLES
    # Employees may only cancel their own pending leave; admins can cancel any pending leave.
    user_id_filter = None if is_admin else g.current_user["user_id"]
    rowcount = db.cancel_leave(leave_id, user_id=user_id_filter)
    if not rowcount:
        return err("Leave not found, not pending, or not yours to cancel", 404)
    return jsonify({"message": "Leave cancelled"})


# ════════════════════════════════════════════════════════════
#  PAYROLL
# ════════════════════════════════════════════════════════════

@app.route("/api/payroll", methods=["GET"])
@token_required
def payroll_index():
    db = get_db()
    if g.current_user["role"] in ADMIN_ROLES:
        rows = db.get_all_payroll()
    else:
        rows = db.get_employee_payroll(g.current_user["user_id"])
        for row in rows:
            row["employee_id"] = g.current_user["employee_id"]
            row["full_name"] = g.current_user.get("employee_id")
            row["department"] = None
    return jsonify([_frontend_payroll(row) for row in rows])


@app.route("/api/payroll/download/<month>", methods=["GET"])
@token_required
def download_payslip(month):
    return jsonify({"message": "Payslip generation is not configured yet", "month": month})


@app.route("/api/payroll", methods=["POST"])
@token_required
@roles_required(*ADMIN_ROLES)
def create_payroll():
    data = request.get_json(silent=True) or {}
    required = ["user_id", "pay_month", "pay_year", "basic_salary", "allowances", "deductions"]
    missing = [f for f in required if data.get(f) is None]
    if missing:
        return err(f"Missing fields: {', '.join(missing)}")

    db = get_db()
    new_id = db.create_payroll(
        user_id=data["user_id"], pay_month=data["pay_month"], pay_year=data["pay_year"],
        basic_salary=data["basic_salary"], allowances=data["allowances"], deductions=data["deductions"],
        created_by=g.current_user["user_id"], pay_status=data.get("pay_status", "pending"),
        notes=data.get("notes", ""),
    )
    return jsonify({"message": "Payroll record created", "payroll_id": new_id}), 201


@app.route("/api/payroll/bulk-generate", methods=["POST"])
@token_required
@roles_required(*ADMIN_ROLES)
def bulk_generate_payroll():
    data = request.get_json(silent=True) or {}
    month, year = data.get("pay_month"), data.get("pay_year")
    if not month or not year:
        return err("pay_month and pay_year are required")
    db = get_db()
    rowcount = db.bulk_generate_payroll(month, year, g.current_user["user_id"])
    return jsonify({"message": f"Generated/updated {rowcount} payroll records"})


@app.route("/api/payroll/me", methods=["GET"])
@token_required
def my_payroll():
    db = get_db()
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    return jsonify(db.get_employee_payroll(g.current_user["user_id"], month, year))


@app.route("/api/payroll/user/<int:user_id>", methods=["GET"])
@token_required
@self_or_roles(lambda kw: kw["user_id"], *ADMIN_ROLES)
def user_payroll(user_id):
    db = get_db()
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    return jsonify(db.get_employee_payroll(user_id, month, year))


@app.route("/api/payroll/summary", methods=["GET"])
@token_required
@roles_required(*ADMIN_ROLES)
def payroll_summary():
    db = get_db()
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    if not month or not year:
        return err("month and year query params are required")
    return jsonify(db.get_payroll_summary(month, year))


@app.route("/api/payroll/total-cost", methods=["GET"])
@token_required
@roles_required(*ADMIN_ROLES)
def total_payroll_cost():
    db = get_db()
    return jsonify(db.get_total_payroll_cost())


@app.route("/api/payroll/<int:payroll_id>", methods=["PUT"])
@token_required
@roles_required(*ADMIN_ROLES)
def update_payroll(payroll_id):
    data = request.get_json(silent=True) or {}
    if not data:
        return err("No fields to update")
    db = get_db()
    rowcount = db.update_payroll(payroll_id, **data)
    if not rowcount:
        return err("Payroll record not found", 404)
    return jsonify({"message": "Payroll updated"})


@app.route("/api/payroll/mark-paid", methods=["PUT"])
@token_required
@roles_required(*ADMIN_ROLES)
def mark_payroll_paid():
    data = request.get_json(silent=True) or {}
    month, year = data.get("pay_month"), data.get("pay_year")
    if not month or not year:
        return err("pay_month and pay_year are required")
    db = get_db()
    rowcount = db.mark_payroll_paid(month, year)
    return jsonify({"message": f"Marked {rowcount} payroll record(s) as paid"})


@app.route("/api/payroll/<int:payroll_id>", methods=["DELETE"])
@token_required
@roles_required(*ADMIN_ROLES)
def delete_payroll(payroll_id):
    db = get_db()
    rowcount = db.delete_payroll(payroll_id)
    if not rowcount:
        return err("Payroll record not found", 404)
    return jsonify({"message": "Payroll record deleted"})


# ════════════════════════════════════════════════════════════
#  DASHBOARD
# ════════════════════════════════════════════════════════════

@app.route("/api/dashboard/me", methods=["GET"])
@token_required
def my_dashboard():
    db = get_db()
    return jsonify(db.get_employee_dashboard(g.current_user["user_id"]))


@app.route("/api/dashboard/user/<int:user_id>", methods=["GET"])
@token_required
@self_or_roles(lambda kw: kw["user_id"], *ADMIN_ROLES)
def user_dashboard(user_id):
    db = get_db()
    return jsonify(db.get_employee_dashboard(user_id))


# ════════════════════════════════════════════════════════════
#  HEALTH CHECK
# ════════════════════════════════════════════════════════════

@app.route("/api/dashboard/stats", methods=["GET"])
@token_required
def dashboard_stats():
    db = get_db()
    stats = db.get_dashboard_stats()
    return jsonify({
        "totalEmployees": stats.get("total_employees", 0),
        "activeEmployees": stats.get("active_employees", 0),
        "presentToday": stats.get("present_today", 0),
        "absentToday": stats.get("absent_today", 0),
        "employeesOnLeave": stats.get("employees_on_leave", 0),
        "pendingLeaveRequests": stats.get("pending_leave_requests", 0),
        "monthlyPayroll": _as_float(stats.get("monthly_payroll")),
        "totalDepartments": stats.get("total_departments", 0),
        "newEmployeesThisMonth": stats.get("new_employees_this_month", 0),
    })


@app.route("/api/profile", methods=["GET"])
@token_required
def profile():
    db = get_db()
    user = db.get_user_by_id(g.current_user["user_id"])
    if not user:
        return err("User not found", 404)
    user.pop("password_hash", None)
    return jsonify(_frontend_employee(user))


@app.route("/api/profile", methods=["PUT"])
@token_required
def update_profile():
    data = request.get_json(silent=True) or {}
    allowed = {
        "name": "full_name",
        "fullName": "full_name",
        "phone": "phone",
        "address": "address",
        "profileImage": "profile_picture",
    }
    fields = {db_field: data[incoming] for incoming, db_field in allowed.items() if incoming in data}
    if "password" in data:
        fields["password_hash"] = hash_password(data["password"])
    if not fields:
        return err("No editable fields provided")
    db = get_db()
    db.update_user(g.current_user["user_id"], **fields)
    user = db.get_user_by_id(g.current_user["user_id"])
    return jsonify(_frontend_employee(user))


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.errorhandler(404)
def not_found(e):
    return err("Not found", 404)


@app.errorhandler(500)
def server_error(e):
    return err("Internal server error", 500)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
