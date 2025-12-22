# Morpho Shorts Factory - AI Coding Agent Guide

## Architecture Overview

This is a **microservices-based video processing pipeline** with event-driven architecture:

- **apps/api** (TypeScript/Express): REST API & RabbitMQ producer
- **apps/worker** (TypeScript/Node.js): Task consumer for generic processing
- **apps/ai-service** (Python): AI processing service & consumer/producer
- **RabbitMQ**: Event bus using topic exchange pattern (`morpho.events`)
- **k8s/**: Kubernetes manifests for local (k3d) and production deployment

### Key Principle

"Ship something useful first, then make it smarter" - AI features are **optional enhancements**, not requirements. The pipeline works without heavy AI dependencies.

## Essential Workflows

### Development Setup

```bash
# This is a pnpm workspace monorepo
pnpm install                 # Install all dependencies (run from root)

# Run services in separate terminals:
pnpm dev:api                 # Terminal 1: API on port 5001
pnpm dev:worker              # Terminal 2: Worker service
cd apps/ai-service && python src/main.py  # Terminal 3: AI service

# Local RabbitMQ (required):
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### RabbitMQ Integration Pattern

All services communicate via RabbitMQ **topic exchange** (`morpho.events`):

1. **Producer** ([apps/api/src/rabbitmq/producer.ts](apps/api/src/rabbitmq/producer.ts)):

   ```typescript
   await producer.sendMessage('task.created', { taskId, taskType, data });
   ```

2. **Consumer** subscribes using routing keys:

   - API: `task.created` → `morpho-api-tasks` queue
   - Worker: `task.created` → `worker.tasks.queue`
   - AI Service: consumes AI requests, publishes responses

3. **Adding new events**: Follow the pattern in [apps/api/src/rabbitmq/setup.ts](apps/api/src/rabbitmq/setup.ts#L36-L46):
   - Subscribe in `initializeRabbitMQ()`
   - Add handler in [apps/api/src/rabbitmq/handlers.ts](apps/api/src/rabbitmq/handlers.ts)

## Project-Specific Conventions

### Error Handling

All API errors use [ApiError class](apps/api/src/errors.ts):

```typescript
throw new ApiError('Not found', { statusCode: 404, code: 'NOT_FOUND' });
```

Centralized error middleware in [apps/api/src/index.ts](apps/api/src/index.ts#L47-L70) handles both `ApiError` and unexpected errors with request ID tracking.

### Environment Variables

- Use [Zod schemas](apps/api/src/env.ts) for validation (apps/api pattern)
- Required vars: `RABBIT_URL`, `PORT` (defaults to 5001)
- Optional: `CORS_ORIGINS` (comma-separated), `DATABASE_URL`

### Logging

- API uses **pino** with HTTP request logging ([httpLogger.ts](apps/api/src/httpLogger.ts))
- Every request gets a unique `requestId` (see [middleware/requestId.ts](apps/api/src/middleware/requestId.ts))
- Python service uses standard `logging` module

### TypeScript Configuration

- All apps use `"type": "module"` (ES modules)
- Dev: `tsx` for running TypeScript directly
- Build: `tsc` compiles to `dist/`
- Import paths must include `.js` extension: `import { x } from './file.js'`

## Deployment

### Environments

1. **Local (k3d)**: Full Kubernetes stack on dev machine
2. **Dev/Staging (Railway)**: Auto-deploys from `main` branch
3. **Production (Railway)**: Manual deployment or `production` branch

### Key Deployment Files

- [k8s/api.yaml](k8s/api.yaml): Kubernetes deployment for API service
- [k8s/rabbitmq.yaml](k8s/rabbitmq.yaml): RabbitMQ StatefulSet config
- [render.yaml](render.yaml): Alternative cloud deployment config
- [docs/DEPLOYMENT_WORKFLOW.md](docs/DEPLOYMENT_WORKFLOW.md): Full deployment guide

### Scripts

```bash
# PowerShell scripts (Windows):
scripts/quick-update.ps1       # Quick K8s deployment update
scripts/update-k8s-image.ps1   # Update specific K8s image
scripts/deploy-production.ps1  # Production deployment
```

## Common Patterns

### Adding a New API Endpoint

1. Create route in [apps/api/src/routes/](apps/api/src/routes/) (e.g., `messages/index.ts`)
2. Add controller in [apps/api/src/controllers/](apps/api/src/controllers/)
3. Use `asyncHandler` wrapper: `asyncHandler(async (req, res) => {...})`
4. Validation: Zod schemas in [apps/api/src/utils/validation.ts](apps/api/src/utils/validation.ts)
5. Register route in [apps/api/src/routes/index.ts](apps/api/src/routes/index.ts)

### Adding a New Worker Task Type

1. Add event type to shared package (if exists) or define locally
2. Update [apps/worker/src/index.ts](apps/worker/src/index.ts#L32-L41) handler switch statement
3. Create dedicated handler function following existing pattern

### Storage Strategy

Uses **pluggable storage abstraction**:

```env
STORAGE_DRIVER=local | s3
```

Supports local filesystem (dev) or S3-compatible storage (production).

## Documentation Structure

- [README.md](README.md): Project overview & philosophy
- [docs/MESSAGING_ARCHITECTURE.md](docs/MESSAGING_ARCHITECTURE.md): RabbitMQ setup & message flow
- [docs/DEPLOYMENT_WORKFLOW.md](docs/DEPLOYMENT_WORKFLOW.md): Deployment strategies
- [apps/api/API-ARCHITECTURE.md](apps/api/API-ARCHITECTURE.md): API structure details

## Critical Context

- **Package Manager**: Must use `pnpm` (v10.26.1) - enforced by packageManager field
- **Port**: API defaults to 5001 (not 3000) - check [apps/api/src/env.ts](apps/api/src/env.ts#L5)
- **RabbitMQ**: Services gracefully handle missing RabbitMQ (logs warning, continues)
- **Video Pipeline**: FFmpeg is core dependency for video processing (not yet fully implemented)
- **Kubernetes**: Local dev uses k3d, not Docker Desktop Kubernetes
