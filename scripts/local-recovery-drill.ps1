#Requires -Version 7.2
# Backup and restore only the named local Supabase stack into a disposable container.
# No hosted credentials or remote targets are accepted. Backups are private/ignored.
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$launchRepoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$launchBackupRoot = [IO.Path]::GetFullPath((Join-Path $launchRepoRoot '.ops-backups'))
if (-not $launchBackupRoot.StartsWith($launchRepoRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'Backup path escaped repository' }
$launchStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$launchBackupPath = Join-Path $launchBackupRoot $launchStamp
$launchDatabase = 'supabase_db_CareBridge_Connect'
$launchStorage = 'supabase_storage_CareBridge_Connect'
$launchScratch = 'carebridge-restore-drill-' + $launchStamp

function Invoke-DrillDocker {
  param([string[]]$DockerArgs)
  Write-Verbose ('Docker operation: ' + ($DockerArgs[0..([Math]::Min(2, $DockerArgs.Length - 1))] -join ' '))
  $launchDockerOutput = & docker @DockerArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    if (Test-Path -LiteralPath $launchBackupPath) { $launchDockerOutput | Set-Content -LiteralPath (Join-Path $launchBackupPath 'last-operation-error.log') }
    throw ('Docker operation failed: ' + $DockerArgs[0] + '. Inspect the ignored local backup error log privately.')
  }
  return $launchDockerOutput
}

$launchLabel = Invoke-DrillDocker @('inspect', $launchDatabase, '--format', '{{index .Config.Labels "com.supabase.cli.project"}}')
if ([string]$launchLabel -ne 'CareBridge_Connect') { throw 'Refusing a database outside the local CareBridge stack' }
$launchStorageLabel = Invoke-DrillDocker @('inspect', $launchStorage, '--format', '{{index .Config.Labels "com.supabase.cli.project"}}')
if ([string]$launchStorageLabel -ne 'CareBridge_Connect') { throw 'Refusing storage outside the local CareBridge stack' }
$launchImage = [string](Invoke-DrillDocker @('inspect', $launchDatabase, '--format', '{{.Config.Image}}'))
New-Item -ItemType Directory -Path $launchBackupPath | Out-Null
$launchDump = '/tmp/carebridge-drill-' + $launchStamp + '.dump'
$launchRoles = '/tmp/carebridge-roles-' + $launchStamp + '.sql'
Invoke-DrillDocker @('exec', $launchDatabase, 'pg_dump', '-U', 'postgres', '-d', 'postgres', '-Fc', '-f', $launchDump) | Out-Null
Invoke-DrillDocker @('exec', $launchDatabase, 'pg_dumpall', '-U', 'postgres', '--roles-only', '--no-role-passwords', '-f', $launchRoles) | Out-Null
Invoke-DrillDocker @('cp', ($launchDatabase + ':' + $launchDump), (Join-Path $launchBackupPath 'database.dump')) | Out-Null
Invoke-DrillDocker @('cp', ($launchDatabase + ':' + $launchRoles), (Join-Path $launchBackupPath 'roles.sql')) | Out-Null
Invoke-DrillDocker @('cp', ($launchStorage + ':/mnt/.'), (Join-Path $launchBackupPath 'storage')) | Out-Null
$launchCountsSql = 'select json_build_object(''users'',(select count(*) from auth.users),''bookings'',(select count(*) from public.bookings),''documents'',(select count(*) from public.documents),''countries'',(select count(*) from public.countries));'
$launchSourceCounts = [string](Invoke-DrillDocker @('exec', $launchDatabase, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', $launchCountsSql))
$launchStarted = Get-Date
$launchCreatedScratch = $false
try {
  Invoke-DrillDocker @('run', '-d', '--name', $launchScratch, '--network', 'none', '-e', 'POSTGRES_PASSWORD=local-recovery-drill-only', $launchImage, 'postgres', '-D', '/var/lib/postgresql/data', '-c', 'shared_preload_libraries=pg_cron,pg_net,pg_stat_statements', '-c', 'cron.database_name=postgres') | Out-Null
  $launchCreatedScratch = $true
  $launchReady = $false
  for ($launchAttempt = 0; $launchAttempt -lt 45; $launchAttempt++) {
    # The image's temporary init server is socket-only; wait for the final TCP server.
    & docker exec $launchScratch pg_isready -h 127.0.0.1 -U postgres *> $null
    if ($LASTEXITCODE -eq 0) { $launchReady = $true; break }
    Start-Sleep -Seconds 1
  }
  if (-not $launchReady) { throw 'Disposable restore database did not become ready within 45 seconds' }
  # Supabase's image precreates several roles. Keep their ALTER statements.
  $launchRolesText = Get-Content -LiteralPath (Join-Path $launchBackupPath 'roles.sql') -Raw
  $launchExistingRoles = Invoke-DrillDocker @('exec', $launchScratch, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', 'select rolname from pg_roles;')
  foreach ($launchExistingRole in $launchExistingRoles) {
    $launchRolesText = $launchRolesText -replace ('(?m)^CREATE ROLE ' + [regex]::Escape([string]$launchExistingRole) + ';\r?\n'), ''
  }
  [IO.File]::WriteAllText((Join-Path $launchBackupPath 'restore-roles.sql'), $launchRolesText)
  Invoke-DrillDocker @('cp', (Join-Path $launchBackupPath 'restore-roles.sql'), ($launchScratch + ':/tmp/roles.sql')) | Out-Null
  Invoke-DrillDocker @('exec', $launchScratch, 'psql', '-U', 'supabase_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-f', '/tmp/roles.sql') | Out-Null
  Invoke-DrillDocker @('cp', (Join-Path $launchBackupPath 'database.dump'), ($launchScratch + ':/tmp/database.dump')) | Out-Null
  # --clean applies only to the disposable, network-isolated container created above.
  Invoke-DrillDocker @('exec', $launchScratch, 'pg_restore', '-U', 'supabase_admin', '-d', 'postgres', '--clean', '--if-exists', '--exit-on-error', '/tmp/database.dump') | Out-Null
  $launchRestoredCounts = [string](Invoke-DrillDocker @('exec', $launchScratch, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', $launchCountsSql))
  if ($launchSourceCounts -ne $launchRestoredCounts) { throw 'Restore counts differ; stop writers and rerun the drill' }
  Invoke-DrillDocker @('cp', (Join-Path $launchBackupPath 'storage'), ($launchScratch + ':/tmp/storage-restored')) | Out-Null
  Invoke-DrillDocker @('cp', ($launchScratch + ':/tmp/storage-restored/.'), (Join-Path $launchBackupPath 'storage-restored')) | Out-Null
  function Get-DrillStorageHashes([string]$Root) {
    @(Get-ChildItem -LiteralPath $Root -File -Recurse | ForEach-Object {
      $_.FullName.Substring($Root.Length) + ':' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    } | Sort-Object) -join "`n"
  }
  if ((Get-DrillStorageHashes (Join-Path $launchBackupPath 'storage')) -ne (Get-DrillStorageHashes (Join-Path $launchBackupPath 'storage-restored'))) { throw 'Restored storage file hashes differ' }
  $launchRollbackSql = 'begin; update public.countries set is_live=true where code=''PT''; update public.countries set is_live=false where code=''PT''; select not is_live from public.countries where code=''PT''; rollback;'
  $launchRollbackResult = Invoke-DrillDocker @('exec', $launchScratch, 'psql', '-U', 'postgres', '-d', 'postgres', '-Atc', $launchRollbackSql)
  if ('t' -notin $launchRollbackResult) { throw 'Market closure rollback drill failed' }
  $launchEvidence = [ordered]@{
    scope = 'local-only'; database_restored = $true; counts_match = $true
    database_counts = ($launchRestoredCounts | ConvertFrom-Json)
    storage_files_copied = @(Get-ChildItem -LiteralPath (Join-Path $launchBackupPath 'storage') -File -Recurse).Count
    storage_restore_tested = $true; storage_hashes_match = $true
    market_closure_drill_passed = $true
    dump_sha256 = (Get-FileHash -LiteralPath (Join-Path $launchBackupPath 'database.dump') -Algorithm SHA256).Hash
    restore_seconds = [math]::Round(((Get-Date) - $launchStarted).TotalSeconds, 1)
    production_verified = $false
  }
  $launchEvidence | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $launchBackupPath 'evidence.json')
  $launchEvidence | ConvertTo-Json -Depth 4
} finally {
  if ($launchCreatedScratch) {
    # Exact container name created by this invocation; persistent local stack is preserved.
    & docker rm -f -v $launchScratch *> $null
  }
}
