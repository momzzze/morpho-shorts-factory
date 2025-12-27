# Morpho Shorts Factory

🎬 An experimental platform for building an automated short-form video pipeline.

This project focuses on turning long-form video into short, vertical clips through a microservices architecture.  
It intentionally starts **without heavy AI dependencies**, while being designed to **evolve naturally with AI features** when they add real value.

---

## What this is

Morpho Shorts Factory is both:

- a **working microservices platform** for short-form video automation
- a **playground** for experimenting with video processing, event-driven messaging, and AI-assisted workflows

The philosophy is simple:  
**ship something useful first, then make it smarter over time.**

---

## Core goals

- ⚙️ Build a reliable video pipeline using Node.js and FFmpeg
- 🧱 Keep architecture clean and modular with microservices
- 🤖 Treat AI as an optional enhancement, not a requirement
- 📦 Support event-driven communication via RabbitMQ
- 🚀 Scale via workers and message queues, not monolith logic

---

## Current Architecture

### Services

**apps/api** (TypeScript/Express)

- REST API server (port 5001)
- PostgreSQL database with Prisma ORM v6.19.1
- RabbitMQ producer for event publishing
- Health checks at `/health/live` and `/health/ready`
- Deployed on Railway with auto-deploy from `main` branch

**apps/worker** (TypeScript/Node.js)

- Generic task consumer from RabbitMQ
- Processes background jobs asynchronously

**apps/ai-service** (Python)

- AI processing service (optional features)
- Consumes AI requests and publishes responses via RabbitMQ

### Message Queue

**RabbitMQ** (topic exchange: `morpho.events`)

- Event-driven architecture for inter-service communication
- Routing keys: `task.created`, `task.completed`, etc.
- Services subscribe to relevant event types

### Database

**PostgreSQL** (Railway-hosted)

- Development: Railway Postgres-dev
- Production: Railway Postgres-prod
- Schema managed via Prisma ORM
- Development uses `prisma db push` for rapid iteration
- Production planned to use `prisma migrate deploy`

### Data Models

```prisma
User
  - tier: FREE | PREMIUM | ENTERPRISE
  - storageUsedMB, storageQuotaMB

Video
  - status: PROCESSING | READY | FAILED
  - duringSec, sizeMB
  - Foreign key to User

Task
  - taskType, status, progress
  - Foreign key to User
  - Foreign key to Video (optional)
```

---

## Development Setup

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

### Environment Variables

Required for API service:

```env
DATABASE_URL=postgresql://...
RABBIT_URL=amqp://localhost
PORT=5001  # Defaults to 5001
NODE_ENV=development | production
```

---

## Deployment

### Railway Deployment

**Auto-deployment:**

- Push to `main` branch triggers automatic deployment
- Railway builds from Dockerfile in `apps/api/`
- Health checks at `/health/ready` validate database connection

**Database Strategy:**

- Development: Uses `prisma db push` for schema changes
- Production: Will use `prisma migrate deploy` with migration history

**Startup Process:**

```javascript
// apps/api/src/start.js
1. Wait for database connection (30 retries, 2s delay)
2. Push Prisma schema to database
3. Regenerate Prisma client at runtime
4. Start Express server
```

### Pre-deployment Safety

```bash
pnpm check    # Validates TypeScript, Prisma schema, environment
```

Pre-commit hook runs validation automatically before commits.

---

## Tech Stack

**Backend:**

- Node.js v22 with pnpm (v10.26.1)
- TypeScript (ES modules)
- Express.js for REST API
- Prisma ORM v6.19.1
- PostgreSQL database
- RabbitMQ for messaging

**Development Tools:**

- `tsx` for TypeScript execution
- Docker for local RabbitMQ
- Railway for hosting
- Git pre-commit hooks with validation

**Python Service:**

- Python 3.x
- RabbitMQ client for event consumption

---

## Project Structure

```
morpho-shorts-factory/
├── apps/
│   ├── api/              # Express API (TypeScript)
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── rabbitmq/
│   │   │   ├── middleware/
│   │   │   └── lib/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── Dockerfile
│   ├── worker/           # Background task processor
│   └── ai-service/       # Python AI service
├── docs/
│   ├── MESSAGING_ARCHITECTURE.md
│   ├── RAILWAY_DEPLOYMENT.md
│   └── DEPLOYMENT_SAFETY.md
└── k8s/                  # Kubernetes manifests (future)
```

---

## Documentation

- [API Architecture](apps/api/API-ARCHITECTURE.md) - REST API structure and patterns
- [Messaging Architecture](docs/MESSAGING_ARCHITECTURE.md) - RabbitMQ event flow
- [Railway Deployment](docs/RAILWAY_DEPLOYMENT.md) - Deployment guide
- [Deployment Safety](docs/DEPLOYMENT_SAFETY.md) - Pre-deployment checklist

---

## License

See [LICENSE](LICENSE) for details.
