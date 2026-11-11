#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/../backend"
test -f .env || { echo 'Tạo backend/.env theo .env.example trước khi chạy.'; exit 1; }
docker compose -p backend -f docker-compose.yml -f docker-compose.dev.yml up -d --build
echo 'Web: http://localhost:4173'
