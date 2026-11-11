$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectRoot 'backups'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
foreach ($databaseName in @('auth_service','citizen_report_service','collector_data_service')) {
  $containerPath = '/tmp/' + $databaseName + '-' + $stamp + '.dump'
  docker exec postgresql sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$1" -f "$2"' sh $databaseName $containerPath
  if ($LASTEXITCODE -ne 0) { throw "Sao lưu $databaseName thất bại" }
  docker cp "postgresql:$containerPath" (Join-Path $outputDir "$databaseName-$stamp.dump")
  if ($LASTEXITCODE -ne 0) { throw 'Không sao chép được bản sao lưu' }
  docker exec postgresql rm -- $containerPath
}
Write-Output "Đã lưu bản sao trong $outputDir"
