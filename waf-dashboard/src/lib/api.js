const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : window.location.origin)
).replace(/\/$/, "");

async function fetchJSON(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function postJSON(endpoint, body = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function deleteJSON(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Dashboard endpoints (GET) ────────────────────────────────────────────
export const getAttacks       = (limit = 200) => fetchJSON(`/waf/attacks?limit=${limit}`);
export const getRecentAttacks = (minutes = 60) => fetchJSON(`/waf/attacks/recent?minutes=${minutes}`);
export const getStats         = () => fetchJSON("/waf/stats");
export const getHourlyStats   = (hours = 24) => fetchJSON(`/waf/stats/hourly?hours=${hours}`);
export const getTopAttackers  = (limit = 20) => fetchJSON(`/waf/top-attackers?limit=${limit}`);
export const getAttackerHistory = (ip) => fetchJSON(`/waf/attacker/${encodeURIComponent(ip)}`);
export const getBlacklist     = () => fetchJSON("/waf/blacklist");
export const getBanInfo       = (ip) => fetchJSON(`/waf/blacklist/${encodeURIComponent(ip)}`);
export const getRateInfo      = (ip) => fetchJSON(`/waf/rate/${encodeURIComponent(ip)}`);

// ─── Admin endpoints (POST / DELETE) ──────────────────────────────────────
export const banIP   = (ip, durationSeconds = 3600) =>
  postJSON(`/waf/blacklist/${encodeURIComponent(ip)}?duration_seconds=${durationSeconds}`);

export const unbanIP = (ip) =>
  deleteJSON(`/waf/blacklist/${encodeURIComponent(ip)}`);

export const purgeOldRecords = (days = 90) =>
  deleteJSON(`/waf/purge?days=${days}`);
