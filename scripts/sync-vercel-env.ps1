# Sync .env.local variables to Vercel (run after: npx vercel login && npx vercel link)
# Usage: .\scripts\sync-vercel-env.ps1

$ErrorActionPreference = "Stop"
$envFile = Resolve-Path (Join-Path $PSScriptRoot "..\.env.local")

if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found at $envFile"
}

$skipNames = @("VERCEL_OIDC_TOKEN")

$lines = Get-Content $envFile | Where-Object {
  $_ -match '^\s*[^#]' -and $_ -match '='
}

Write-Host "Pushing env vars to Vercel (production, preview, development)..."

foreach ($line in $lines) {
  $parts = $line -split '=', 2
  $name = $parts[0].Trim()
  $value = $parts[1].Trim().Trim('"')

  if (-not $name -or $skipNames -contains $name) { continue }

  Write-Host "  -> $name"

  foreach ($target in @("production", "preview", "development")) {
    npx vercel env add $name $target --value $value --force --yes 2>&1 | Out-Null
  }
}

Write-Host "Done. Redeploy on Vercel for changes to take effect."
