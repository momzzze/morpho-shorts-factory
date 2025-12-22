# ==============================================================================

# Railway Deployment - Step by Step Guide

# ==============================================================================

## ✅ Step 1: Create Railway Project

1. Go to: https://railway.app/new
2. Click "Login with GitHub"
3. Click "Deploy from GitHub repo"
4. Select: momzzze/morpho-shorts-factory
5. Railway will start building automatically

## ✅ Step 2: Configure Dockerfile Path

If Railway asks for configuration:

- **Root Directory:** /
- **Dockerfile Path:** apps/api/Dockerfile
- **Build Context:** . (root)

Or Railway might auto-detect it!

## ✅ Step 3: Add Database

In your Railway project:

1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway automatically creates `DATABASE_URL` variable

## ✅ Step 4: Add RabbitMQ

1. Click **"+ New"** button
2. Select **"Database"**
3. Choose **"RabbitMQ"** (if available)

   OR use CloudAMQP (recommended):

   - Go to https://www.cloudamqp.com
   - Sign up (free tier)
   - Create instance
   - Copy connection URL
   - Add to Railway as RABBIT_URL

## ✅ Step 5: Environment Variables

In your API service, click **"Variables"** tab and add:

### Required Variables:

```
PORT=5001
NODE_ENV=production
```

### Auto-Generated (Railway creates these):

```
DATABASE_URL  (from PostgreSQL service)
RABBIT_URL    (from RabbitMQ or add CloudAMQP URL)
```

### Generate These:

```
SESSION_SECRET=<click "Generate" button>
API_KEY=<click "Generate" button>
```

### Optional:

```
CORS_ORIGINS=https://yourdomain.com
```

## ✅ Step 6: Get Your URL

After deployment (2-5 minutes):

1. Click on your API service
2. Go to **"Settings"** tab
3. Scroll to **"Networking"**
4. You'll see a URL like:
   ```
   https://morpho-api-production-xxxx.up.railway.app
   ```

## ✅ Step 7: Test Your API

```powershell
# Test health endpoint
curl https://your-railway-url.up.railway.app/api/v1/health/ready
```

## ✅ Step 8: Add Custom Domain (Optional)

In Railway Dashboard:

1. Settings → Domains
2. Click "Add Domain"
3. Enter your domain: api.yourdomain.com
4. Add CNAME record in your DNS:
   ```
   CNAME: api.yourdomain.com → your-railway-url.up.railway.app
   ```

## ✅ Step 9: Set Up Auto-Deploy

Railway automatically deploys on every push to main!

To test:

```powershell
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "Test auto-deploy"
git push origin main
```

Railway will automatically:

- Detect the push
- Build new Docker image
- Deploy without downtime
- Health check before switching

## 🎯 Quick Setup Commands

If you prefer CLI:

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Add services
railway add postgres
railway add redis  # Optional

# Deploy
railway up
```

## 💰 Cost Breakdown

**Hobby Plan:** $5/month includes:

- API service (512MB RAM)
- PostgreSQL database
- Automatic SSL
- Custom domains
- Auto-deploys from GitHub

**Additional:**

- RabbitMQ: Use CloudAMQP free tier (1M messages/month)

**Total: $5-7/month**

## 🔍 Monitor Deployments

Watch logs in real-time:

```powershell
railway logs
```

Or in Railway dashboard:

- Click on service
- Go to "Deployments" tab
- Click latest deployment
- View build & runtime logs

## 🐛 Troubleshooting

### Build fails?

- Check Railway logs
- Verify Dockerfile path
- Check environment variables

### Can't connect to database?

- DATABASE_URL should be auto-injected
- Check in Variables tab

### Health check fails?

- Make sure /api/v1/health/ready endpoint works
- Check if PORT=5001 is set
- View runtime logs

## 📋 Checklist

- [ ] Project created on Railway
- [ ] GitHub repo connected
- [ ] PostgreSQL database added
- [ ] RabbitMQ/CloudAMQP configured
- [ ] Environment variables set
- [ ] First deployment successful
- [ ] Health endpoint responds
- [ ] Custom domain configured (optional)
- [ ] Auto-deploy tested

## 🎉 You're Done!

Your API is now live at:

```
https://your-app.up.railway.app/api/v1/health/ready
```

Check deployment status:

```powershell
railway status
```
