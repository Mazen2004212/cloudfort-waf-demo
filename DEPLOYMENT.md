# Cloud Deployment

This project can be deployed in two ways:

1. One-service demo deployment: easiest free option for sharing with friends.
2. Split production deployment: separate demo site, WAF backend, and dashboard.

## Easiest Free Option: One Render Docker Service

Use this when you want one public URL that just works.

Deploy the repository root to Render as a Docker Web Service:

- Service type: Web Service
- Runtime: Docker
- Root directory: repository root
- Dockerfile path: `Dockerfile`

Render will give you a URL like:

```text
https://cloudfort-waf-demo.onrender.com
```

Share this URL with friends:

```text
https://cloudfort-waf-demo.onrender.com
```

Open the dashboard here:

```text
https://cloudfort-waf-demo.onrender.com/dashboard
```

Notes for the free tier:

- The first request after inactivity can take about a minute because free services sleep.
- SQLite data uses `/tmp/waf.db`, so logs can reset after redeploys/restarts.
- This is good for demos, not production storage.

## Split Production-Style Deployment

This project has three deployable parts:

- `demo-site`: the protected target app.
- `cloud-waf`: the FastAPI WAF proxy and dashboard API.
- `waf-dashboard`: the React dashboard.

Netlify can host the React dashboard only. The WAF proxy needs a backend platform such as Render, Railway, Fly.io, Azure, AWS, or a VPS because it must run a persistent FastAPI server.

## 1. Deploy The Demo Site

Deploy `demo-site` to a Node.js host.

Recommended Render settings:

- Root directory: `demo-site`
- Build command: `npm install`
- Start command: `npm start`

After deploy, copy the public URL, for example:

```text
https://your-demo-site.onrender.com
```

## 2. Deploy The WAF Backend

Deploy `cloud-waf` to a Python web host.

Recommended Render settings:

- Root directory: `cloud-waf`
- Build command: `pip install -r requirements.txt`
- Start command: `cd app && uvicorn main:app --host 0.0.0.0 --port $PORT`

Set these environment variables:

```text
WAF_TARGET_SERVER=https://your-demo-site.onrender.com
WAF_CORS_ALLOW_ORIGINS=https://your-dashboard-site.netlify.app,https://your-dashboard-domain.com
WAF_DB_NAME=/tmp/waf.db
```

For production, use persistent disk or a managed database instead of `/tmp/waf.db`, because many free hosts reset ephemeral files.

## 3. Deploy The Dashboard To Netlify

In Netlify, create a new site from the repository and use:

- Base directory: `waf-dashboard`
- Build command: `npm run build`
- Publish directory: `waf-dashboard/dist`

Set this Netlify environment variable:

```text
VITE_API_BASE_URL=https://your-waf-api-domain.com
```

The included `waf-dashboard/netlify.toml` handles the Vite build and SPA redirects.

## 4. Add A Domain

Typical domain setup:

```text
dashboard.yourdomain.com -> Netlify dashboard
waf-api.yourdomain.com   -> WAF backend host
app.yourdomain.com       -> WAF backend host, used as the protected app URL
```

Users should browse through the WAF URL, not the raw demo-site URL. For example:

```text
https://app.yourdomain.com
```

That domain should point to the WAF backend. The WAF backend forwards clean traffic to `WAF_TARGET_SERVER`.

## Local Development

Run the three services locally:

```powershell
cd demo-site
npm start
```

```powershell
cd cloud-waf\app
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

```powershell
cd waf-dashboard
npm run dev
```
