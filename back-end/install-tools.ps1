$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$asterTools = Join-Path $env:LOCALAPPDATA 'Aster\toolchains'
New-Item -ItemType Directory -Force -Path $asterTools | Out-Null
$manifestPath = Join-Path $asterTools 'tools.json'
if (Test-Path -LiteralPath $manifestPath) {
  $installed = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  if ((Test-Path -LiteralPath (Join-Path $installed.javaHome 'bin\java.exe')) -and (Test-Path -LiteralPath (Join-Path $installed.mavenHome 'bin\mvn.cmd'))) {
    Write-Output 'Java and Maven are already installed for Aster.'
    exit 0
  }
}
function Get-VerifiedArchive($url, $destination, $algorithm, $checksum) {
  if (!(Test-Path -LiteralPath $destination) -or (Get-FileHash -LiteralPath $destination -Algorithm $algorithm).Hash -ne $checksum) {
    Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $destination
  }
  if ((Get-FileHash -LiteralPath $destination -Algorithm $algorithm).Hash -ne $checksum) { throw 'Downloaded archive checksum did not match.' }
}
Write-Output 'Downloading Eclipse Temurin JDK 21 and Apache Maven from their official distributions...'
$assets = Invoke-RestMethod -Uri 'https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows&vendor=eclipse'
$jdk = $assets[0]
$jdkArchive = Join-Path $asterTools $jdk.binary.package.name
Get-VerifiedArchive $jdk.binary.package.link $jdkArchive 'SHA256' $jdk.binary.package.checksum
Expand-Archive -LiteralPath $jdkArchive -DestinationPath $asterTools -Force
$javaDirectory = Get-ChildItem -LiteralPath $asterTools -Directory -Filter 'jdk-21*' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$mavenVersion = '3.9.16'
$mavenUrl = "https://dlcdn.apache.org/maven/maven-3/$mavenVersion/binaries/apache-maven-$mavenVersion-bin.zip"
$checksum = (Invoke-RestMethod -Uri "https://downloads.apache.org/maven/maven-3/$mavenVersion/binaries/apache-maven-$mavenVersion-bin.zip.sha512").Trim().Split(' ')[0]
$mavenArchive = Join-Path $asterTools "apache-maven-$mavenVersion-bin.zip"
Get-VerifiedArchive $mavenUrl $mavenArchive 'SHA512' $checksum
Expand-Archive -LiteralPath $mavenArchive -DestinationPath $asterTools -Force
@{javaHome=$javaDirectory.FullName; mavenHome=(Join-Path $asterTools "apache-maven-$mavenVersion"); javaVersion=$jdk.version.openjdk_version; mavenVersion=$mavenVersion} | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding UTF8
Write-Output "Installed Java $($jdk.version.openjdk_version) and Maven $mavenVersion. Download checksums verified."
