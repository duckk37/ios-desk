[CmdletBinding()]
param()

$ErrorActionPreference = 'SilentlyContinue'

function Write-Check {
    param([string]$Name, [bool]$Ok, [string]$Detail)
    $symbol = if ($Ok) { '[OK]' } else { '[--]' }
    $color = if ($Ok) { 'Green' } else { 'Yellow' }
    Write-Host "$symbol $Name" -ForegroundColor $color
    if ($Detail) { Write-Host "     $Detail" -ForegroundColor DarkGray }
}

Write-Host "iPhone Desk - Kiem tra moi truong" -ForegroundColor Cyan
Write-Host ""

$node = Get-Command node -ErrorAction SilentlyContinue
Write-Check 'Node.js' ($null -ne $node) $(if ($node) { (& node --version) } else { 'Chua cai Node.js' })

$appleService = Get-Service | Where-Object { $_.Name -match 'Apple Mobile' -or $_.DisplayName -match 'Apple Mobile' } | Select-Object -First 1
Write-Check 'Apple Mobile Device Service' ($null -ne $appleService) $(if ($appleService) { "$($appleService.DisplayName): $($appleService.Status)" } else { 'Can cai Apple Mobile Device drivers' })

$iphone = Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'iPhone|Apple Mobile|Apple USB' -or $_.InstanceId -match 'VID_05AC' } | Select-Object -First 1
Write-Check 'iPhone ket noi' ($null -ne $iphone) $(if ($iphone) { "$($iphone.FriendlyName) - $($iphone.Status)" } else { 'Chua phat hien iPhone qua USB' })

$wda = Test-NetConnection 127.0.0.1 -Port 8100 -WarningAction SilentlyContinue
Write-Check 'WebDriverAgent cong 8100' ([bool]$wda.TcpTestSucceeded) $(if ($wda.TcpTestSucceeded) { 'San sang cho che do WDA truc tiep' } else { 'Chua co WDA/port forwarding' })

$appium = Test-NetConnection 127.0.0.1 -Port 4723 -WarningAction SilentlyContinue
Write-Check 'Appium cong 4723' ([bool]$appium.TcpTestSucceeded) $(if ($appium.TcpTestSucceeded) { 'San sang cho che do Appium Windows' } else { 'Appium chua chay' })

$toolRoot = Join-Path $env:LOCALAPPDATA 'iPhoneDesk\tools'
$appiumCmd = Join-Path $toolRoot 'node_modules\.bin\appium.cmd'
Write-Check 'Bo cong cu iPhone Desk' (Test-Path -LiteralPath $appiumCmd) $(if (Test-Path -LiteralPath $appiumCmd) { $toolRoot } else { 'Chay setup-appium.ps1 khi muon dung che do Appium' })

Write-Host ""
Write-Host 'Nhan Enter de dong...' -ForegroundColor DarkGray
[void](Read-Host)
