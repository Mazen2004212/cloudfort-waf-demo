"""
Logger
======
Structured JSON logging with automatic log rotation.
Each log entry is a single JSON line (JSONL format) for easy ingestion
by log aggregators (Elasticsearch, Loki, Splunk, etc.).

Uses Python's built-in RotatingFileHandler so the log directory never
fills the disk.
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler

from config import LOG_DIR, LOG_FILE, LOG_MAX_BYTES, LOG_BACKUP_COUNT


# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

os.makedirs(LOG_DIR, exist_ok=True)

_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=LOG_MAX_BYTES,
    backupCount=LOG_BACKUP_COUNT,
    encoding="utf-8",
)

_logger = logging.getLogger("waf")
_logger.setLevel(logging.INFO)
_logger.addHandler(_handler)
# Also echo to stdout so docker logs / systemd journal pick it up
_logger.addHandler(logging.StreamHandler())


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _write(record: dict) -> None:
    """Serialise *record* as a single JSON line."""
    _logger.info(json.dumps(record, ensure_ascii=False, default=str))


def log_attack(
    ip: str,
    attack_type: str,
    payload: str,
    *,
    request_id: str | None = None,
    severity_score: int = 0,
    matched_patterns: list[str] | None = None,
    path: str = "",
    method: str = "",
    user_agent: str = "",
) -> None:
    """Log a detected attack as a structured JSON record."""
    _write({
        "event": "attack_detected",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": request_id or str(uuid.uuid4()),
        "ip": ip,
        "attack_type": attack_type,
        "severity_score": severity_score,
        "matched_patterns": matched_patterns or [],
        "path": path,
        "method": method,
        "user_agent": user_agent,
        # Truncate very long payloads so we don't write megabytes to disk
        "payload": payload[:2048] + ("…" if len(payload) > 2048 else ""),
    })


def log_blocked(
    ip: str,
    reason: str,
    *,
    request_id: str | None = None,
    path: str = "",
    method: str = "",
) -> None:
    """Log a request that was blocked (blacklist / rate-limit)."""
    _write({
        "event": "request_blocked",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": request_id or str(uuid.uuid4()),
        "ip": ip,
        "reason": reason,
        "path": path,
        "method": method,
    })


def log_request(
    ip: str,
    *,
    request_id: str,
    path: str = "",
    method: str = "",
    status_code: int = 0,
    duration_ms: float = 0.0,
) -> None:
    """Log a forwarded (clean) request for audit / access-log purposes."""
    _write({
        "event": "request_forwarded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": request_id,
        "ip": ip,
        "path": path,
        "method": method,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
    })