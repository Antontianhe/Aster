param(
 [ValidateSet('Start','Stop','Status','Backup','Connect')] [string]$Action = 'Status'
)
$ErrorActionPreference = 'Stop'
$asterRoot = Join-Path $env:LOCALAPPDATA 'Aster'
$asterInstance = Join-Path $asterRoot 'mysql-instance'
$asterBin = Join-Path $asterRoot 'mysql-8.4.11-winx64/bin'
$asterConfig = Join-Path $asterInstance 'my.ini'
$asterAdmin = Join-Path $asterInstance 'root.cnf'
$asterApp = Join-Path $asterInstance 'app.cnf'
if (!(Test-Path -LiteralPath (Join-Path $asterInstance 'configured.json'))) { throw 'Aster MySQL is not configured.' }
function Test-AsterMySql {
 $ErrorActionPreference = 'Continue'
 & (Join-Path $asterBin 'mysqladmin.exe') "--defaults-extra-file=$asterAdmin" ping 2>$null | Out-Null
 return $LASTEXITCODE -eq 0
}
switch ($Action) {
 'Start' {
  if (Test-AsterMySql) { Write-Output 'Aster MySQL is already running.'; return }
  Start-Process -FilePath (Join-Path $asterBin 'mysqld.exe') -ArgumentList ('--defaults-file="' + $asterConfig + '"') -WorkingDirectory $asterRoot -WindowStyle Hidden
  for ($asterAttempt=0; $asterAttempt -lt 30; $asterAttempt++) {
   Start-Sleep -Milliseconds 500
   if (Test-AsterMySql) { Write-Output 'Aster MySQL started at 127.0.0.1:3306.'; return }
  }
  throw 'MySQL did not start. Check the private mysql.err log.'
 }
 'Stop' {
  & (Join-Path $asterBin 'mysqladmin.exe') "--defaults-extra-file=$asterAdmin" shutdown
  if ($LASTEXITCODE -ne 0) { throw 'Could not shut down MySQL cleanly.' }
  Write-Output 'Aster MySQL shut down cleanly; data is preserved.'
 }
 'Status' {
  & (Join-Path $asterBin 'mysql.exe') "--defaults-extra-file=$asterApp" '--database=aster' '--table' '--execute=SELECT VERSION() AS mysql_version,DATABASE() AS database_name,CURRENT_USER() AS application_account; SHOW STATUS LIKE "Ssl_cipher";'
  if ($LASTEXITCODE -ne 0) { throw 'MySQL is not reachable. Use -Action Start.' }
 }
 'Backup' {
  $asterBackup = Join-Path $asterInstance ('backups/aster-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.sql')
  & (Join-Path $asterBin 'mysqldump.exe') "--defaults-extra-file=$asterAdmin" '--single-transaction' '--no-tablespaces' '--routines' '--events' '--triggers' '--databases' 'aster' "--result-file=$asterBackup"
  if ($LASTEXITCODE -ne 0) { throw 'Backup failed. Check the MySQL error.' }
  Write-Output "Backup saved: $asterBackup"
 }
 'Connect' {
  & (Join-Path $asterBin 'mysql.exe') "--defaults-extra-file=$asterApp" '--database=aster'
 }
}
