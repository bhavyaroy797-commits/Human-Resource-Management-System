import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()


class _DbConnection:
    def __init__(self):
        self._connection = mysql.connector.connect(
            host=os.getenv("MYSQL_HOST", "localhost"),   # fixed: was "3306"
            port=int(os.getenv("MYSQL_PORT", "3306")),
            user=os.getenv("MYSQL_USER", "root"),
            password=os.getenv("MYSQL_PASSWORD", ""),    # fixed: use .env
            database=os.getenv("MYSQL_DB", "hrms_db")
        )

    def execute(self, query, params=(), fetch=False):
        """Execute a query and optionally return results."""
        cursor = self._connection.cursor(dictionary=True)
        try:
            cursor.execute(query, params)
            if fetch:
                return cursor.fetchall()
            self._connection.commit()
            return cursor.lastrowid
        except Error as e:
            self._connection.rollback()
            raise e
        finally:
            cursor.close()

    def fetchone(self, query, params=()):
        """Fetch a single row."""
        cursor = self._connection.cursor(dictionary=True)
        try:
            cursor.execute(query, params)
            return cursor.fetchone()
        finally:
            cursor.close()

    def close(self):
        self._connection.close()

_db_instance = None

def get_db():
    global _db_instance
    if _db_instance is None or not _db_instance._connection.is_connected():
        _db_instance = _DbConnection()
    return _db_instance
