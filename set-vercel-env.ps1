# set-vercel-env.ps1
# Sets all required environment variables for Prime Wealth on Vercel production.
# Run from the project root after authenticating with `npx vercel login`.

$env:Path = "c:\Users\HP\Desktop\Prime wealth\.node\node-v20.11.1-win-x64;$env:Path"
$projectDir = "c:\Users\HP\Desktop\Prime wealth"

# Load .env values
$envFile = Get-Content "$projectDir\.env" | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' }
$envVars = @{}
foreach ($line in $envFile) {
    if ($line -match '^([^=]+)="?([^"]*)"?$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

# Override NEXTAUTH_URL with production domain
$envVars['NEXTAUTH_URL'] = 'https://prime-wealth.vercel.app'

# Variables to push to Vercel
$varsToSet = @(
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'PUSHER_APP_ID',
    'NEXT_PUBLIC_PUSHER_KEY',
    'PUSHER_SECRET',
    'NEXT_PUBLIC_PUSHER_CLUSTER',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET'
)

Set-Location $projectDir

Write-Host "=== Setting Vercel Production Environment Variables ===" -ForegroundColor Cyan

foreach ($key in $varsToSet) {
    $value = $envVars[$key]
    if (-not $value) {
        Write-Host "⚠️  Skipping $key (no value found in .env)" -ForegroundColor Yellow
        continue
    }

    Write-Host "Setting $key..." -ForegroundColor Gray

    # Remove existing variable first (ignore errors if not found)
    npx vercel env rm $key production --yes 2>$null | Out-Null

    # Add new value — pipe to stdin to avoid shell exposure of secrets
    $value | npx vercel env add $key production

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $key set successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to set $key (exit code $LASTEXITCODE)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== All env vars processed. Triggering redeployment... ===" -ForegroundColor Cyan
npx vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Deployment triggered successfully!" -ForegroundColor Green
    Write-Host "Production URL: https://prime-wealth-eight.vercel.app" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check logs above." -ForegroundColor Red
}
