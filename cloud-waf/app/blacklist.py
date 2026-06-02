"""
Blacklist / Auto-ban
====================
Tracks per-IP attack counts and applies graduated ban durations:
  1st ban  → 1 minute
  2nd ban  → 5 minutes
  3rd ban  → 1 hour
  4th+ ban → 24 hours

Thread-safe via a reentrant lock.
Includes a static (permanent) blacklist loaded from config.
"""

import threading
from time import time
from dataclasses import dataclass, field

from config import (
    BLACKLIST_MAX_ATTACKS,
    BLACKLIST_BAN_DURATIONS,
    STATIC_BLACKLIST_IPS,
    WHITELIST_IPS,
)


@dataclass
class _IPRecord:
    attack_count: int = 0          # attacks in the current "free" window
    ban_count: int = 0             # total times this IP has been banned
    ban_expires_at: float = 0.0    # epoch seconds; 0 = not currently banned


_lock = threading.RLock()
_records: dict[str, _IPRecord] = {}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_record(ip: str) -> _IPRecord:
    if ip not in _records:
        _records[ip] = _IPRecord()
    return _records[ip]


def _ban_duration_for(ban_count: int) -> int:
    """Return the ban duration (seconds) for the nth offence."""
    index = min(ban_count, len(BLACKLIST_BAN_DURATIONS) - 1)
    return BLACKLIST_BAN_DURATIONS[index]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def record_attack(ip: str) -> None:
    """
    Increment the attack counter for *ip*.
    If it reaches ``BLACKLIST_MAX_ATTACKS``, apply a graduated ban.
    Whitelisted IPs are never banned.
    """
    if ip in WHITELIST_IPS:
        return

    with _lock:
        rec = _get_record(ip)
        rec.attack_count += 1

        if rec.attack_count >= BLACKLIST_MAX_ATTACKS:
            duration = _ban_duration_for(rec.ban_count)
            rec.ban_expires_at = time() + duration
            rec.ban_count += 1
            rec.attack_count = 0  # reset counter for next offence window


def is_blacklisted(ip: str) -> bool:
    """
    Return ``True`` if *ip* is currently banned.

    Handles three cases:
    1. Static / permanent ban (from config).
    2. Active timed ban (ban_expires_at in the future).
    3. Expired ban — clears it automatically.
    """
    if ip in STATIC_BLACKLIST_IPS:
        return True

    if ip in WHITELIST_IPS:
        return False

    with _lock:
        if ip not in _records:
            return False

        rec = _records[ip]

        if rec.ban_expires_at == 0.0:
            return False

        if time() < rec.ban_expires_at:
            return True

        # Ban expired — reset for a fresh window (but keep ban_count for escalation)
        rec.ban_expires_at = 0.0
        rec.attack_count = 0
        return False


def get_ban_info(ip: str) -> dict:
    """
    Return a dict with ban metadata for *ip*.
    Useful for the dashboard API.
    """
    if ip in STATIC_BLACKLIST_IPS:
        return {"ip": ip, "permanent": True, "expires_at": None, "ban_count": -1}

    with _lock:
        rec = _records.get(ip)
        if rec is None:
            return {"ip": ip, "permanent": False, "expires_at": None, "ban_count": 0}
        return {
            "ip": ip,
            "permanent": False,
            "expires_at": rec.ban_expires_at if rec.ban_expires_at > time() else None,
            "ban_count": rec.ban_count,
        }


def get_blacklisted_ips() -> list[str]:
    """Return all currently banned IPs (dynamic + static)."""
    current_time = time()
    with _lock:
        dynamic = [
            ip for ip, rec in _records.items()
            if rec.ban_expires_at > current_time
        ]
    return list(STATIC_BLACKLIST_IPS) + dynamic


def manually_ban(ip: str, duration_seconds: int = 3600) -> None:
    """Manually ban an IP for a given duration (default 1 hour)."""
    with _lock:
        rec = _get_record(ip)
        rec.ban_expires_at = time() + duration_seconds
        rec.ban_count += 1


def manually_unban(ip: str) -> None:
    """Lift a dynamic ban from *ip* immediately."""
    with _lock:
        if ip in _records:
            _records[ip].ban_expires_at = 0.0
            _records[ip].attack_count = 0