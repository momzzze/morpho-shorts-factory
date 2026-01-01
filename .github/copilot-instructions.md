# Morpho Shorts Factory - AI Coding Agent Guide

## Architecture Overview

**Microservices-based football highlights pipeline** with event-driven architecture:

- **apps/api** (TypeScript/Express): REST API on port 5001 with RabbitMQ producer
- **apps/worker** (TypeScript/Node.js): Task consumer for background jobs
- **apps/ai-service** (Python): AI video processing service & RabbitMQ consumer
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

# Run services in separate terminals:
pnpm dev:api                 # Terminal 1: API on port 5001
pnpm dev:worker              # Terminal 2: Worker service
cd apps/ai-service && python src/main.py  # Terminal 3: AI service

# Local RabbitMQ (required):
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
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
