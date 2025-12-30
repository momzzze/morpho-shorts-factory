# Football Match Intelligence System

## Overview

This system uses an **AI-powered algorithm** to find the most exciting football matches and extract highlights automatically. It's designed to be **content-agnostic** (works with any sport) but optimized for football.

## Architecture

### 1. Match Selection Algorithm

The system scores matches on a **0-130 point scale** based on:

| Factor                | Weight   | Description                                             |
| --------------------- | -------- | ------------------------------------------------------- |
| **Goals**             | 0-40 pts | 8 points per goal (capped at 5 goals)                   |
| **Action**            | 0-30 pts | Shots, shots on target, attacking play                  |
| **Drama**             | 0-15 pts | Red cards (5pt), penalties (5pt), yellow cards (1pt)    |
| **Social Engagement** | 0-30 pts | Views, likes, comments (normalized to 1M views = 30pts) |
| **Importance**        | 0-15 pts | Top leagues (+10), derbies/rivalries (+5)               |

**Example Scores:**

- **Barcelona 5-4 Real Madrid** (El Clásico, 2M views) → **~115 points**
- **Manchester United 3-0 City** (Derby, 500K views) → **~85 points**
- **Lower league 1-0** (50K views) → **~25 points**

### 2. Highlight Detection (AI)

Detects key moments using:

1. **Audio Analysis** (FFmpeg)

   - Crowd noise spikes → Goal likely
   - Commentator volume/pitch → Excitement
   - Silence patterns → Breaks in play

2. **Visual Analysis** (Computer Vision)

   - Ball tracking (fast movement toward goal)
   - Player clustering (corner kicks, free kicks)
   - Scoreboard OCR (detect score changes)

3. **Scene Detection**
   - Replays indicate important moments
   - Celebration patterns
   - Camera angle changes

### 3. Highlight Extraction

Uses **FFmpeg** to cut segments:

```bash
ffmpeg -i full_match.mp4 -ss 00:15:30 -to 00:16:00 -c copy goal1.mp4
```

Supports:

- ✅ Exact timestamps
- ✅ Include pre-buildup (10s before)
- ✅ Include celebration (5s after)
- ✅ Multiple quality outputs (1080p, 720p, vertical 9:16)

## API Endpoints

### 1. Demo Match Generator

```http
GET /api/v1/football/demo-matches?count=20
```

Generates realistic match data with stats.

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 20,
    "matches": [
      {
        "id": "match_1",
        "homeTeam": "Liverpool",
        "awayTeam": "Manchester City",
        "homeScore": 3,
        "awayScore": 2,
        "league": "Premier League",
        "stats": {
          "totalGoals": 5,
          "totalShots": 22,
          "shotsOnTarget": 11,
          "yellowCards": 4,
          "redCards": 0,
          "penalties": 1
        },
        "social": {
          "views": 2500000,
          "likes": 85000,
          "comments": 12000
        }
      }
    ]
  }
}
```

### 2. Rank Matches

```http
POST /api/v1/football/rank-matches?limit=10
Content-Type: application/json

{
  "matches": [ /* array of matches */ ],
  "config": {
    "minGoals": 2,
    "minExcitementScore": 60,
    "maxDaysAgo": 7,
    "preferredLeagues": ["Premier League", "La Liga"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "analyzed": 30,
    "returned": 10,
    "matches": [
      {
        "homeTeam": "Barcelona",
        "awayTeam": "Real Madrid",
        "homeScore": 5,
        "awayScore": 4,
        "excitementScore": 115,
        "breakdown": {
          "goalScore": 40,
          "actionScore": 28,
          "cardScore": 12,
          "socialScore": 25,
          "importanceScore": 15
        }
      }
    ]
  }
}
```

### 3. Detect Highlights

```http
POST /api/v1/football/detect-highlights
Content-Type: application/json

{
  "match": {
    "homeTeam": "Liverpool",
    "awayTeam": "Chelsea",
    "homeScore": 3,
    "awayScore": 1,
    "stats": { /* ... */ }
  },
  "videoPath": "/path/to/video.mp4"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "match": {
      "homeTeam": "Liverpool",
      "awayTeam": "Chelsea",
      "score": "3-1"
    },
    "highlightCount": 6,
    "totalDuration": 180,
    "highlights": [
      {
        "startTime": 780,
        "endTime": 810,
        "type": "goal",
        "confidence": 0.92,
        "description": "Goal scored at 13'",
        "metadata": {
          "minute": 13,
          "team": "Liverpool",
          "player": "Mohamed Salah"
        }
      }
    ]
  }
}
```

### 4. Full Pipeline Demo

```http
GET /api/v1/football/full-pipeline
```

Runs complete workflow:

1. Generates 30 demo matches
2. Ranks by excitement score
3. Selects top 5
4. Detects highlights in #1 match

## Integration Examples

### Example 1: Daily Highlight Compilation

```typescript
// Fetch recent matches from API (e.g., API-Football)
const matches = await fetchMatchesFromAPI({
  date: 'today',
  leagues: ['Premier League', 'La Liga'],
});

// Select best 5 matches
const bestMatches = footballMatchService.selectBestMatches(
  matches,
  {
    minGoals: 3,
    minExcitementScore: 70,
  },
  5
);

// Download highlight videos from YouTube
for (const match of bestMatches) {
  const query = `${match.homeTeam} vs ${match.awayTeam} highlights`;
  const videos = await youtubeService.searchVideos(query, 1);

  // Download video
  const { stream } = await youtubeService.getVideoStream(videos[0].url);

  // Detect highlights
  const segments = await footballMatchService.detectHighlights(
    videoPath,
    match
  );

  // Extract 30-second clips
  await footballMatchService.extractHighlightSegments(
    videoPath,
    segments,
    './output'
  );
}
```

### Example 2: Weekly "Best Goals" Compilation

```typescript
// Get all matches from last week
const weekMatches = await fetchMatchesFromAPI({
  dateFrom: '2024-12-22',
  dateTo: '2024-12-29',
});

// Filter high-scoring matches
const config = {
  minGoals: 4,
  minExcitementScore: 80,
};

const excitingMatches = footballMatchService.selectBestMatches(
  weekMatches,
  config,
  20
);

// Extract only goal highlights
const allGoals = [];
for (const match of excitingMatches) {
  const segments = await footballMatchService.detectHighlights(
    videoPath,
    match
  );

  const goalSegments = segments.filter((s) => s.type === 'goal');
  allGoals.push(...goalSegments);
}

// Compile into single video
// ffmpeg -i "concat:goal1.mp4|goal2.mp4|goal3.mp4" -c copy best_goals.mp4
```

## Next Steps

### Phase 1: MVP ✅ (Current)

- [x] Match scoring algorithm
- [x] Mock highlight detection
- [x] REST API endpoints
- [x] Demo data generator

### Phase 2: Real Data Integration

- [ ] Connect to **API-Football** (match data)
- [ ] Connect to **YouTube API** (highlight videos)
- [ ] Scrape social metrics (TikTok, Twitter engagement)
- [ ] Build match database (Prisma schema)

### Phase 3: AI Highlight Detection

- [ ] FFmpeg audio analysis (crowd noise detection)
- [ ] Computer vision (ball tracking, scene detection)
- [ ] ML model training (label dataset of goals/highlights)
- [ ] OCR for scoreboard detection

### Phase 4: Video Processing

- [ ] FFmpeg video extraction
- [ ] Multi-quality output (1080p, 720p, 480p)
- [ ] Vertical format for TikTok/Instagram (9:16)
- [ ] Auto-captions & effects

### Phase 5: Automation

- [ ] Daily cron job (select + download highlights)
- [ ] Auto-publish to TikTok/YouTube
- [ ] Viral detection (trending matches)
- [ ] Push notifications for exciting matches

## Data Sources

### Match Data APIs

1. **API-Football** (api-football.com)
   - Live scores, stats, lineups
   - 1000 requests/day free tier
2. **FotMob** (fotmob.com)

   - Detailed match stats
   - Social sentiment data

3. **TheSportsDB** (thesportsdb.com)
   - Free, limited data
   - Good for testing

### Video Sources

1. **YouTube** (official channels)
   - Sky Sports, ESPN, beIN Sports
   - 4K quality highlights
2. **TikTok** (viral clips)
   - Short-form content
   - High engagement metrics

## Tech Stack

- **Language**: TypeScript (Node.js)
- **Video Processing**: FFmpeg
- **AI/ML**: Python (TensorFlow, OpenCV) via `apps/ai-service`
- **Message Queue**: RabbitMQ (event-driven)
- **Storage**: GCS (Google Cloud Storage)
- **Database**: PostgreSQL + Prisma

## Testing

```bash
# Start API
pnpm dev:api

# Test demo match generator
curl http://localhost:5001/api/v1/football/demo-matches?count=20

# Test full pipeline
curl http://localhost:5001/api/v1/football/full-pipeline

# Test ranking with custom data
curl -X POST http://localhost:5001/api/v1/football/rank-matches \
  -H "Content-Type: application/json" \
  -d '{"matches": [...]}'
```

## Contributing

To add new sports or improve the algorithm:

1. Edit [footballMatchService.ts](../src/services/footballMatchService.ts)
2. Adjust scoring weights in `scoreMatch()` method
3. Add new highlight types in `HighlightSegment` interface
4. Update importance scoring for leagues/teams

## License

Part of the Morpho Shorts Factory project.
