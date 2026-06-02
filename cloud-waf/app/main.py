"""
WAF Main — FastAPI application
==============================
Request pipeline (in order):
  1. Generate request_id for full tracing
  2. Whitelist check (always allow)
  3. Static blacklist check
  4. Dynamic blacklist (auto-ban) check
  5. Rate limiting (per-route)
  6. Attack detection (scored, multi-category)
  7. Forward clean request to TARGET_SERVER
  8. Inject security headers into the response

Dashboard endpoints are grouped under /waf/* to keep them separate
from the proxy catch-all route.
"""

import time
import uuid
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from blacklist import (
    is_blacklisted,
    record_attack,
    get_blacklisted_ips,
    get_ban_info,
    manually_ban,
    manually_unban,
)
from config import (
    TARGET_SERVER,
    PROXY_TIMEOUT_SECONDS,
    MAX_BODY_INSPECT_BYTES,
    SECURITY_HEADERS,
    WHITELIST_IPS,
    CORS_ALLOW_ORIGINS,
)
from database import (
    init_db,
    log_attack_to_db,
    log_ban_to_db,
    get_all_attacks,
    get_recent_attacks,
    get_attack_stats,
    get_attacks_per_hour,
    get_top_attackers,
    get_attacker_history,
    purge_old_records,
)
from detector import detect_attack
from logger import log_attack, log_blocked, log_request
from rate_limiter import is_rate_limited, get_request_count


# ---------------------------------------------------------------------------
# Lifespan (replaces deprecated @app.on_event)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
    # Shutdown hooks could go here (flush caches, close connections, etc.)


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Professional WAF",
    description="Web Application Firewall with attack detection, rate limiting, and auto-banning.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

DASHBOARD_DIR = os.getenv("WAF_DASHBOARD_DIR")
if DASHBOARD_DIR and os.path.exists(os.path.join(DASHBOARD_DIR, "index.html")):
    assets_dir = os.path.join(DASHBOARD_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/dashboard/assets", StaticFiles(directory=assets_dir), name="dashboard_assets")

    @app.get("/dashboard", include_in_schema=False)
    def dashboard_redirect():
        return RedirectResponse("/dashboard/")

    @app.get("/dashboard/{full_path:path}", include_in_schema=False)
    def dashboard_app(full_path: str):
        return FileResponse(os.path.join(DASHBOARD_DIR, "index.html"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_client_ip(request: Request) -> str:
    """
    Resolve the real client IP.
    Respects X-Forwarded-For when running behind a trusted reverse proxy.
    """
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host


def _apply_security_headers(response: Response) -> Response:
    for key, value in SECURITY_HEADERS.items():
        response.headers[key] = value
    return response


# ---------------------------------------------------------------------------
# Dashboard / admin routes  (/waf/*)
# ---------------------------------------------------------------------------

@app.get("/waf/attacks", tags=["Dashboard"])
def api_attacks(limit: int = 200):
    return get_all_attacks(limit=limit)


@app.get("/waf/attacks/recent", tags=["Dashboard"])
def api_recent_attacks(minutes: int = 60):
    return get_recent_attacks(minutes=minutes)


@app.get("/waf/stats", tags=["Dashboard"])
def api_stats():
    return get_attack_stats()


@app.get("/waf/stats/hourly", tags=["Dashboard"])
def api_hourly_stats(hours: int = 24):
    return get_attacks_per_hour(hours=hours)


@app.get("/waf/top-attackers", tags=["Dashboard"])
def api_top_attackers(limit: int = 20):
    return get_top_attackers(limit=limit)


@app.get("/waf/attacker/{ip}", tags=["Dashboard"])
def api_attacker_history(ip: str):
    return get_attacker_history(ip)


@app.get("/waf/blacklist", tags=["Dashboard"])
def api_blacklist():
    ips = get_blacklisted_ips()
    return {"count": len(ips), "blacklisted_ips": ips}


@app.get("/waf/blacklist/{ip}", tags=["Dashboard"])
def api_ban_info(ip: str):
    return get_ban_info(ip)


@app.post("/waf/blacklist/{ip}", tags=["Admin"])
def api_manual_ban(ip: str, duration_seconds: int = 3600):
    """Manually ban an IP for *duration_seconds* seconds (default 1 h)."""
    manually_ban(ip, duration_seconds)
    log_blocked(ip, reason="manual_ban", path="admin", method="POST")
    return {"status": "banned", "ip": ip, "duration_seconds": duration_seconds}


@app.delete("/waf/blacklist/{ip}", tags=["Admin"])
def api_manual_unban(ip: str):
    """Lift a dynamic ban from an IP immediately."""
    manually_unban(ip)
    return {"status": "unbanned", "ip": ip}


@app.get("/waf/rate/{ip}", tags=["Dashboard"])
def api_rate_info(ip: str):
    return {"ip": ip, "current_window_requests": get_request_count(ip)}


@app.delete("/waf/purge", tags=["Admin"])
def api_purge(days: int = 90):
    """Delete attack records older than *days* days."""
    deleted = purge_old_records(days=days)
    return {"deleted_rows": deleted}


# ---------------------------------------------------------------------------
# WAF Proxy — MUST be last
# ---------------------------------------------------------------------------

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy(path: str, request: Request):
    request_id = str(uuid.uuid4())
    client_ip = _get_client_ip(request)
    method = request.method
    start_time = time.monotonic()

    # ── 1. Whitelist ────────────────────────────────────────────────────────
    if client_ip in WHITELIST_IPS:
        pass  # fall through to forwarding

    else:
        # ── 2. Static + dynamic blacklist ───────────────────────────────────
        if is_blacklisted(client_ip):
            log_blocked(client_ip, "blacklisted", request_id=request_id,
                        path=path, method=method)
            return JSONResponse(
                status_code=403,
                content={"status": "blocked", "reason": "IP blacklisted",
                         "request_id": request_id},
            )

        # ── 3. Rate limiting ────────────────────────────────────────────────
        if is_rate_limited(client_ip, path=f"/{path}"):
            log_blocked(client_ip, "rate_limited", request_id=request_id,
                        path=path, method=method)
            return JSONResponse(
                status_code=429,
                headers={"Retry-After": "10"},
                content={"status": "blocked", "reason": "Too many requests",
                         "request_id": request_id},
            )

        # ── 4. Attack detection ─────────────────────────────────────────────
        body = await request.body()
        body_text = body.decode(errors="ignore")[:MAX_BODY_INSPECT_BYTES]
        query_params = str(request.query_params)
        user_agent = request.headers.get("User-Agent", "")

        full_data = body_text + " " + query_params + " " + user_agent

        result = detect_attack(full_data)

        if result:
            record_attack(client_ip)

            log_attack(
                ip=client_ip,
                attack_type=result.attack_type,
                payload=body_text,
                request_id=request_id,
                severity_score=result.score,
                matched_patterns=result.matched_patterns,
                path=path,
                method=method,
                user_agent=user_agent,
            )

            log_attack_to_db(
                ip=client_ip,
                attack_type=result.attack_type,
                payload=body_text,
                severity=result.score,
                path=path,
                method=method,
                request_id=request_id,
            )

            return JSONResponse(
                status_code=403,
                content={
                    "status": "blocked",
                    "attack_type": result.attack_type,
                    "severity_score": result.score,
                    "request_id": request_id,
                },
            )
    # ── 5. Forward clean request ────────────────────────────────────────────
    body = await request.body()  # may be empty for whitelisted IPs (not read yet)

    target_url = f"{TARGET_SERVER}/{path}"

    # Strip hop-by-hop headers that should not be forwarded
    forward_headers = {
        k: v for k, v in request.headers.items()
        if k.lower() not in {"host", "content-length", "transfer-encoding", "connection"}
    }
    forward_headers["X-Request-ID"] = request_id
    forward_headers["X-Forwarded-For"] = client_ip

    try:
        async with httpx.AsyncClient(timeout=PROXY_TIMEOUT_SECONDS) as client:
            upstream = await client.request(
                method=method,
                url=target_url,
                headers=forward_headers,
                content=body,
                params=request.query_params,
            )
    except httpx.TimeoutException:
        return JSONResponse(status_code=504,
                            content={"status": "error", "reason": "upstream timeout"})
    except httpx.RequestError as exc:
        return JSONResponse(status_code=502,
                            content={"status": "error", "reason": str(exc)})

    duration_ms = (time.monotonic() - start_time) * 1000
    log_request(
        client_ip,
        request_id=request_id,
        path=path,
        method=method,
        status_code=upstream.status_code,
        duration_ms=duration_ms,
    )

    response = Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=dict(upstream.headers),
    )
    return _apply_security_headers(response)
