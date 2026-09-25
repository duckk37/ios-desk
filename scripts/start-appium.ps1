[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[A-Za-z0-9-]+$')]
    [string]$Udid
)

$ErrorActionPreference = 'Stop'
$toolRoot = Join-Path $env:LOCALAPPDATA 'iPhoneDesk\tools'
$env:APPIUM_HOME = Join-Path $env:LOCALAPPDATA 'iPhoneDesk\appium-home'
$appiumCmd = Join-Path $toolRoot 'node_modules\.bin\appium.cmd'

if (-not (Test-Path -LiteralPath $appiumCmd)) {
    throw 'Chua co Appium. Hay chay setup-appium.ps1 truoc.'
}

$tunnelArgs = "driver run xcuitest tunnel-creation --udid $Udid"
Start-Process -FilePath $appiumCmd -ArgumentList $tunnelArgs -WindowStyle Hidden
Write-Host 'Dang tao RemoteXPC tunnel...' -ForegroundColor Cyan
Start-Sleep -Seconds 4
Write-Host 'Appium dang chay tai http://127.0.0.1:4723' -ForegroundColor Green
Write-Host 'Giu cua so nay mo trong luc su dung iPhone Desk.' -ForegroundColor DarkGray
& $appiumCmd --address 127.0.0.1 --port 4723
