"""
Rate Limiter
============
Sliding-window rate limiter with:
- Standard limit for all routes
- Tighter limit for sensitive paths (auth endpoints, etc.)
- Thread-safe in-memory store
- Automatic stale-entry cleanup
"""

import threading
from time import time
from collections import deque

from config import (
    RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_SENSITIVE_MAX_REQUESTS,
    RATE_LIMIT_SENSITIVE_PATHS,
    WHITELIST_IPS,
)


_lock = threading.RLock()

# ip -> deque of request timestamps (most recent last)
_requests: dict[str, deque[float]] = {}

# Cleanup: remove IPs whose last request is older than this many seconds
_CLEANUP_AFTER_SECONDS = RATE_LIMIT_WINDOW_SECONDS * 10


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_sensitive_path(path: str) -> bool:
    return any(path.startswith(p) for p in RATE_LIMIT_SENSITIVE_PATHS)


def _cleanup_stale_entries() -> None:
    """Periodically purge IPs with no recent activity to keep memory bounded."""
    cutoff = time() - _CLEANUP_AFTER_SECONDS
    stale = [ip for ip, dq in _requests.items() if not dq or dq[-1] < cutoff]
    for ip in stale:
        del _requests[ip]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def is_rate_limited(ip: str, path: str = "/") -> bool:
    """
    Return ``True`` if *ip* has exceeded the request limit for *path*.

    - Whitelisted IPs are never rate-limited.
    - Sensitive paths use a tighter limit (``RATE_LIMIT_SENSITIVE_MAX_REQUESTS``).
    - Uses a sliding-window algorithm: only timestamps within
      ``RATE_LIMIT_WINDOW_SECONDS`` are counted.
    """
    if ip in WHITELIST_IPS:
        return False

    limit = (
        RATE_LIMIT_SENSITIVE_MAX_REQUESTS
        if _is_sensitive_path(path)
        else RATE_LIMIT_MAX_REQUESTS
    )

    now = time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS

    with _lock:
        if ip not in _requests:
            _requests[ip] = deque()

        dq = _requests[ip]

        # Drop timestamps outside the sliding window
        while dq and dq[0] < window_start:
            dq.popleft()

        dq.append(now)

        # Occasional cleanup (every ~200 new requests)
        if len(_requests) % 200 == 0:
            _cleanup_stale_entries()

        return len(dq) > limit


def get_request_count(ip: str) -> int:
    """Return the number of requests *ip* has made in the current window."""
    now = time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    with _lock:
        dq = _requests.get(ip, deque())
        return sum(1 for ts in dq if ts >= window_start)