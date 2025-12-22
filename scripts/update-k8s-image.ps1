# ==============================================================================
# Update Kubernetes Image Script
# ==============================================================================
# This script pulls the latest image from GitHub Container Registry,
# imports it to k3d, and restarts the deployment
#
# Usage: .\scripts\update-k8s-image.ps1
# ==============================================================================

param(
    [string]$ImageTag = "latest",
    [string]$ClusterName = "morpho"
)

Write-Host "🚀 Updating Morpho API in Kubernetes..." -ForegroundColor Cyan
Write-Host ""

# Your GitHub username/org
$GH_USER = "momzzze"
$REPO = "morpho-shorts-factory"
$IMAGE_NAME = "morpho-api"

$REMOTE_IMAGE = "ghcr.io/$GH_USER/$REPO/$IMAGE_NAME:$ImageTag"
$LOCAL_IMAGE = "$IMAGE_NAME:$ImageTag"

# Step 1: Pull latest image from GitHub Container Registry
Write-Host "📥 Pulling image from GitHub Container Registry..." -ForegroundColor Yellow
docker pull $REMOTE_IMAGE

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull image. Make sure you're logged in:" -ForegroundColor Red
    Write-Host "   docker login ghcr.io -u $GH_USER" -ForegroundColor White
    exit 1
}

# Step 2: Tag for local use
Write-Host "🏷️  Tagging image for k3d..." -ForegroundColor Yellow
docker tag $REMOTE_IMAGE $LOCAL_IMAGE

# Step 3: Import to k3d cluster
Write-Host "📦 Importing image to k3d cluster '$ClusterName'..." -ForegroundColor Yellow
k3d image import $LOCAL_IMAGE -c $ClusterName

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to import image to k3d" -ForegroundColor Red
    exit 1
}

# Step 4: Restart the deployment
Write-Host "🔄 Restarting deployment..." -ForegroundColor Yellow
kubectl rollout restart deployment/morpho-api

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restart deployment" -ForegroundColor Red
    exit 1
}

# Step 5: Wait for rollout to complete
Write-Host "⏳ Waiting for rollout to complete..." -ForegroundColor Yellow
kubectl rollout status deployment/morpho-api --timeout=5m

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment updated successfully!" -ForegroundColor Green
    Write-Host ""
    kubectl get pods -l app=morpho-api
} else {
    Write-Host "❌ Rollout failed or timed out" -ForegroundColor Red
    exit 1
}
