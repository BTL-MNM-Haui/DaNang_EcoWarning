param([switch]$LocalMail)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $projectRoot 'backend')
try {
  if (-not (Test-Path -LiteralPath '.env')) { throw 'Tạo backend/.env theo .env.example trước khi chạy.' }
  $composeArgs = @('compose', '--profile', 'ai', '-p', 'backend', '-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml')
  if ($LocalMail) { $composeArgs += @('-f', 'docker-compose.local-mail.yml') }
  & docker @composeArgs up -d --build
  if ($LASTEXITCODE -ne 0) { throw 'Khởi động thất bại. Kiểm tra docker compose logs.' }
  Write-Output 'Web: http://localhost:4173'
  if ($LocalMail) { Write-Output 'Local OTP inbox: http://localhost:8025 (emails stay on this machine)' }
} finally { Pop-Location }
