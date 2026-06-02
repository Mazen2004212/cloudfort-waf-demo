FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV WAF_TARGET_SERVER=http://127.0.0.1:9000
ENV WAF_CORS_ALLOW_ORIGINS=*
ENV WAF_DASHBOARD_DIR=/app/waf-dashboard/dist
ENV WAF_DB_NAME=/tmp/waf.db

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends nodejs npm \
    && rm -rf /var/lib/apt/lists/*

COPY cloud-waf/requirements.txt /app/cloud-waf/requirements.txt
RUN pip install --no-cache-dir -r /app/cloud-waf/requirements.txt

COPY demo-site/package*.json /app/demo-site/
RUN cd /app/demo-site && npm install --omit=dev

COPY waf-dashboard/package*.json /app/waf-dashboard/
RUN cd /app/waf-dashboard && npm install

COPY demo-site /app/demo-site
COPY waf-dashboard /app/waf-dashboard
RUN cd /app/waf-dashboard && VITE_BASE_PATH=/dashboard/ npm run build

COPY cloud-waf /app/cloud-waf
COPY docker-start.sh /app/docker-start.sh
RUN chmod +x /app/docker-start.sh

CMD ["/app/docker-start.sh"]
