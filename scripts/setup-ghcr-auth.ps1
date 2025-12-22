# ==============================================================================
# Setup GitHub Container Registry Authentication
# ==============================================================================
# This script helps you authenticate with GitHub Container Registry (ghcr.io)
# so you can pull private images
#
# Prerequisites:
# 1. Create a GitHub Personal Access Token (PAT) with 'read:packages' scope
#    https://github.com/settings/tokens
#
# Usage: .\scripts\setup-ghcr-auth.ps1
# ==============================================================================

param(
    [string]$Username = "momzzze"
)

Write-Host "🔐 Setting up GitHub Container Registry authentication..." -ForegroundColor Cyan
Write-Host ""

Write-Host "You'll need a GitHub Personal Access Token with 'read:packages' and 'write:packages' scopes" -ForegroundColor Yellow
Write-Host "Create one here: https://github.com/settings/tokens" -ForegroundColor Yellow
Write-Host ""

# Prompt for token
$Token = Read-Host "Enter your GitHub Personal Access Token" -AsSecureString
$TokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)
)

Write-Host ""
Write-Host "📝 Logging in to ghcr.io..." -ForegroundColor Yellow

# Login to GitHub Container Registry
echo $TokenPlain | docker login ghcr.io -u $Username --password-stdin

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully authenticated with GitHub Container Registry!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Cyan
    Write-Host "  - Pull images: docker pull ghcr.io/$Username/morpho-shorts-factory/morpho-api:latest" -ForegroundColor White
    Write-Host "  - Push images: docker push ghcr.io/$Username/morpho-shorts-factory/morpho-api:latest" -ForegroundColor White
    Write-Host "  - Run update script: .\scripts\update-k8s-image.ps1" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Authentication failed. Please check your token and try again." -ForegroundColor Red
    exit 1
}
