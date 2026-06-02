"""
Database
========
SQLite-backed persistent attack log with:
- Thread-safe connection-per-thread pool (check_same_thread=False + WAL mode)
- Indexes on ip, attack_type, and timestamp for fast dashboard queries
- Helper to purge old records (data-retention / GDPR support)
- New queries: recent attacks, attacks per hour, banned-IP history
"""

import sqlite3
import threading
from datetime import datetime, timezone, timedelta

from config import DATABASE_NAME


# ---------------------------------------------------------------------------
# Connection pool (one connection per thread)
# ---------------------------------------------------------------------------

_local = threading.local()


def _get_connection() -> sqlite3.Connection:
    """Return a thread-local SQLite connection."""
    conn = getattr(_local, "connection", None)
    if conn is None:
        conn = sqlite3.connect(DATABASE_NAME, check_same_thread=False)
        conn.row_factory = sqlite3.Row          # rows behave like dicts
        conn.execute("PRAGMA journal_mode=WAL")  # concurrent reads + writes
        conn.execute("PRAGMA foreign_keys=ON")
        _local.connection = conn
    return conn


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

def init_db() -> None:
    """Create tables and indexes if they don't already exist."""
    conn = _get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS attacks (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            ip           TEXT    NOT NULL,
            attack_type  TEXT    NOT NULL,
            payload      TEXT,
            severity     INTEGER DEFAULT 0,
            path         TEXT    DEFAULT '',
            method       TEXT    DEFAULT '',
            request_id   TEXT    DEFAULT '',
            timestamp    DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_attacks_ip
            ON attacks (ip);

        CREATE INDEX IF NOT EXISTS idx_attacks_type
            ON attacks (attack_type);

        CREATE INDEX IF NOT EXISTS idx_attacks_ts
            ON attacks (timestamp DESC);

        CREATE TABLE IF NOT EXISTS banned_ips (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ip          TEXT    NOT NULL,
            ban_count   INTEGER DEFAULT 1,
            last_banned DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at  DATETIME
        );

        CREATE INDEX IF NOT EXISTS idx_banned_ip
            ON banned_ips (ip);
    """)
    conn.commit()


# ---------------------------------------------------------------------------
# Write helpers
# ---------------------------------------------------------------------------

def log_attack_to_db(
    ip: str,
    attack_type: str,
    payload: str,
    *,
    severity: int = 0,
    path: str = "",
    method: str = "",
    request_id: str = "",
) -> None:
    conn = _get_connection()
    conn.execute(
        """
        INSERT INTO attacks (ip, attack_type, payload, severity, path, method, request_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (ip, attack_type, payload[:4096], severity, path, method, request_id),
    )
    conn.commit()


def log_ban_to_db(ip: str, ban_count: int, expires_at: datetime | None) -> None:
    """Record or update a ban event in the banned_ips table."""
    conn = _get_connection()
    conn.execute(
        """
        INSERT INTO banned_ips (ip, ban_count, expires_at)
        VALUES (?, ?, ?)
        """,
        (ip, ban_count, expires_at.isoformat() if expires_at else None),
    )
    conn.commit()


# ---------------------------------------------------------------------------
# Read helpers
# ---------------------------------------------------------------------------

def get_all_attacks(limit: int = 500) -> list[dict]:
    conn = _get_connection()
    rows = conn.execute(
        "SELECT * FROM attacks ORDER BY timestamp DESC LIMIT ?", (limit,)
    ).fetchall()
    return [dict(r) for r in rows]


def get_recent_attacks(minutes: int = 60) -> list[dict]:
    """Return attacks from the last *minutes* minutes."""
    since = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
    conn = _get_connection()
    rows = conn.execute(
        "SELECT * FROM attacks WHERE timestamp >= ? ORDER BY timestamp DESC", (since,)
    ).fetchall()
    return [dict(r) for r in rows]


def get_attack_stats() -> dict[str, int]:
    """Return a mapping of attack_type → count."""
    conn = _get_connection()
    rows = conn.execute(
        "SELECT attack_type, COUNT(*) AS cnt FROM attacks GROUP BY attack_type"
    ).fetchall()
    return {r["attack_type"]: r["cnt"] for r in rows}


def get_attacks_per_hour(hours: int = 24) -> list[dict]:
    """Return attack counts bucketed by hour for the last *hours* hours."""
    since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
    conn = _get_connection()
    rows = conn.execute(
        """
        SELECT strftime('%Y-%m-%dT%H:00:00', timestamp) AS hour,
               COUNT(*) AS count
        FROM   attacks
        WHERE  timestamp >= ?
        GROUP  BY hour
        ORDER  BY hour
        """,
        (since,),
    ).fetchall()
    return [dict(r) for r in rows]


def get_top_attackers(limit: int = 20) -> list[dict]:
    conn = _get_connection()
    rows = conn.execute(
        """
        SELECT ip, COUNT(*) AS attacks_count, MAX(timestamp) AS last_seen
        FROM   attacks
        GROUP  BY ip
        ORDER  BY attacks_count DESC
        LIMIT  ?
        """,
        (limit,),
    ).fetchall()
    return [dict(r) for r in rows]


def get_attacker_history(ip: str) -> list[dict]:
    """Return all attacks from a specific IP."""
    conn = _get_connection()
    rows = conn.execute(
        "SELECT * FROM attacks WHERE ip = ? ORDER BY timestamp DESC", (ip,)
    ).fetchall()
    return [dict(r) for r in rows]


def purge_old_records(days: int = 90) -> int:
    """
    Delete attack records older than *days* days.
    Returns the number of deleted rows.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    conn = _get_connection()
    cursor = conn.execute("DELETE FROM attacks WHERE timestamp < ?", (cutoff,))
    conn.commit()
    return cursor.rowcount