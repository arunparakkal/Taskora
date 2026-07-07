# Sync .env.local variables to Vercel (run after: npx vercel login && npx vercel link)
# Usage: .\scripts\sync-vercel-env.ps1

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot ".." ".env.local" | Resolve-Path

if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found at $envFile"
}

$lines = Get-Content $envFile | Where-Object {
  $_ -match '^\s*[^#]' -and $_ -match '='
}

Write-Host "Pushing $($lines.Count) env vars to Vercel (production, preview, development)..."

foreach ($line in $lines) {
  $parts = $line -split '=', 2
  $name = $parts[0].Trim()
  $value = $parts[1].Trim()

  if (-not $name) { continue }

  Write-Host "  -> $name"
  $value | npx vercel env add $name production preview development --force 2>&1 | Out-Null
}

Write-Host "Done. Redeploy on Vercel for changes to take effect."
