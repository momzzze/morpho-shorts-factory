# GitHub Actions CI/CD Workflows

This directory contains automated workflows for building and deploying the Morpho Shorts Factory application.

## 🚀 Available Workflows

### `api-ci-cd.yml` - API Build and Deploy

Automatically builds and deploys the API service on code changes.

**Triggers:**

- Push to `main` branch (changes in `apps/api/**`)
- Pull requests to `main` branch
- Manual trigger via GitHub Actions UI

**What it does:**

1. ✅ Builds Docker image for the API
2. 📦 Pushes image to GitHub Container Registry (ghcr.io)
3. 🏷️ Tags with commit SHA and `latest`
4. 📋 Creates deployment summary

## 🔧 Setup Instructions

### 1. Enable GitHub Container Registry

GitHub Container Registry is automatically available. Images will be pushed to:

```
ghcr.io/momzzze/morpho-shorts-factory/morpho-api:latest
```

### 2. Make Repository Package Public (Optional)

By default, packages are private. To make them public:

1. Go to https://github.com/momzzze?tab=packages
2. Find `morpho-shorts-factory/morpho-api`
3. Click "Package settings"
4. Scroll down and click "Change visibility" → "Public"

### 3. Authenticate Locally

To pull images on your local machine:

```powershell
# Run the setup script
.\scripts\setup-ghcr-auth.ps1

# Or manually login
docker login ghcr.io -u momzzze
```

You'll need a Personal Access Token (PAT) with these scopes:

- `read:packages`
- `write:packages`

Create one here: https://github.com/settings/tokens

### 4. Update Local Kubernetes

After GitHub Actions builds a new image, update your local cluster:

```powershell
# Automated script
.\scripts\update-k8s-image.ps1

# Or manually
docker pull ghcr.io/momzzze/morpho-shorts-factory/morpho-api:latest
docker tag ghcr.io/momzzze/morpho-shorts-factory/morpho-api:latest morpho-api:latest
k3d image import morpho-api:latest -c morpho
kubectl rollout restart deployment/morpho-api
```

## 🔄 Automated Deployment Flow

```
┌─────────────────┐
│   Push to Git   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│  - Build Image  │
│  - Run Tests    │
│  - Push to GHCR │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Your Machine   │
│  - Pull Image   │
│  - Import k3d   │
│  - Restart Pod  │
└─────────────────┘
```

## 🌐 Production Deployment

For production Kubernetes clusters, uncomment the deployment section in `api-ci-cd.yml`:

1. Add your cluster's kubeconfig as a GitHub Secret named `KUBE_CONFIG`
2. Uncomment the "Deploy to remote cluster" section
3. Update the context name and namespace

The workflow will automatically deploy to your production cluster on push to main.

## 📊 Monitoring Deployments

View workflow runs:

- https://github.com/momzzze/morpho-shorts-factory/actions

Check your images:

- https://github.com/momzzze?tab=packages

## 🛠️ Troubleshooting

### "Failed to pull image"

Make sure you're authenticated:

```powershell
.\scripts\setup-ghcr-auth.ps1
```

### "Permission denied"

Your PAT needs `read:packages` and `write:packages` scopes.

### "Image not found"

- Check if the workflow completed successfully
- Verify image exists at https://github.com/momzzze?tab=packages
- Make sure package is public or you're authenticated

## 📝 Adding More Services

To add CI/CD for other services (worker, ai-service):

1. Copy `api-ci-cd.yml`
2. Rename to `worker-ci-cd.yml`
3. Update paths, image names, and deployment names
4. Update Kubernetes manifests in `k8s/`
