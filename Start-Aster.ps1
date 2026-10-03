param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$asterRuntime = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if (!(Test-Path -LiteralPath $asterRuntime)) { $asterRuntime = (Get-Command node -ErrorAction Stop).Source }
$asterArguments = @((Join-Path $PSScriptRoot 'scripts/start-aster.mjs'))
if ($NoBrowser) { $asterArguments += '--no-browser' }
& $asterRuntime @asterArguments
exit $LASTEXITCODE