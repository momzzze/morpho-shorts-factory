# Railway + GitHub Actions Setup Guide

## 🎯 Goal

- **DEV environment**: Auto-deploys when you push to `main`
- **PROD environment**: Requires manual approval before deploying

## 📋 Prerequisites

- Railway account with project: `enthusiastic-acceptance`
- Two services in Railway:
  - `morpho-api-dev` (for development)
  - `morpho-api-prod` (for production)

## 🔑 Step 1: Get Railway Project Token

### Get Your Token:

1. Go to Railway dashboard: https://railway.app
2. Click on your project: **enthusiastic-acceptance**
3. Click on **Settings** (bottom left, gear icon)
4. Scroll down to **Tokens** section
5. Click **+ New Token**
6. Name it: `github-actions`
7. Copy the token (starts with something like `0x...`)
8. **Important**: Save this token - you can't see it again!

### Get Your Project ID:

While in Settings, also copy your **Project ID** (you'll need this too)

## 🔐 Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository: **momzzze/morpho-shorts-factory**
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Add Railway Token:

- **Name**: `RAILWAY_TOKEN`
- **Value**: Paste your Railway token (the one from Step 1)
- Click **Add secret**

### Add Railway Project ID:

- Click **New repository secret** again
- **Name**: `RAILWAY_PROJECT_ID`
- **Value**: Paste your Project ID
- Click **Add secret**

## 🛡️ Step 3: Configure Production Environment Protection

This adds a manual approval step before deploying to production:

1. Go to GitHub repository → **Settings** → **Environments**
2. Click **New environment**
3. Name it: `production`
4. Click **Configure environment**
5. Check **Required reviewers**
6. Add yourself as a reviewer
7. Click **Save protection rules**

## 🚀 Step 4: Test the Workflow

### Test DEV Auto-Deploy:

```bash
# Make a change
echo "# Test change" >> README.md
git add README.md
git commit -m "test: dev auto-deploy"
git push origin main

# ✅ GitHub Actions will:
# 1. Build Docker image
# 2. Push to ghcr.io
# 3. Automatically deploy to Railway DEV
```

### Test PROD Manual Deploy:

```bash
# Create production branch if you haven't
git checkout -b production
git push origin production

# Make a change on main
git checkout main
echo "# Production change" >> README.md
git add README.md
git commit -m "feat: new production feature"
git push origin main

# Test in DEV first...
# When ready for production:
git checkout production
git merge main
git push origin production

# 🛑 GitHub Actions will:
# 1. Build Docker image
# 2. Push to ghcr.io
# 3. WAIT for your manual approval
# 4. Go to GitHub → Actions tab
# 5. Click on the running workflow
# 6. Click "Review deployments"
# 7. Check "production" and click "Approve and deploy"
# 8. Only THEN will it deploy to Railway PROD
```

## 📊 Workflow Visualization

```
┌─────────────────┐
│  Push to main   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build & Test   │
│  (Docker image) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy DEV      │
│ (Automatic)     │ ✅ Auto-deploys
└─────────────────┘

┌─────────────────┐
│Push to prod br. │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build & Test   │
│  (Docker image) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ⏸️  Wait for     │
│  Manual Approval│ 🛑 Requires approval
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy PROD     │
│   (Manual)      │ ✅ After approval
└─────────────────┘
```

## 🔄 Alternative: Railway's Built-in GitHub Integration

If you prefer Railway to handle everything (simpler):

### DEV Service:

1. Railway → `morpho-api-dev` → Settings
2. Source → Connect to GitHub
3. Repository: `momzzze/morpho-shorts-factory`
4. Branch: `main`
5. **Enable** "Auto-deploy"
6. Build: Use Dockerfile at `apps/api/Dockerfile`

### PROD Service:

1. Railway → `morpho-api-prod` → Settings
2. Source → Connect to GitHub
3. Repository: `momzzze/morpho-shorts-factory`
4. Branch: `production`
5. **Disable** "Auto-deploy" ⚠️
6. Build: Use Dockerfile at `apps/api/Dockerfile`

**To deploy PROD:**

- Push to `production` branch
- Go to Railway dashboard
- Click "Deploy" button manually

## ✅ Verification

### Check DEV is working:

```bash
curl https://your-dev-url.up.railway.app/api/v1/health/ready
```

### Check PROD is working:

```bash
curl https://your-prod-url.up.railway.app/api/v1/health/ready
```

## 🐛 Troubleshooting

### "Error: Railway token is invalid"

- Regenerate token in Railway
- Update GitHub secret

### "Error: Service not found"

- Check service name matches in workflow file
- Should be `morpho-api-dev` or `morpho-api-prod`

### DEV deploys but PROD doesn't wait for approval:

- Check GitHub Settings → Environments → production
- Ensure "Required reviewers" is enabled

## 📝 Summary

**You now have:**

- ✅ GitHub Actions builds Docker images
- ✅ DEV auto-deploys on push to `main`
- ✅ PROD requires manual approval before deploying
- ✅ Full control over production deployments
