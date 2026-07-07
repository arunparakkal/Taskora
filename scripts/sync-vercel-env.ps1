# Sync .env.local variables to Vercel (run after: npx vercel login && npx vercel link)
# Usage: .\scripts\sync-vercel-env.ps1

$envFile = Resolve-Path (Join-Path $PSScriptRoot "..\.env.local")

if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found at $envFile"
}

$skipNames = @("VERCEL_OIDC_TOKEN")

function Add-VercelEnvVar {
  param(
    [string]$Name,
    [string]$Target,
    [string]$Value
  )

  $previousErrorAction = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  $output = & npx vercel env add $Name $Target --value $Value --force --yes 2>&1
  $exitCode = $LASTEXITCODE

  $ErrorActionPreference = $previousErrorAction

  if ($exitCode -ne 0) {
    Write-Host "     failed ($Target): $output" -ForegroundColor Red
    return $false
  }

  Write-Host "     ok ($Target)" -ForegroundColor Green
  return $true
}

$lines = Get-Content $envFile | Where-Object {
  $_ -match '^\s*[^#]' -and $_ -match '='
}

Write-Host "Pushing env vars to Vercel (production, preview, development)..."

$failed = 0

foreach ($line in $lines) {
  $parts = $line -split '=', 2
  $name = $parts[0].Trim()
  $value = $parts[1].Trim().Trim('"')

  if (-not $name -or $skipNames -contains $name) { continue }

  Write-Host "  -> $name"

  foreach ($target in @("production", "preview", "development")) {
    $ok = Add-VercelEnvVar -Name $name -Target $target -Value $value
    if (-not $ok) { $failed++ }
  }
}

if ($failed -gt 0) {
  Write-Host ""
  Write-Host "Finished with $failed error(s). Check output above." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Done. Redeploy on Vercel for changes to take effect." -ForegroundColor Green
