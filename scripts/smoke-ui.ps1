$ErrorActionPreference = 'Stop'
$outputPath = Join-Path $PSScriptRoot '..\artifacts\ui-smoke.png'
$outputDirectory = Split-Path -Parent $outputPath
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$env:IPHONE_DESK_SMOKE_PATH = [System.IO.Path]::GetFullPath($outputPath)
try {
    & (Join-Path $PSScriptRoot '..\node_modules\.bin\electron.cmd') (Join-Path $PSScriptRoot '..')
    if ($LASTEXITCODE -ne 0) { throw "Electron smoke test failed with code $LASTEXITCODE" }
    if (-not (Test-Path -LiteralPath $env:IPHONE_DESK_SMOKE_PATH)) { throw 'UI screenshot was not created.' }
    Write-Host "UI smoke test passed: $env:IPHONE_DESK_SMOKE_PATH" -ForegroundColor Green
} finally {
    Remove-Item Env:IPHONE_DESK_SMOKE_PATH -ErrorAction SilentlyContinue
}
