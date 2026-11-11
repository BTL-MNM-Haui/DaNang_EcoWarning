$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $projectRoot 'backend')
try {
  if (-not (Test-Path -LiteralPath '.env')) { throw 'Tạo backend/.env theo .env.example trước khi chạy.' }
  docker compose -p backend -f docker-compose.yml -f docker-compose.dev.yml up -d --build
  if ($LASTEXITCODE -ne 0) { throw 'Khởi động thất bại. Kiểm tra docker compose logs.' }
  Write-Output 'Web: http://localhost:4173'
} finally { Pop-Location }
