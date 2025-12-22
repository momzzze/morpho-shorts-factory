# ==============================================================================
# Production Deployment Script
# ==============================================================================
# This script deploys your application to a production Kubernetes cluster
#
# Prerequisites:
# 1. kubectl configured for your production cluster
# 2. Domain pointing to your cluster's LoadBalancer IP
# 3. Update placeholders in k8s/production/ingress.yaml
#
# Usage: .\scripts\deploy-production.ps1 -Domain "api.yourdomain.com" -Email "you@email.com"
# ==============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [string]$Namespace = "default"
)

Write-Host "🚀 Deploying to Production Kubernetes..." -ForegroundColor Cyan
Write-Host ""

# Verify kubectl is configured
Write-Host "Checking kubectl configuration..." -ForegroundColor Yellow
$context = kubectl config current-context
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ kubectl not configured. Please set up your kubeconfig first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Connected to context: $context" -ForegroundColor Green
Write-Host ""

# Update ingress.yaml with actual domain and email
Write-Host "📝 Updating configuration with your domain..." -ForegroundColor Yellow
$ingressContent = Get-Content "k8s/production/ingress.yaml" -Raw
$ingressContent = $ingressContent -replace "your-email@example.com", $Email
$ingressContent = $ingressContent -replace "api.yourdomain.com", $Domain
$ingressContent = $ingressContent -replace "https://yourdomain.com", "https://$Domain"
$ingressContent | Set-Content "k8s/production/ingress-configured.yaml"

# Step 1: Deploy core application
Write-Host "📦 Deploying application..." -ForegroundColor Yellow
kubectl apply -f k8s/rabbitmq.yaml -n $Namespace
kubectl apply -f k8s/api.yaml -n $Namespace

Write-Host ""
Write-Host "⏳ Waiting for pods to be ready..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=morpho-api -n $Namespace --timeout=5m
kubectl wait --for=condition=ready pod -l app=rabbitmq -n $Namespace --timeout=5m

# Step 2: Install NGINX Ingress Controller (if not already installed)
Write-Host ""
Write-Host "🌐 Checking for NGINX Ingress Controller..." -ForegroundColor Yellow
$ingressExists = kubectl get ns ingress-nginx 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing NGINX Ingress Controller..." -ForegroundColor Yellow
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
    
    Write-Host "⏳ Waiting for Ingress Controller..." -ForegroundColor Yellow
    kubectl wait --namespace ingress-nginx `
        --for=condition=ready pod `
        --selector=app.kubernetes.io/component=controller `
        --timeout=5m
} else {
    Write-Host "✅ NGINX Ingress already installed" -ForegroundColor Green
}

# Step 3: Install cert-manager (if not already installed)
Write-Host ""
Write-Host "🔐 Checking for cert-manager..." -ForegroundColor Yellow
$certManagerExists = kubectl get ns cert-manager 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing cert-manager..." -ForegroundColor Yellow
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml
    
    Write-Host "⏳ Waiting for cert-manager..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    kubectl wait --namespace cert-manager `
        --for=condition=ready pod `
        --selector=app.kubernetes.io/instance=cert-manager `
        --timeout=5m
} else {
    Write-Host "✅ cert-manager already installed" -ForegroundColor Green
}

# Step 4: Deploy Ingress with SSL
Write-Host ""
Write-Host "🌍 Deploying Ingress and SSL..." -ForegroundColor Yellow
kubectl apply -f k8s/production/ingress-configured.yaml -n $Namespace

# Step 5: Get LoadBalancer IP
Write-Host ""
Write-Host "📋 Getting LoadBalancer IP..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$loadBalancerIP = ""
$attempts = 0
while ([string]::IsNullOrEmpty($loadBalancerIP) -and $attempts -lt 30) {
    $loadBalancerIP = kubectl get svc -n ingress-nginx ingress-nginx-controller `
        -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
    
    if ([string]::IsNullOrEmpty($loadBalancerIP)) {
        Write-Host "⏳ Waiting for LoadBalancer IP..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        $attempts++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 LoadBalancer IP: " -NoNewline -ForegroundColor Yellow
Write-Host "$loadBalancerIP" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Configure your DNS:" -ForegroundColor Cyan
Write-Host "   Type: A Record" -ForegroundColor White
Write-Host "   Name: $Domain" -ForegroundColor White
Write-Host "   Value: $loadBalancerIP" -ForegroundColor White
Write-Host ""
Write-Host "⏰ SSL certificate will be issued in 2-5 minutes" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Check certificate status:" -ForegroundColor Cyan
Write-Host "   kubectl get certificate -n $Namespace" -ForegroundColor White
Write-Host ""
Write-Host "🌍 Your API will be available at:" -ForegroundColor Cyan
Write-Host "   https://$Domain/api/v1/health/ready" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Clean up temporary file
Remove-Item "k8s/production/ingress-configured.yaml" -ErrorAction SilentlyContinue
