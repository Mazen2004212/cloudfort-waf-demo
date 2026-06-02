# WAF Monitor — React Dashboard

A dark, production-grade frontend for your FastAPI Web Application Firewall.

## Project Structure

```
waf-dashboard/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── index.jsx           # App entry point
    ├── App.jsx             # Root layout — composes all panels
    ├── lib/
    │   └── api.js          # All API calls → maps to your FastAPI routes
    ├── hooks/
    │   └── usePolling.js   # Auto-refresh hook (interval-based)
    └── components/
        ├── StatusBar.jsx       # Header: logo, live clock, backend health check
        ├── KPIRow.jsx          # 4 stat cards: total attacks, unique IPs, banned, top type
        ├── StatCard.jsx        # Reusable animated KPI tile
        ├── AttackTypeChart.jsx # Bar chart from GET /stats
        ├── AttackLog.jsx       # Paginated table from GET /attacks, with type filter
        ├── TopAttackers.jsx    # Ranked list from GET /top-attackers
        └── BlacklistPanel.jsx  # Live banned IPs from GET /blacklist
```

## API → Component Map

| Backend route      | Component(s)                      |
|--------------------|-----------------------------------|
| `GET /attacks`     | `AttackLog`, `KPIRow`             |
| `GET /stats`       | `AttackTypeChart`, `KPIRow`       |
| `GET /top-attackers` | `TopAttackers`                  |
| `GET /blacklist`   | `BlacklistPanel`, `KPIRow`        |

## Setup

```bash
cd waf-dashboard
npm install
npm run dev
```

Then open http://localhost:3000.

Make sure your FastAPI backend is running on port 8000:
```bash
uvicorn app.main:app --reload --port 8000
```

## CORS

Add this to your FastAPI `main.py` so the React dev server can reach it:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Polling Intervals

| Component         | Interval |
|-------------------|----------|
| AttackLog         | 5s       |
| KPIRow            | 5–6s     |
| BlacklistPanel    | 5s       |
| AttackTypeChart   | 6s       |
| TopAttackers      | 7s       |
| StatusBar health  | 15s      |
