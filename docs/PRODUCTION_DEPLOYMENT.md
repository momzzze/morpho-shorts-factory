# ==============================================================================

# Production Kubernetes Deployment Guide

# ==============================================================================

# This guide helps you deploy Morpho Shorts Factory to production

# ==============================================================================

## Option 1: DigitalOcean Kubernetes (Recommended for Beginners)

### Step 1: Create Cluster

1. Go to: https://cloud.digitalocean.com/kubernetes/clusters/new
2. Choose region closest to your users
3. Select smallest node size ($12/month): Basic, 2GB RAM, 1 vCPU
4. Number of nodes: 2 (for high availability)
5. Cluster name: `morpho-production`
6. Click "Create Cluster"

### Step 2: Connect to Cluster

```powershell
# Install doctl
choco install doctl

# Authenticate
doctl auth init

# Download kubeconfig
doctl kubernetes cluster kubeconfig save morpho-production

# Verify connection
kubectl get nodes
```

### Step 3: Deploy Application

```powershell
# Your images are already on ghcr.io, so we can use them directly!

# Apply all Kubernetes configs
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/api.yaml

# Check status
kubectl get all -n morpho
```

### Step 4: Expose to Internet with Ingress

```powershell
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/do/deploy.yaml

# Wait for LoadBalancer IP
kubectl get svc -n ingress-nginx
```

### Step 5: Point Domain to LoadBalancer

1. Get the LoadBalancer IP from above command
2. Go to your domain registrar (Namecheap, GoDaddy, Cloudflare)
3. Create an A record: `api.yourdomain.com` → `LOADBALANCER_IP`

### Step 6: Setup SSL with Cert-Manager

```powershell
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Apply SSL issuer (see k8s/production/cert-issuer.yaml)
kubectl apply -f k8s/production/cert-issuer.yaml

# Apply ingress with SSL (see k8s/production/ingress.yaml)
kubectl apply -f k8s/production/ingress.yaml
```

---

## Option 2: Cheapest VPS with k3s ($5/month)

### Step 1: Create VPS

1. Hetzner (https://www.hetzner.com/cloud) - €4.15/month
2. DigitalOcean (https://www.digitalocean.com) - $6/month
3. Choose Ubuntu 22.04

### Step 2: Install k3s

```bash
# SSH into your VPS
ssh root@YOUR_SERVER_IP

# Install k3s
curl -sfL https://get.k3s.io | sh -

# Get kubeconfig
cat /etc/rancher/k3s/k3s.yaml
```

### Step 3: Connect Locally

```powershell
# Copy kubeconfig content from server
# Save to: ~/.kube/config-production

# Replace 127.0.0.1 with your SERVER_IP in the file

# Set context
$env:KUBECONFIG="$HOME\.kube\config-production"

# Test connection
kubectl get nodes
```

### Step 4: Deploy

```powershell
kubectl apply -f k8s/
```

---

## Option 3: Free Tier - Google Cloud Run (Easiest)

For APIs without complex dependencies:

```powershell
# Install gcloud CLI
choco install gcloudsdk

# Authenticate
gcloud auth login

# Deploy directly from GitHub image
gcloud run deploy morpho-api \
  --image ghcr.io/momzzze/morpho-shorts-factory/morpho-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Option 4: Quick Test with Cloudflare Tunnel (Temporary)

```powershell
# Install cloudflared
choco install cloudflared

# Expose local cluster
.\scripts\expose-local.ps1
```

---

## Recommended Path for Production:

1. **Start:** DigitalOcean Kubernetes ($12/month)
2. **Domain:** Buy a domain ($10/year)
3. **SSL:** Use cert-manager (free)
4. **CI/CD:** Update GitHub Actions to deploy automatically
5. **Monitoring:** Add Prometheus + Grafana

---

## Cost Comparison:

| Option            | Cost/Month | Best For                 |
| ----------------- | ---------- | ------------------------ |
| Cloudflare Tunnel | Free       | Testing only             |
| VPS + k3s         | $5-10      | Small projects, learning |
| DigitalOcean K8s  | $12-24     | Production, ease of use  |
| GKE/EKS/AKS       | $70+       | Enterprise, scaling      |
| Cloud Run         | $0-5       | Serverless, simple APIs  |

---

Which option would you like to set up?
