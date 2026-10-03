$ErrorActionPreference = 'Stop'
$asterManifest = Join-Path $env:LOCALAPPDATA 'Aster\toolchains\tools.json'
if (!(Test-Path -LiteralPath $asterManifest)) { & "$PSScriptRoot\install-tools.ps1" }
$asterTools = Get-Content -LiteralPath $asterManifest -Raw | ConvertFrom-Json
$env:JAVA_HOME = $asterTools.javaHome
$env:PATH = "$($asterTools.javaHome)\bin;$env:PATH"
$asterRepository = Join-Path $env:LOCALAPPDATA 'Aster\maven-repository'
& (Join-Path $asterTools.mavenHome 'bin\mvn.cmd') "-Dmaven.repo.local=$asterRepository" -f "$PSScriptRoot\pom.xml" @args
exit $LASTEXITCODE
