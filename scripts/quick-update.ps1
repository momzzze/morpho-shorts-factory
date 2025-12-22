#!/usr/bin/env pwsh
# Quick update script - pulls latest image and deploys to k3d

Write-Host "🚀 Updating Morpho API..." -ForegroundColor Cyan

$IMAGE = "ghcr.io/momzzze/morpho-shorts-factory/morpho-api:latest"

Write-Host "📥 Pulling latest image..." -ForegroundColor Yellow
docker pull $IMAGE

Write-Host "🏷️  Tagging for k3d..." -ForegroundColor Yellow
docker tag $IMAGE morpho-api:latest

Write-Host "📦 Importing to k3d..." -ForegroundColor Yellow
k3d image import morpho-api:latest -c morpho

Write-Host "🔄 Restarting deployment..." -ForegroundColor Yellow
kubectl rollout restart deployment/morpho-api

Write-Host "⏳ Waiting for rollout..." -ForegroundColor Yellow
kubectl rollout status deployment/morpho-api --timeout=2m

Write-Host ""
Write-Host "✅ Deployment updated!" -ForegroundColor Green
kubectl get pods -l app=morpho-api
