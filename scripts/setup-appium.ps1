[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$toolRoot = Join-Path $env:LOCALAPPDATA 'iPhoneDesk\tools'
$appiumHome = Join-Path $env:LOCALAPPDATA 'iPhoneDesk\appium-home'
$appiumCmd = Join-Path $toolRoot 'node_modules\.bin\appium.cmd'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Khong tim thay Node.js. Hay cai Node.js 22 tro len truoc.'
}

New-Item -ItemType Directory -Force -Path $toolRoot, $appiumHome | Out-Null
Push-Location $toolRoot
try {
    if (-not (Test-Path -LiteralPath (Join-Path $toolRoot 'package.json'))) {
        & npm init -y | Out-Host
    }
    & npm install --save-exact appium@3.8.0 | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'Cai Appium that bai.' }

    $env:APPIUM_HOME = $appiumHome
    $drivers = & $appiumCmd driver list --installed 2>&1 | Out-String
    if ($drivers -notmatch 'xcuitest') {
        & $appiumCmd driver install xcuitest | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'Cai XCUITest driver that bai.' }
    }
} finally {
    Pop-Location
}

Write-Host ''
Write-Host 'Da cai Appium va XCUITest Driver.' -ForegroundColor Green
Write-Host "Thu muc: $toolRoot" -ForegroundColor DarkGray
Write-Host 'Buoc tiep theo: cai WDA tren iPhone, sau do chay start-appium.ps1 -Udid <UDID>.' -ForegroundColor Cyan
