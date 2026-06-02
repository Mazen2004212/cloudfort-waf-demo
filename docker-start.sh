#!/bin/sh
set -eu

node /app/demo-site/server.js &

cd /app/cloud-waf/app
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
