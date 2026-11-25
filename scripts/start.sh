#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/../backend"
test -f .env || { echo 'Tạo backend/.env theo .env.example trước khi chạy.'; exit 1; }
set -- --profile ai -p backend -f docker-compose.yml -f docker-compose.dev.yml
if [ "${LOCAL_MAIL:-0}" = "1" ]; then set -- "$@" -f docker-compose.local-mail.yml; fi
docker compose "$@" up -d --build
echo 'Web: http://localhost:4173'
if [ "${LOCAL_MAIL:-0}" = "1" ]; then echo 'Local OTP inbox: http://localhost:8025'; fi
