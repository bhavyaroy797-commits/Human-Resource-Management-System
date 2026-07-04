"""
JWT authentication helpers and role-based access decorators for the HRMS API.
"""

import os
import jwt
import bcrypt
from functools import wraps
from datetime import datetime, timedelta, timezone
from flask import request, jsonify, g
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", 8))


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def generate_token(user):
    payload = {
        "user_id": user["user_id"],
        "employee_id": user["employee_id"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token):
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def token_required(f):
    """Requires a valid Bearer JWT. Populates g.current_user with {user_id, employee_id, role}."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        g.current_user = payload
        return f(*args, **kwargs)
    return decorated


def roles_required(*allowed_roles):
    """Stack after @token_required. Restricts access to given roles (e.g. 'admin', 'hr')."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if g.current_user.get("role") not in allowed_roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def self_or_roles(get_target_user_id, *allowed_roles):
    """
    Allows access if the caller IS the target user_id, OR has one of allowed_roles.
    get_target_user_id(kwargs) -> int, extracts the target user_id from the route's kwargs.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            target_id = get_target_user_id(kwargs)
            if g.current_user.get("user_id") == target_id or g.current_user.get("role") in allowed_roles:
                return f(*args, **kwargs)
            return jsonify({"error": "Insufficient permissions"}), 403
        return decorated
    return decorator
