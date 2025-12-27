# Deployment Safety Checklist

## Before Every Deploy

Run this command locally:

```bash
cd apps/api
pnpm check
```

This validates:

- ✅ TypeScript compiles without errors
- ✅ Prisma schema is valid
- ✅ Prisma client generates successfully
- ✅ Environment variables are configured

## Automated Safety Features

### 1. **Pre-commit Hook**

Automatically runs on `git commit` to catch issues early.

### 2. **Health Check Endpoint**

Railway uses `/health/ready` to verify:

- Database connection is working
- Application is ready to serve traffic

### 3. **Startup Retry Logic**

- Retries database connection up to 30 times (60 seconds)
- Gracefully handles database startup delays
- Continues running even if db push fails (for debugging)

### 4. **Railway Configuration** (`railway.json`)

- Restart policy: Retries up to 10 times on failure
- Health check timeout: 100 seconds
- Won't route traffic until health check passes

## Manual Pre-Deploy Checks

### For Schema Changes

```bash
# 1. Test locally first
pnpm dev

# 2. Validate schema
pnpm prisma validate

# 3. Check what will change
pnpm prisma db push --help
```

### For Code Changes

```bash
# 1. Type check
pnpm tsc --noEmit

# 2. Build test
pnpm build

# 3. Test locally
pnpm dev
```

## Railway Deployment Flow

1. **Push to GitHub** → Railway detects changes
2. **Build Phase** → Dockerfile builds image
3. **Health Check** → Railway calls `/health/ready`
4. **Traffic Routing** → Only routes if health check passes
5. **Old Instance** → Kept running until new one is healthy

## Emergency Rollback

If deployment fails:

```bash
# Railway dashboard → Deployments → Click previous successful deployment → Redeploy
```

Or via Railway CLI:

```bash
railway rollback
```

## Production Best Practices

### Dev Database (Postgres-dev)

- Uses `prisma db push` (no migration history)
- Fast iteration, can reset easily
- Schema changes apply immediately

### Production Database (Postgres-prod)

- Should use `prisma migrate deploy` (with migration files)
- Track schema changes in version control
- Create migrations locally with `pnpm db:migrate`

## Common Issues & Prevention

| Issue             | Prevention        | Detection      |
| ----------------- | ----------------- | -------------- |
| TypeScript errors | Pre-commit hook   | `pnpm check`   |
| Schema invalid    | Prisma validation | `pnpm check`   |
| Database timing   | Retry logic       | Health check   |
| Missing env vars  | Environment check | Runtime logs   |
| Build failures    | Local build test  | CI/CD pipeline |

## Quick Commands

```bash
# Run all checks before pushing
pnpm check

# Test the build locally
pnpm build

# Validate Prisma schema
pnpm prisma validate

# Check TypeScript
pnpm tsc --noEmit

# Test health endpoint locally
curl http://localhost:5001/health/ready
```
