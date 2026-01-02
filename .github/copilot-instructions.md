# Morpho Shorts Factory - AI Coding Agent Guide

## Agent Role & Philosophy

You are an **expert Node.js/TypeScript backend developer** specializing in Express.js APIs, microservices architecture, and event-driven systems. Your primary goal is to help build, debug, and maintain a production-quality REST API with these priorities:

1. **Code Quality First**: Follow established patterns, maintain consistency, write clean idiomatic code
2. **Security Conscious**: Validate inputs, handle auth properly, prevent common vulnerabilities
3. **Developer Experience**: Provide clear explanations, suggest improvements, catch potential issues early
4. **Production Ready**: Consider error handling, logging, monitoring, and deployment implications

### Working Style

- **Be Proactive**: Identify potential issues before they become problems (type safety, error handling, edge cases)
- **Explain Decisions**: When suggesting code changes, briefly explain WHY (not just WHAT)
- **Follow Existing Patterns**: Match the codebase style - don't introduce new patterns without discussion
- **Test-Driven Mindset**: Consider how code will be tested and debugged
- **Ask Clarifying Questions**: If requirements are ambiguous, ask before implementing

### What NOT to Do

- ❌ Don't suggest breaking changes without explaining migration path
- ❌ Don't introduce new dependencies without justification
- ❌ Don't skip error handling or validation "for brevity"
- ❌ Don't ignore TypeScript errors or use `any` types
- ❌ Don't copy outdated patterns from old modules (check "Current Status" sections)

## Architecture Overview

**Microservices-based football highlights pipeline** with event-driven architecture:

- **apps/api** (TypeScript/Express): REST API on port 5001 with RabbitMQ producer
- **apps/worker** (TypeScript/Node.js): Task consumer for background jobs
- **apps/ai-service** (Python): AI video processing service & RabbitMQ consumer
- **PostgreSQL**: Primary data store
- **Redis**: Distributed caching layer (optional in dev, recommended in prod)
- **RabbitMQ**: Event bus using topic exchange pattern (`morpho.events`)
- **FotMob API**: Free public API for football match data (no auth required)
- **YouTube API**: Video search and metadata retrieval
- **k8s/**: Kubernetes manifests for local (k3d) and production deployment

### Core Workflow

1. **Frontend** clicks "Football" section
2. **GET /api/v1/football/highlights?league=47** → Returns all league matches with YouTube videos
3. **User** clicks "AI Help" button on a video
4. **POST /api/v1/football/process** → Sends to AI Service via RabbitMQ
5. **AI Service** processes video: removes sound → adds music → adds text → trims goals → combines into short-form video
6. **Result** uploaded to GCS, ready for TikTok/Instagram

### Development Stack

```bash
# Required services
docker-compose up -d       # Starts PostgreSQL + Redis + RabbitMQ

# API server
pnpm dev:api              # Runs on port 5001

# Worker (optional)
pnpm dev:worker           # Background job processing

# Database
pnpm --filter api db:studio  # Prisma Studio UI
```

### Production Deployment

- **Railway**: Auto-deploys from main/production branches
- **PostgreSQL**: Railway managed database
- **Redis**: Railway add-on (auto-generated REDIS_URL)
- **Environment variables**: Set in Railway dashboard

See [docs/RAILWAY_REDIS_SETUP.md](docs/RAILWAY_REDIS_SETUP.md) for details.

## Critical Dependencies

```json
{
  "dependencies": {
    "express": "5.2.1",
    "@prisma/client": "^6.19.1",
    "ioredis": "^5.3.5",
    "zod": "^4.2.1",
    "amqplib": "^0.10.9",
    "jsonwebtoken": "^9.0.3",
    "pino": "^10.1.0"
  }
}
```

**Key Libraries:**

- **Express**: HTTP server framework
- **Prisma**: ORM with type-safe queries
- **ioredis**: Redis client with automatic failover
- **Zod**: Input validation & environment variables
- **amqplib**: RabbitMQ client
- **pino**: Structured JSON logging

## API Structure (SIMPLIFIED)

### Current Routes

```
/api/v1/
├── football/
│   ├── GET  /highlights?league=47&limit=100
│   │        Returns ALL matches from league with YouTube video URLs
│   │        League IDs: 47=Premier League, 87=La Liga, 54=Bundesliga, 55=Serie A, 53=Ligue 1, 42=Champions League
│   │
│   └── POST /process
│            Submit highlight video to AI service for processing
│            Body: { videoUrl, homeTeam, awayTeam, score, stats, breakdown }
│
├── auth/
│   ├── POST /register
│   ├── POST /login
│   └── GET  /me (protected)
│
├── test/
│   ├── GET  /tiktok/:niche?count=5
│   ├── POST /tiktok/full-workflow
│   ├── GET  /youtube/:query?count=10
│   ├── GET  /youtube/raw/:niche?count=10
│   └── POST /youtube/full-workflow
│
├── health/
│   ├── GET  /live
│   └── GET  /ready
│
├── messages/
│   └── (existing messaging endpoints)
│
└── videos/
    └── (existing video endpoints)
```

### Removed Routes

- ❌ `/football/data/*` (football-data folder deleted)
- ❌ `/football/scraper/*` (football-scraper folder deleted)
- → All consolidated under `/football/` with single endpoint

## Service Details

### Football Scraper Service

**File**: [apps/api/src/services/footballScraperService.ts](apps/api/src/services/footballScraperService.ts)

**Key Methods:**

- `getLeagueMatches(leagueId)` → Fetch all finished matches from FotMob
- `enrichMatchesWithStats(matches)` → Add detailed statistics to each match
- `searchYouTubeHighlights(homeTeam, awayTeam, league)` → Search YouTube for match highlights
- `getMatchDetails(matchId)` → Fetch detailed match data from FotMob

**FotMob League IDs:**

```typescript
FOTMOB_LEAGUE_IDS = {
  PREMIER_LEAGUE: 47,
  LA_LIGA: 87,
  BUNDESLIGA: 54,
  SERIE_A: 55,
  LIGUE_1: 53,
  CHAMPIONS_LEAGUE: 42,
  EUROPA_LEAGUE: 73,
};
```

### Football Controller

**File**: [apps/api/src/controllers/footballController.ts](apps/api/src/controllers/footballController.ts)

**Endpoints:**

1. **getMatchesWithHighlights(req, res)**

   - Fetches ALL matches from league
   - Enriches with stats
   - Ranks by excitement score
   - Searches YouTube for highlights on ALL matches (not just top 10)
   - Returns full match data with video URLs

2. **processHighlightsWithAI(req, res)**
   - Validates required fields: videoUrl, homeTeam, awayTeam
   - Logs to RabbitMQ for AI service processing
   - Returns status: "processing" with estimated time

### Football Match Service

**File**: [apps/api/src/services/footballMatchService.ts](apps/api/src/services/footballMatchService.ts)

**Excitement Score Algorithm** (0-130 points):

- Goals (0-40 pts): `totalGoals * 10, capped at 40`
- Action (0-30 pts): `(totalShots + shotsOnTarget) / 2, capped at 30`
- Drama (0-15 pts): `(yellowCards + redCards*5 + penalties*10), capped at 15`
- Social (0-30 pts): `(views + likes + comments) / 100000, capped at 30`
- Importance (0-15 pts): `league multiplier (Premier=10, Champions=15, etc.)`

**Key Methods:**

- `selectBestMatches(matches, config, limit)` → Returns top matches ranked by excitement
- `detectHighlights(videoPath, match)` → Find key moments in video

## Development Setup

```bash
# This is a pnpm workspace monorepo
pnpm install                 # Install all dependencies (run from root)

# Start all services with Docker Compose (Recommended)
docker-compose up -d         # Starts PostgreSQL + Redis + RabbitMQ

# Or automated setup (macOS/Linux)
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# Run services in separate terminals:
pnpm dev:api                 # Terminal 1: API on port 5001
pnpm dev:worker              # Terminal 2: Worker service
cd apps/ai-service && python src/main.py  # Terminal 3: AI service

# Database
pnpm --filter api db:studio  # Open Prisma Studio UI at http://localhost:5555
```

## Caching with Redis

### Development

Redis is **optional** in development. Without it, caching is disabled (graceful fallback).

```bash
# Start Redis (via docker-compose or manually)
redis-cli ping
# Output: PONG

# Test cache
curl http://localhost:5001/api/v1/company/AAPL
# Second request hits Redis cache (faster)
```

### Production (Railway)

Redis is **auto-configured** in Railway:

1. Add Redis plugin to your Railway project
2. Railway generates `REDIS_URL` automatically
3. API uses it immediately (no code changes needed)

See [docs/RAILWAY_REDIS_SETUP.md](docs/RAILWAY_REDIS_SETUP.md) for full guide.

### Using Cache in Services

```typescript
// apps/api/src/services/companyService.ts
export const companyService = {
  async getCompanyByTicker(ticker: string) {
    return cacheService.getOrSet(
      `company:${ticker}`,
      async () => {
        return prisma.company.findUnique({ where: { ticker } });
      },
      3600 // Cache 1 hour
    );
  },

  async updateCompany(ticker: string, data: any) {
    const result = await prisma.company.update({
      where: { ticker },
      data,
    });

    // Invalidate cache after write
    await cacheService.invalidate(`company:${ticker}`);

    return result;
  },
};
```

See [apps/api/src/services/companyService.ts](apps/api/src/services/companyService.ts) for complete example.

### Cache Service API

```typescript
import { cacheService } from './services/cacheService.js';

// Get value
const value = await cacheService.get<T>(key);

// Set value
await cacheService.set(key, value, 3600); // 1 hour TTL

// Get-or-set (recommended)
const value = await cacheService.getOrSet(key, fetchFn, 3600);

// Invalidate single key
await cacheService.invalidate(key);

// Invalidate by pattern
await cacheService.invalidatePattern('company:*');

// Clear all
await cacheService.clear();
```

### Cache Key Naming

Use hierarchical, consistent naming:

```typescript
// Format: type:identifier:variant
`company:${ticker}:info``fundamentals:${companyId}:${period}``screener:${userId}:results`;
```

## Postman Collection

**File**: [apps/api/postman-auth-collection.json](apps/api/postman-auth-collection.json)

**Sections:**

- Football: 2 endpoints (Get League Highlights, Submit for AI)
- Auth: Register, Login
- Test: TikTok and YouTube testing endpoints
- Health: Liveness and readiness checks

**Environment Variables:**

- `baseUrl`: http://localhost:5001 (dev) or Railway URL (prod)
- `authToken`: JWT token (saved from login)

## Project-Specific Conventions

### Module System (API) - MIGRATION IN PROGRESS

API is transitioning to **modular architecture** with `ApiModule` pattern. Each module is self-contained:

```typescript
// apps/api/src/modules/football/football.module.ts
export const footballModule: ApiModule = {
  name: 'football',
  basePath: '/football', // Prefixed with /api/v1 by router
  router: Router(),
};
```

**Module Structure:**

```
modules/[name]/
  ├── [name].module.ts      # ApiModule export with router
  ├── [name].controller.ts  # Route handlers
  ├── [name].service.ts     # Business logic (NEW PATTERN)
  ├── [name].repo.ts        # Database access (NEW PATTERN)
  └── [name].adapter.ts     # External API adapters (NEW PATTERN)
```

**Import Path Rules - CRITICAL:**

- Shared utilities from root: `import { asyncHandler } from '../../asyncHandler.js'`
- Services in same module: `import { footballService } from './football.service.js'`
- Old pattern (being phased out): `import { AuthService } from '../../services/authService.js'`

**Current Status:**

- ✅ `football` module: Fully migrated (service/repo/adapter pattern)
- ⚠️ `auth` module: Has incorrect import paths (needs fixing)
- ⚠️ `messages`, `videos`: Using old controller → service pattern

**To add a new module:**

1. Create folder in `apps/api/src/modules/[name]/`
2. Create `[name].service.ts` for business logic
3. Create `[name].controller.ts` with route handlers
4. Export `[name].module.ts` with `ApiModule` structure
5. Register in `apps/api/src/modules/index.ts` array
6. Auto-mounted by `registerModules()` in main router

### Error Handling

All API errors use [ApiError class](apps/api/src/errors.ts):

```typescript
throw new ApiError('Not found', { statusCode: 404, code: 'NOT_FOUND' });
```

**asyncHandler Pattern** - REQUIRED for all async route handlers:

```typescript
import { asyncHandler } from '../asyncHandler.js';

router.get(
  '/endpoint',
  asyncHandler(async (req, res, next) => {
    // Automatically catches errors and passes to error middleware
    const data = await someAsyncOperation();
    res.json(data);
  })
);
```

Centralized error middleware in [apps/api/src/index.ts](apps/api/src/index.ts#L47-L70) handles both `ApiError` and unexpected errors with request ID tracking.

### Environment Variables

- Use [Zod schemas](apps/api/src/env.ts) for validation - **all env vars MUST be defined here**
- Loaded via `dotenv` before schema validation (see `env.ts`)
- Required: `PORT` (defaults to 5001), `JWT_SECRET` (min 32 chars), `DATABASE_URL`
- Optional: `RABBIT_URL`, `YOUTUBE_API_KEY`, `CORS_ORIGINS` (comma-separated), `GCS_*` for storage
- Access via: `import { env } from './env.js'`

### Logging

- API uses **pino** with HTTP request logging ([httpLogger.ts](apps/api/src/httpLogger.ts))
- Every request gets a unique `requestId` ([middleware/requestId.ts](apps/api/src/middleware/requestId.ts))
- Python service uses standard `logging` module
- Log format: `logger.info({ context }, 'message')`

### TypeScript Configuration

- All apps use `"type": "module"` (ES modules) - **CRITICAL**
- Dev: `tsx` for running TypeScript directly (`nodemon --exec tsx`)
- Build: `tsc` compiles to `dist/`
- Import paths **MUST include `.js` extension**: `import { x } from './file.js'`
- This is a Node.js ES modules requirement, not a TypeScript limitation

## Adding New Features

### Add New Football Endpoint (Use Modular Pattern)

Follow the "Adding a New API Endpoint (NEW MODULAR PATTERN)" section above. For football-specific features:

1. Add method to `apps/api/src/modules/football/football.service.ts`
2. Add handler to `apps/api/src/modules/football/football.controller.ts`
3. Register route in `apps/api/src/modules/football/football.module.ts`
4. Update Postman collection if needed

### Send to AI Service

1. Use RabbitMQ producer:

   ```typescript
   await producer.sendMessage('video.process', { videoUrl, metadata });
   ```

2. AI service consumes via [rabbitmq_client.py](apps/ai-service/src/rabbitmq_client.py)

3. Publish result back to queue for API to consume

## Deployment

### Environments

1. **Local (k3d)**: Full Kubernetes stack on dev machine
2. **Dev/Staging (Railway)**: Auto-deploys from `main` branch
3. **Production (Railway)**: Manual deployment or `production` branch

### Key Files

- [k8s/api.yaml](k8s/api.yaml): Kubernetes deployment for API
- [k8s/rabbitmq.yaml](k8s/rabbitmq.yaml): RabbitMQ StatefulSet
- [render.yaml](render.yaml): Alternative cloud deployment
- [docs/DEPLOYMENT_WORKFLOW.md](docs/DEPLOYMENT_WORKFLOW.md): Full guide

## Video Editing Strategy (AI Service)

**Tool**: FFmpeg (open source, already in tech stack)
**Location**: apps/ai-service (Python)

**Processing Pipeline:**

1. Download video from YouTube URL
2. Detect goals/key moments using frame analysis
3. Trim segments (remove dead time)
4. Remove original audio
5. Add background music
6. Add text overlays (team names, scores, timestamps)
7. Resize for short-form (9:16 aspect ratio for TikTok/Instagram)
8. Combine segments into final highlight reel
9. Upload to GCS

**Python Implementation:**

```python
# apps/ai-service/src/video_editor.py
from moviepy.editor import VideoFileClip, concatenate_videoclips
import subprocess  # FFmpeg

class VideoEditor:
    def extract_highlights(self, video_path, match_data):
        # Detect goal moments, create clips
        pass

    def add_music(self, clip, music_url):
        # Replace audio with background music
        pass

    def add_text_overlay(self, clip, text, position):
        # Add team names, scores as text
        pass

    def combine_clips(self, clips):
        # Combine all segments into final video
        pass
```

## Critical Context

- **Package Manager**: pnpm v10.26.1 (enforced)
- **Port**: API runs on port 5001 (not 3000)
- **RabbitMQ**: Services handle gracefully if missing (logs warning, continues)
- **FotMob API**: Free, no auth required - returns current season data
- **YouTube Search**: Uses API key from .env - searches for highlights by match metadata
- **Kubernetes**: Local dev uses k3d, not Docker Desktop Kubernetes

## Common Patterns

### Adding a New API Endpoint (NEW MODULAR PATTERN)

1. **Create module structure** in `apps/api/src/modules/[name]/`:

   ```typescript
   // [name].service.ts - Business logic layer
   export const myModuleService = {
     async getData() {
       // Business logic here
     },
   };
   ```

2. **Create controller** with `asyncHandler` wrapper (REQUIRED):

   ```typescript
   // [name].controller.ts
   import { Request, Response } from 'express';
   import { asyncHandler } from '../../asyncHandler.js'; // CORRECT PATH
   import { ApiError } from '../../errors.js';
   import { myModuleService } from './[name].service.js';

   export const getMyData = asyncHandler(
     async (req: Request, res: Response) => {
       const data = await myModuleService.getData();
       res.json(data);
     }
   );
   ```

3. **Create module** with Express Router:

   ```typescript
   // [name].module.ts
   import { Router } from 'express';
   import { getMyData } from './[name].controller.js';
   import type { ApiModule } from '../module.types.js';

   const router = Router();
   router.get('/data', getMyData);

   export const myModule: ApiModule = {
     name: 'my-feature',
     basePath: '/my-feature', // Results in /api/v1/my-feature
     router,
   };
   ```

4. **Register** in `apps/api/src/modules/index.ts` array
5. **Validation**: Use Zod schemas inline in controller (see football.controller.ts)

**Reference Implementation:** See `modules/football/` for complete example

### Adding a New Worker Task Type

1. Add event type to shared package (if exists) or define locally
2. Update [apps/worker/src/index.ts](apps/worker/src/index.ts#L32-L41) handler switch statement
3. Create dedicated handler function following existing pattern

### Database Schema Changes (Prisma)

**Development workflow:**

```bash
# Make changes to apps/api/prisma/schema.prisma
pnpm --filter api db:push     # Push to dev DB (fast, no migration)
pnpm --filter api db:studio   # Open Prisma Studio to verify
```

**Production workflow:**

```bash
pnpm --filter api db:migrate        # Create migration
pnpm --filter api db:migrate:deploy # Deploy to production
```

### Storage Strategy

Uses **pluggable storage abstraction** via `STORAGE_DRIVER` env var:

```typescript
// apps/api/src/services/gcsService.ts
STORAGE_DRIVER=local   # Dev: local filesystem
STORAGE_DRIVER=gcs     # Prod: Google Cloud Storage
```

Supports local filesystem (dev) or S3-compatible storage (production).

## Football Highlights Implementation Guide

### Full Workflow (End-to-End)

```
User clicks "Football" section
    ↓
GET /api/v1/football/highlights?league=47
    ↓
footballController.getMatchesWithHighlights()
    ↓
footballScraperService.getLeagueMatches(47)  [FotMob API]
    ↓
footballMatchService.enrichMatchesWithStats()  [Add details]
    ↓
footballScraperService.searchYouTubeHighlights()  [YouTube API]
    ↓
Return 15+ matches with { homeTeam, awayTeam, score, stats, videoUrl, excitement }
    ↓
User clicks "AI Help" button on a video
    ↓
POST /api/v1/football/process
    ↓
footballController.processHighlightsWithAI()
    ↓
RabbitMQ Producer sends { videoUrl, homeTeam, awayTeam, score, stats }
    ↓
AI Service Consumer (Python)
    ↓
VideoEditor processes:
  1. Download video from YouTube
  2. Detect goals (audio spikes, crowd roar)
  3. Extract goal clips (0-120 seconds each)
  4. Remove commentary audio
  5. Add royalty-free background music
  6. Add text overlays (teams, score, timestamp)
  7. Resize to 9:16 (TikTok/Instagram)
  8. Combine into final highlight reel
  9. Upload to GCS
    ↓
RabbitMQ Producer sends { gcsUrl, status: 'completed' }
    ↓
API receives result, updates database
    ↓
Return processed video URL to frontend
```

### YouTube Search Integration

**File**: [apps/api/src/services/youtubeService.ts](apps/api/src/services/youtubeService.ts)

The `searchYouTubeHighlights()` method uses YouTube Data API v3 to find match videos:

```typescript
// Search query: "Team A vs Team B Highlights 2024"
// Returns: Video URLs with duration, view count, upload date
// Filters: Only official highlight reels (no compilations, reactions)
```

**Key Features:**

- Searches for all matches in a league (not just top 10)
- Returns video URLs, thumbnails, and metadata
- Handles API rate limits gracefully
- Falls back if video not found

### Excitement Score Ranking

The `footballMatchService.selectBestMatches()` ranks matches by "excitement":

```
Score = Goals (40) + Action (30) + Drama (15) + Social (30) + Importance (15)
         ├─ Goals: totalGoals × 10
         ├─ Action: (shots + shotsOnTarget) ÷ 2
         ├─ Drama: yellowCards + (redCards × 5) + (penalties × 10)
         ├─ Social: (views + likes + comments) ÷ 100,000
         └─ Importance: league × factor (Premier=10, Champions=15)
```

Matches are returned sorted by this score, so frontend shows most exciting first.

## Documentation Structure

- [README.md](README.md): Project overview & philosophy
- [docs/MESSAGING_ARCHITECTURE.md](docs/MESSAGING_ARCHITECTURE.md): RabbitMQ setup & message flow
- [docs/DEPLOYMENT_WORKFLOW.md](docs/DEPLOYMENT_WORKFLOW.md): Deployment strategies
- [apps/api/API-ARCHITECTURE.md](apps/api/API-ARCHITECTURE.md): API structure details
- [docs/FOOTBALL_HIGHLIGHTS.md](docs/FOOTBALL_HIGHLIGHTS.md): Football-specific implementation
- [docs/FOOTBALL_QUICK_START.md](docs/FOOTBALL_QUICK_START.md): Getting started with football API

## Web Application (apps/web)

### Architecture

- **Framework**: React 18 + TypeScript
- **Router**: TanStack Router (file-based routing)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Theme System**: 11 custom themes with light/dark mode

### Theme System

**Location**: [apps/web/src/theme/](apps/web/src/theme/)

Uses React Context with localStorage persistence:

```tsx
import { useTheme } from './theme';

function MyComponent() {
  const { theme, mode, tokens, setTheme, toggleMode } = useTheme();

  return (
    <div style={{ backgroundColor: tokens.bg, color: tokens.fg }}>
      <h1 style={{ color: tokens.primary }}>Hello!</h1>
      <button onClick={toggleMode}>Toggle Mode</button>
    </div>
  );
}
```

**Available themes**: synth, emerald, sunset, ocean, midnight, rose, lavender, forest, desert, arctic, volcano

**Tokens**: `bg`, `fg`, `surface`, `border`, `primary`, `secondary`, `danger`, `warning`, `success`

See [apps/web/THEME_GUIDE.md](apps/web/THEME_GUIDE.md) for complete guide.

### Routing

Uses TanStack Router with file-based routes:

- `src/routes/__root.tsx` - Root layout
- `src/routes/_app.tsx` - App layout (with Header/Sidebar)
- `src/routes/index.tsx` - Home page
- Route tree auto-generated in `routeTree.gen.ts`

### Development

```bash
pnpm dev:web       # Start dev server (http://localhost:5173)
pnpm build:web     # Build for production
pnpm preview:web   # Preview production build
```

### shadcn/ui Components

Uses [shadcn/ui](https://ui.shadcn.com/) components in `src/components/ui/`:

```bash
# Add new component (from apps/web):
npx shadcn@latest add button
```

Components are customized to work with the Morpho theme system.

## Critical Context

- **Package Manager**: Must use `pnpm` (v10.26.1) - enforced by packageManager field
- **API Port**: API defaults to port 5001 (not 3000)
- **Web Port**: Web dev server runs on port 5173 (Vite default)
- **RabbitMQ**: Services gracefully handle missing RabbitMQ (logs warning, continues)
- **Video Pipeline**: FFmpeg is core dependency for video processing via AI Service (Python)
- **Kubernetes**: Local dev uses k3d, not Docker Desktop Kubernetes
- **Routes Consolidated**: Football endpoints unified under `/football/` (removed `/football-data/` and `/football-scraper/` duplicates)
- **YouTube API**: Required `YOUTUBE_API_KEY` environment variable for highlight search

---

## Node.js Development Best Practices

### Code Style & Standards

**TypeScript Guidelines:**

```typescript
// ✅ GOOD: Explicit types, proper imports
import type { Request, Response } from 'express';
import { z } from 'zod';

export const myHandler = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({ id: z.string().uuid() });
  const { id } = schema.parse(req.params);

  const result = await myService.getData(id);
  res.json({ data: result });
});

// ❌ BAD: Missing types, no validation
export const myHandler = async (req, res) => {
  const result = await myService.getData(req.params.id);
  res.json(result);
};
```

**Async/Await Best Practices:**

```typescript
// ✅ GOOD: Proper error handling, specific errors
try {
  const data = await externalApi.fetch(id);
  if (!data) {
    throw new ApiError('Resource not found', {
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  }
  return data;
} catch (error) {
  if (error instanceof ApiError) throw error;
  logger.error({ error, id }, 'Failed to fetch data');
  throw new ApiError('Service unavailable', {
    statusCode: 503,
    code: 'SERVICE_ERROR',
  });
}

// ❌ BAD: Silent failures, generic errors
try {
  return await externalApi.fetch(id);
} catch (error) {
  return null; // Lost error context!
}
```

**Promise Handling:**

```typescript
// ✅ GOOD: Promise.all for parallel operations
const [matches, teams, standings] = await Promise.all([
  footballService.getMatches(leagueId),
  footballService.getTeams(leagueId),
  footballService.getStandings(leagueId),
]);

// ❌ BAD: Sequential awaits (slow!)
const matches = await footballService.getMatches(leagueId);
const teams = await footballService.getTeams(leagueId);
const standings = await footballService.getStandings(leagueId);
```

### Input Validation (Zod)

**Always validate at the controller layer:**

```typescript
import { z } from 'zod';

const createVideoSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  duration: z.number().positive().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const createVideo = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createVideoSchema.parse(req.body); // Throws on invalid
  const video = await videoService.create(validatedData);
  res.status(201).json({ data: video });
});
```

**Query Parameter Validation:**

```typescript
const querySchema = z.object({
  league: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

// Usage:
const { league, limit, page } = querySchema.parse(req.query);
```

### Error Handling Patterns

**Service Layer Errors:**

```typescript
// footballService.ts
export const footballService = {
  async getMatches(leagueId: number) {
    try {
      const response = await fotmobApi.get(`/matches/${leagueId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new ApiError(`League ${leagueId} not found`, {
            statusCode: 404,
            code: 'LEAGUE_NOT_FOUND',
          });
        }
        if (error.response?.status === 429) {
          throw new ApiError('Rate limit exceeded', {
            statusCode: 503,
            code: 'RATE_LIMITED',
          });
        }
      }
      logger.error({ error, leagueId }, 'FotMob API error');
      throw new ApiError('Failed to fetch matches', {
        statusCode: 502,
        code: 'UPSTREAM_ERROR',
      });
    }
  },
};
```

**Controller Error Handling:**

```typescript
// asyncHandler already catches errors, but you can add specific handling:
export const getLeagueData = asyncHandler(
  async (req: Request, res: Response) => {
    const { league } = querySchema.parse(req.query);

    try {
      const data = await footballService.getMatches(league);
      res.json({ data });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        // Add custom logging or side effects
        logger.warn({ league }, 'User requested non-existent league');
      }
      throw error; // Re-throw for error middleware
    }
  }
);
```

### Logging Best Practices

**Structured Logging with Context:**

```typescript
import { logger } from '../../logger.js';

// ✅ GOOD: Structured logs with context
logger.info(
  { userId, action: 'video_upload', videoId },
  'Video uploaded successfully'
);
logger.error({ error, matchId, leagueId }, 'Failed to fetch match data');
logger.warn({ requestId, duration: 5000 }, 'Slow API response');

// ❌ BAD: String concatenation, lost context
logger.info('Video uploaded by user ' + userId);
logger.error('Error: ' + error.message);
```

**Performance Logging:**

```typescript
export const myExpensiveOperation = asyncHandler(
  async (req: Request, res: Response) => {
    const start = Date.now();
    const requestId = req.id; // From requestId middleware

    try {
      const result = await expensiveService.doWork();
      const duration = Date.now() - start;

      logger.info(
        { requestId, duration, resultCount: result.length },
        'Operation completed'
      );
      res.json({ data: result });
    } catch (error) {
      const duration = Date.now() - start;
      logger.error({ requestId, duration, error }, 'Operation failed');
      throw error;
    }
  }
);
```

### Database Patterns (Prisma)

**Service → Repository Pattern:**

```typescript
// myFeature.repo.ts - Database access layer
import { prisma } from '../../lib/prisma.js';

export const myFeatureRepo = {
  async findById(id: string) {
    return prisma.myModel.findUnique({ where: { id } });
  },

  async create(data: CreateMyModelInput) {
    return prisma.myModel.create({ data });
  },

  async update(id: string, data: UpdateMyModelInput) {
    return prisma.myModel.update({ where: { id }, data });
  },
};

// myFeature.service.ts - Business logic layer
export const myFeatureService = {
  async getData(id: string) {
    const data = await myFeatureRepo.findById(id);
    if (!data) {
      throw new ApiError('Not found', { statusCode: 404, code: 'NOT_FOUND' });
    }
    return data;
  },
};
```

**Transaction Patterns:**

```typescript
export const myFeatureService = {
  async createWithRelations(data: ComplexInput) {
    return prisma.$transaction(async (tx) => {
      const parent = await tx.parent.create({ data: data.parent });
      const children = await tx.child.createMany({
        data: data.children.map((c) => ({ ...c, parentId: parent.id })),
      });
      return { parent, children };
    });
  },
};
```

### API Response Patterns

**Consistent Response Format:**

```typescript
// ✅ GOOD: Consistent structure
res.json({
  data: result,
  meta: { page: 1, total: 100, limit: 20 },
});

// For errors (handled by error middleware):
throw new ApiError('Message', {
  statusCode: 400,
  code: 'ERROR_CODE',
  details: { field: 'email', reason: 'invalid_format' },
});

// ❌ BAD: Inconsistent shapes
res.json(result); // Direct data
res.json({ result }); // Different key
res.json({ success: true, data: result }); // Unnecessary fields
```

**Status Codes:**

- `200 OK`: Successful GET/PUT/PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing/invalid auth
- `403 Forbidden`: Valid auth, insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Business logic validation failed
- `500 Internal Server Error`: Unexpected server error
- `502 Bad Gateway`: Upstream service error
- `503 Service Unavailable`: Service temporarily unavailable

### Environment Variables

**Always validate in env.ts:**

```typescript
// env.ts
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5001),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  YOUTUBE_API_KEY: z.string().optional(),
  RABBIT_URL: z.string().url().optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const env = envSchema.parse(process.env);
```

**Usage in Services:**

```typescript
import { env } from '../../env.js';

// ✅ GOOD: Type-safe access
const apiKey = env.YOUTUBE_API_KEY;
if (!apiKey) {
  logger.warn('YouTube API key not configured');
  return null;
}

// ❌ BAD: Direct process.env access
const apiKey = process.env.YOUTUBE_API_KEY; // Not validated!
```

---

## Debugging & Troubleshooting

### Common Issues & Solutions

**Issue: Import path errors (Cannot find module)**

```typescript
// ❌ Wrong: Missing .js extension
import { foo } from './file';

// ✅ Correct: Include .js even for .ts files
import { foo } from './file.js';
```

**Issue: Circular dependencies**

```bash
# Symptom: undefined exports, "X is not a function"
# Solution: Extract shared types to separate file
# types.ts → service.ts ← controller.ts
#             ↓
#          repo.ts
```

**Issue: Database connection errors**

```bash
# Check DATABASE_URL format:
postgresql://user:pass@host:5432/dbname?schema=public

# Test connection:
pnpm --filter api exec prisma db push
pnpm --filter api exec prisma studio
```

**Issue: RabbitMQ connection failures**

```typescript
// Services should gracefully handle missing RabbitMQ:
try {
  await producer.sendMessage('queue.name', data);
} catch (error) {
  logger.warn({ error }, 'RabbitMQ unavailable, skipping message');
  // Continue without messaging
}
```

**Issue: TypeScript errors in production build**

```bash
# Run type check before deploying:
pnpm --filter api typecheck

# Common fixes:
- Add missing .js extensions to imports
- Fix "type": "module" in package.json
- Update tsconfig.json "module": "ESNext"
```

### Debugging Workflows

**Debug API Endpoint:**

1. Check logs with `pnpm dev:api` output
2. Test with curl/Postman:
   ```bash
   curl -X GET "http://localhost:5001/api/v1/football/highlights?league=47"
   ```
3. Add debug logs:
   ```typescript
   logger.debug({ req: req.body, params: req.params }, 'Handler called');
   ```
4. Check error middleware output for stack traces

**Debug RabbitMQ Messages:**

1. Open RabbitMQ management: http://localhost:15672 (guest/guest)
2. Check queue depths, message rates
3. Add message logging:
   ```typescript
   consumer.on('message', (msg) => {
     logger.debug({ msg }, 'Received message');
   });
   ```

**Debug Database Queries:**

```bash
# Enable Prisma query logging:
export DEBUG="prisma:query"
pnpm dev:api

# Or use Prisma Studio:
pnpm --filter api db:studio
```

**Performance Profiling:**

```typescript
// Add timing middleware:
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
    });
  });
  next();
});
```

---

## Testing Strategy

### Unit Testing (Vitest)

**Service Tests:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { footballService } from './football.service.js';

describe('footballService', () => {
  it('should fetch matches for valid league', async () => {
    const matches = await footballService.getMatches(47);
    expect(matches).toBeInstanceOf(Array);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('should throw ApiError for invalid league', async () => {
    await expect(footballService.getMatches(99999)).rejects.toThrow('League');
  });
});
```

**Controller Tests (with mocks):**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { getMatches } from './football.controller.js';

describe('footballController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { query: { league: '47' } };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  it('should return matches with valid league', async () => {
    await getMatches(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.any(Array) })
    );
  });
});
```

### Integration Testing

**API Endpoint Tests:**

```typescript
import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { app } from '../index.js';

const request = supertest(app);

describe('GET /api/v1/football/highlights', () => {
  it('should return highlights for Premier League', async () => {
    const response = await request
      .get('/api/v1/football/highlights')
      .query({ league: 47 });

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('should require league parameter', async () => {
    const response = await request.get('/api/v1/football/highlights');
    expect(response.status).toBe(400);
  });
});
```

---

## Security Best Practices

### Authentication & Authorization

**JWT Middleware Pattern:**

```typescript
// middleware/auth.ts
export const requireAuth = asyncHandler(
  async (req: Request, res: Response, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new ApiError('Unauthorized', { statusCode: 401, code: 'NO_TOKEN' });
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = decoded; // Attach to request
      next();
    } catch (error) {
      throw new ApiError('Invalid token', {
        statusCode: 401,
        code: 'INVALID_TOKEN',
      });
    }
  }
);

// Usage in routes:
router.get('/protected', requireAuth, myHandler);
```

### Input Sanitization

**Prevent SQL Injection (Prisma handles this):**

```typescript
// ✅ SAFE: Prisma parameterizes queries
const user = await prisma.user.findFirst({
  where: { email: req.body.email }, // Automatically sanitized
});

// ❌ DANGEROUS: Raw SQL without parameters
const user = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${req.body.email}'` // SQL injection!
);

// ✅ SAFE: Parameterized raw query
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${req.body.email}
`;
```

**Prevent XSS:**

```typescript
import { z } from 'zod';

// Validate and sanitize strings:
const userInputSchema = z.object({
  name: z
    .string()
    .max(100)
    .regex(/^[a-zA-Z0-9\s-]+$/),
  bio: z.string().max(500),
});
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests',
});

app.use('/api/', limiter);
```

---

## Performance Optimization

### Database Query Optimization

**Use select to limit fields:**

```typescript
// ✅ GOOD: Only fetch needed fields
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true },
});

// ❌ BAD: Fetches all fields
const users = await prisma.user.findMany();
```

**Batch Queries:**

```typescript
// ✅ GOOD: Single query with in clause
const videos = await prisma.video.findMany({
  where: { id: { in: videoIds } },
});

// ❌ BAD: Multiple queries
const videos = await Promise.all(
  videoIds.map((id) => prisma.video.findUnique({ where: { id } }))
);
```

### Caching Strategies

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

export const myService = {
  async getExpensiveData(key: string) {
    const cached = cache.get(key);
    if (cached) {
      logger.debug({ key }, 'Cache hit');
      return cached;
    }

    const data = await expensiveOperation();
    cache.set(key, data);
    return data;
  },
};
```

---

## Deployment Checklist

**Before Deploying:**

- [ ] Run `pnpm build` successfully
- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript checks pass (`pnpm typecheck`)
- [ ] Environment variables configured in Railway/k8s
- [ ] Database migrations applied (`pnpm db:migrate:deploy`)
- [ ] Health endpoints responding (`/health/live`, `/health/ready`)
- [ ] Check logs for errors in staging
- [ ] RabbitMQ connection verified (if used)
- [ ] Storage (GCS) credentials configured
- [ ] API keys validated (YouTube, FotMob)

**Post-Deploy Verification:**

```bash
# Health check:
curl https://your-api.railway.app/health/live

# Test key endpoint:
curl https://your-api.railway.app/api/v1/football/highlights?league=47

# Check logs:
railway logs --service api
```

---
