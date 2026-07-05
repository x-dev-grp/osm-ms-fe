param(
  [ValidateSet('smoke', 'mobile', 'full', 'all')]
  [string]$Suite = 'smoke',
  [string]$BaseUrl = 'http://localhost:4200',
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')

if (-not $SkipInstall) {
  Write-Host 'Installing Playwright Chromium...'
  npx playwright install chromium
}

$env:E2E_BASE_URL = $BaseUrl

switch ($Suite) {
  'smoke' {
    Write-Host 'Running smoke tests (no login required)...'
    npm run e2e:smoke
  }
  'mobile' {
    Write-Host 'Running mobile experience tests (login required)...'
    $env:E2E_RUN_LOGIN = '1'
    npm run e2e:mobile
  }
  'full' {
    Write-Host 'Running full authenticated suite...'
    $env:E2E_RUN_LOGIN = '1'
    npm run e2e:full
  }
  'all' {
    Write-Host 'Running smoke, then full suite...'
    npm run e2e:smoke
    $env:E2E_RUN_LOGIN = '1'
    npm run e2e:full
  }
}
