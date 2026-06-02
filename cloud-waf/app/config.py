"""
WAF Configuration
=================
Central place for all tunable parameters.
Override any value via environment variables (see comments).
"""

import os


def _csv_env(name: str, default: str = "") -> list[str]:
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]


# ---------------------------------------------------------------------------
# Rate Limiting
# ---------------------------------------------------------------------------
# Max requests an IP may make within TIME_WINDOW seconds before being throttled
RATE_LIMIT_MAX_REQUESTS: int = int(os.getenv("WAF_RATE_LIMIT_MAX_REQUESTS", 30))
# Sliding-window size in seconds
RATE_LIMIT_WINDOW_SECONDS: int = int(os.getenv("WAF_RATE_LIMIT_WINDOW", 10))
# Separate, tighter limit for sensitive paths (login, register, reset-password …)
RATE_LIMIT_SENSITIVE_MAX_REQUESTS: int = int(os.getenv("WAF_RATE_LIMIT_SENSITIVE", 5))
RATE_LIMIT_SENSITIVE_PATHS: list[str] = [
    "/login", "/register", "/reset-password", "/api/auth"
]

# ---------------------------------------------------------------------------
# Blacklist / Auto-ban
# ---------------------------------------------------------------------------
# Number of detected attacks before an IP is auto-banned
BLACKLIST_MAX_ATTACKS: int = int(os.getenv("WAF_BLACKLIST_MAX_ATTACKS", 3))
# How long (seconds) an IP stays banned — escalates with repeated offences
BLACKLIST_BAN_DURATIONS: list[int] = [60, 300, 3600, 86400]  # 1m / 5m / 1h / 1d
WHITELIST_IPS: set[str] = set(
    filter(None, os.getenv("WAF_WHITELIST_IPS", "").split(","))
)
# IPs that are PERMANENTLY blocked regardless of attack count
STATIC_BLACKLIST_IPS: set[str] = set(
    filter(None, os.getenv("WAF_STATIC_BLACKLIST", "").split(","))
)

# ---------------------------------------------------------------------------
# Proxy / Target
# ---------------------------------------------------------------------------
TARGET_SERVER: str = os.getenv("WAF_TARGET_SERVER", "http://localhost:9000")
# Seconds before giving up on the upstream request
PROXY_TIMEOUT_SECONDS: float = float(os.getenv("WAF_PROXY_TIMEOUT", 10.0))

# Comma-separated dashboard origins allowed to call the /waf/* API.
CORS_ALLOW_ORIGINS: list[str] = _csv_env(
    "WAF_CORS_ALLOW_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:8000,http://localhost:9000",
)

# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------
# Minimum score to block a request (each matched pattern adds its severity weight)
DETECTION_BLOCK_THRESHOLD: int = int(os.getenv("WAF_BLOCK_THRESHOLD", 3))
# Maximum payload body size (bytes) inspected — anything larger is truncated
MAX_BODY_INSPECT_BYTES: int = int(os.getenv("WAF_MAX_BODY_INSPECT", 65_536))  # 64 KB

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_DIR: str = os.getenv("WAF_LOG_DIR", "logs")
LOG_FILE: str = os.path.join(LOG_DIR, "waf.log")
# Maximum bytes before the log file is rotated
LOG_MAX_BYTES: int = int(os.getenv("WAF_LOG_MAX_BYTES", 10_485_760))  # 10 MB
LOG_BACKUP_COUNT: int = int(os.getenv("WAF_LOG_BACKUP_COUNT", 5))

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASE_NAME: str = os.getenv("WAF_DB_NAME", "waf.db")

# ---------------------------------------------------------------------------
# Security Headers (added to every proxied response)
# ---------------------------------------------------------------------------
SECURITY_HEADERS: dict[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self'; "
        "object-src 'none';"
    ),
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
}
