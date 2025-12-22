# ==============================================================================
# Expose Local Kubernetes to Internet via Cloudflare Tunnel
# ==============================================================================
# This script sets up a secure tunnel to expose your local k3d cluster
# to the internet temporarily for testing
#
# Prerequisites:
# 1. Install cloudflared: choco install cloudflared
# 2. No account needed for quick tunnels
#
# Usage: .\scripts\expose-local.ps1
# ==============================================================================

Write-Host "🌐 Exposing local Kubernetes to internet..." -ForegroundColor Cyan
Write-Host ""

# First, make sure port-forward is running
Write-Host "Starting port-forward to API..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "kubectl port-forward svc/morpho-api-service 5000:80"

Start-Sleep -Seconds 3

# Start cloudflare tunnel
Write-Host ""
Write-Host "🚇 Starting Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "This will create a public URL for your API" -ForegroundColor Cyan
Write-Host ""

cloudflared tunnel --url http://localhost:5000

# When tunnel stops, the script will end
Write-Host ""
Write-Host "Tunnel closed!" -ForegroundColor Yellow
