# Production Deployment Workflow

## 🎯 Environment Strategy

### Environments:

1. **Local (k3d)** - Your development machine
2. **Dev/Staging (Railway)** - Auto-deploys from `main` branch
3. **Production (Railway)** - Manual deployment or from `production` branch

## 🚀 Deployment Flow

### Day-to-Day Development:

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# ✅ Automatically deploys to DEV environment
# 🧪 Test at: https://your-dev-url.up.railway.app
```

### Deploying to Production:

#### Method 1: Manual Deployment (Recommended for now)

```bash
# After testing in DEV, manually deploy in Railway:
1. Go to Railway dashboard
2. Click on production service
3. Click "Deploy" button
```

#### Method 2: Production Branch

```bash
# Merge main to production branch
git checkout production
git merge main
git push origin production

# ✅ Automatically deploys to PROD
```

#### Method 3: Version Tags (Professional)

```bash
# Create a release tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# ✅ Builds and tags Docker image as v1.0.0
# Then manually deploy in Railway using this specific version
```

## 📋 Railway Setup for Dev/Prod

### Current Setup (Single Environment):

You have one service that deploys on every push to `main`.

### Option A: Disable Auto-Deploy (Simplest)

**In Railway:**

1. Click on your service
2. Go to Settings
3. Find "Source" or "Deploys" section
4. **Uncheck "Auto-deploy"**

**Now to deploy:**

- Push to GitHub (builds image)
- Go to Railway
- Click "Deploy" when ready

### Option B: Create Separate Environments

**1. Current service → Rename to "morpho-api-dev":**

- Settings → General → Service Name: `morpho-api-dev`
- Keeps auto-deploy from `main`

**2. Create production service:**

- Click "+ Create" in Railway
- Select "Empty Service"
- Name it: `morpho-api-prod`
- Settings → Source → Connect to GitHub
- Select repo: `morpho-shorts-factory`
- **Important:** Set branch to `production` or disable auto-deploy

**3. Add same environment variables to prod:**

- Copy all variables from dev service
- Or better: Use Railway's shared variables feature

**4. Point to production image:**

- Settings → Source
- Change from "Dockerfile" to "Image"
- Image: `ghcr.io/momzzze/morpho-shorts-factory/morpho-api:latest`

## 🔄 Complete Workflow

### 1. Development:

```bash
# Work on feature
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "feat: new feature"
git push origin feature/new-feature

# Create PR to main
# After review, merge to main
# ✅ Auto-deploys to DEV
```

### 2. Testing in DEV:

```bash
# Test at your DEV URL
curl https://morpho-api-dev.up.railway.app/api/v1/health/ready

# If bugs found, fix and push to main again
# DEV updates automatically
```

### 3. Production Deployment:

```bash
# When satisfied with DEV:

# Option A: Manual in Railway
# → Go to Railway, click Deploy

# Option B: Production branch
git checkout production
git merge main
git push origin production
# ✅ Auto-deploys to PROD

# Option C: Release tag
git tag v1.0.0
git push origin v1.0.0
# Then manually deploy in Railway
```

## 🎬 Quick Start (Recommended Approach)

### Right Now - Simplest Setup:

1. **Disable auto-deploy in Railway:**

   - Railway → Your Service → Settings
   - Uncheck "Auto-deploy"

2. **Your workflow becomes:**
   ```bash
   # Develop locally
   # Push to GitHub → Builds image
   # Manually deploy in Railway when ready
   ```

### Later - When You Want Staging:

1. **Create `production` branch:**

   ```bash
   git checkout -b production
   git push origin production
   ```

2. **Update Railway:**
   - Current service: Auto-deploy from `main` (staging)
   - Duplicate service: Manual deploy or from `production` branch

## 📊 Environment Comparison

| Environment      | Purpose         | Deployment               | URL                     |
| ---------------- | --------------- | ------------------------ | ----------------------- |
| **Local k3d**    | Development     | Manual                   | localhost:5000          |
| **Railway Dev**  | Staging/Testing | Auto (main)              | xxx-dev.up.railway.app  |
| **Railway Prod** | Production      | Manual/production branch | xxx-prod.up.railway.app |

## 🛡️ Best Practices

1. **Never push directly to production branch**
2. **Always test in DEV first**
3. **Use version tags for releases**
4. **Keep production stable - only merge tested code**
5. **Have rollback plan** (Railway keeps previous deployments)

## 🔙 Rollback

If production breaks:

1. Railway → Production Service → Deployments
2. Find last working deployment
3. Click "Redeploy"
4. Or revert git commits and redeploy

## 📝 Summary

**Start simple:**

- Disable auto-deploy in Railway
- Deploy manually when ready

**Later upgrade to:**

- Separate dev/prod environments
- Branch-based deployments
- Automated testing before prod
