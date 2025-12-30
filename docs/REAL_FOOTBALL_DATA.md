# Real Football Data Integration Guide

## Overview

This guide shows how to integrate **real match data** from football APIs into the Morpho Shorts Factory. You can fetch matches from any league (Premier League, La Liga, Bundesliga, etc.) and automatically rank them by excitement.

## Setup

### 1. Get API-Football Key

1. Go to [https://www.api-football.com/](https://www.api-football.com/)
2. Sign up for free account (100 requests/day)
3. Get your API key from dashboard
4. Add to `.env`:

```env
FOOTBALL_API_KEY=your-api-key-here
```

### 2. Test the Connection

```bash
# Start API
pnpm dev:api

# Test with today's matches
curl http://localhost:5001/api/v1/football/data/today
```

## API Endpoints

### Get League IDs Reference

```http
GET /api/v1/football/data/leagues
```

Returns all available league IDs and usage examples.

**Response:**

```json
{
  "leagues": {
    "PREMIER_LEAGUE": 39,
    "LA_LIGA": 140,
    "BUNDESLIGA": 78,
    "SERIE_A": 135,
    "LIGUE_1": 61,
    "CHAMPIONS_LEAGUE": 2,
    "EUROPA_LEAGUE": 3
  }
}
```

### Get Today's Matches

```http
GET /api/v1/football/data/today
```

Fetches all finished matches from today across all leagues.

**Example:**

```bash
curl http://localhost:5001/api/v1/football/data/today
```

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2024-12-29",
    "count": 15,
    "matches": [
      {
        "id": "1234567",
        "homeTeam": "Liverpool",
        "awayTeam": "Manchester United",
        "homeScore": 3,
        "awayScore": 1,
        "league": "Premier League",
        "stats": {
          "totalGoals": 4,
          "totalShots": 22,
          "shotsOnTarget": 12,
          "yellowCards": 3,
          "redCards": 0,
          "penalties": 1
        }
      }
    ]
  }
}
```

### Get Today's Best Matches (Ranked)

```http
GET /api/v1/football/data/today/ranked?limit=5&minGoals=2&enrichSocial=true
```

**Parameters:**

- `limit` - Number of matches to return (default: 5)
- `minGoals` - Minimum goals required (default: 2)
- `minExcitementScore` - Minimum excitement score (default: 60)
- `enrichSocial` - Fetch YouTube views/engagement (default: false)

**Example:**

```bash
curl "http://localhost:5001/api/v1/football/data/today/ranked?limit=3&minGoals=3&enrichSocial=true"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "date": "2024-12-29",
    "totalMatches": 15,
    "qualifiedMatches": 3,
    "enrichedWithSocial": true,
    "matches": [
      {
        "homeTeam": "Barcelona",
        "awayTeam": "Real Madrid",
        "homeScore": 4,
        "awayScore": 3,
        "excitementScore": 112,
        "breakdown": {
          "goalScore": 40,
          "actionScore": 27,
          "cardScore": 10,
          "socialScore": 28,
          "importanceScore": 15
        },
        "social": {
          "views": 4500000,
          "likes": 180000,
          "comments": 25000
        }
      }
    ]
  }
}
```

### Get League Round Matches

```http
GET /api/v1/football/data/league/:leagueId/round/:round?season=2024
```

**Example - Premier League Round 18:**

```bash
curl "http://localhost:5001/api/v1/football/data/league/39/round/Regular%20Season%20-%2018?season=2024"
```

**Example - La Liga Round 15:**

```bash
curl "http://localhost:5001/api/v1/football/data/league/140/round/Regular%20Season%20-%2015?season=2024"
```

### Get Best Matches from a Round

```http
GET /api/v1/football/data/league/:leagueId/round/:round/ranked?season=2024&limit=3
```

**Example:**

```bash
# Get top 3 matches from Premier League Round 18
curl "http://localhost:5001/api/v1/football/data/league/39/round/Regular%20Season%20-%2018/ranked?season=2024&limit=3&enrichSocial=true"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "leagueId": "39",
    "round": "Regular Season - 18",
    "season": 2024,
    "totalMatches": 10,
    "qualifiedMatches": 3,
    "matches": [
      {
        "homeTeam": "Liverpool",
        "awayTeam": "Manchester City",
        "homeScore": 3,
        "awayScore": 2,
        "excitementScore": 95,
        "breakdown": {
          "goalScore": 40,
          "actionScore": 25,
          "cardScore": 5,
          "socialScore": 20,
          "importanceScore": 10
        }
      }
    ]
  }
}
```

### Get Available Rounds

```http
GET /api/v1/football/data/league/:leagueId/rounds?season=2024
```

**Example:**

```bash
curl "http://localhost:5001/api/v1/football/data/league/39/rounds?season=2024"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "leagueId": "39",
    "season": 2024,
    "count": 38,
    "rounds": [
      "Regular Season - 1",
      "Regular Season - 2",
      "...",
      "Regular Season - 18"
    ],
    "latest": "Regular Season - 18"
  }
}
```

## Common Use Cases

### 1. Daily Highlight Compilation

**Goal:** Every day, find the most exciting matches and create highlights.

```bash
# Get today's top 5 matches with social metrics
curl "http://localhost:5001/api/v1/football/data/today/ranked?limit=5&minGoals=3&enrichSocial=true"

# Response shows matches ranked by excitement
# Use the match IDs to search for highlight videos
```

### 2. Weekly League Roundup

**Goal:** Create a compilation of the best goals from this week's Premier League matches.

```bash
# Step 1: Get all rounds for the season
curl "http://localhost:5001/api/v1/football/data/league/39/rounds?season=2024"

# Step 2: Get the latest round's best matches
curl "http://localhost:5001/api/v1/football/data/league/39/round/Regular%20Season%20-%2018/ranked?limit=5"

# Step 3: For each match, search YouTube for highlights
# curl "http://localhost:5001/api/v1/test/youtube/Liverpool%20vs%20Chelsea%20highlights"
```

### 3. Multi-League Best Goals

**Goal:** Find the best matches across all top leagues today.

```bash
# Get today's best matches (includes all leagues)
curl "http://localhost:5001/api/v1/football/data/today/ranked?limit=10&minGoals=2&enrichSocial=true"

# Filter in your app by league if needed
```

### 4. Track Specific League Round

**Goal:** Monitor Premier League Round 18 and get updates.

```bash
# Get all matches from Round 18
curl "http://localhost:5001/api/v1/football/data/league/39/round/Regular%20Season%20-%2018"

# Or get just the best ones
curl "http://localhost:5001/api/v1/football/data/league/39/round/Regular%20Season%20-%2018/ranked?limit=3"
```

## Full Workflow Example

### Automated Daily Highlights

```typescript
// daily-highlights.ts
import { footballDataService } from './services/footballDataService.js';
import { footballMatchService } from './services/footballMatchService.js';
import { youtubeService } from './services/youtubeService.js';

async function createDailyHighlights() {
  // 1. Fetch today's matches
  let matches = await footballDataService.getTodaysMatches();

  console.log(`Found ${matches.length} matches today`);

  // 2. Enrich with YouTube views
  matches = await footballDataService.enrichWithSocialMetrics(
    matches,
    youtubeService
  );

  // 3. Rank by excitement
  const bestMatches = footballMatchService.selectBestMatches(
    matches,
    {
      minGoals: 3,
      minExcitementScore: 80,
    },
    5
  );

  console.log(`\nTop 5 Matches:\n`);

  for (const match of bestMatches) {
    console.log(
      `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`
    );
    console.log(`  Score: ${match.excitementScore}/130`);
    console.log(`  Views: ${match.social?.views.toLocaleString()}`);

    // 4. Download highlight videos
    const query = `${match.homeTeam} vs ${match.awayTeam} highlights`;
    const videos = await youtubeService.searchVideos(query, 1);

    if (videos.length > 0) {
      const { stream } = await youtubeService.getVideoStream(videos[0].url);

      // 5. Detect highlight moments
      const segments = await footballMatchService.detectHighlights('', match);

      console.log(`  Highlights: ${segments.length} segments`);

      // 6. Extract clips and compile
      // TODO: Use FFmpeg to extract clips
    }
  }
}

// Run daily at 11 PM
createDailyHighlights();
```

### Schedule with Cron

```typescript
// cron-scheduler.ts
import cron from 'node-cron';

// Run every day at 11 PM (after most matches finish)
cron.schedule('0 23 * * *', async () => {
  console.log('Running daily highlights job...');
  await createDailyHighlights();
});
```

## League IDs Reference

| League                   | ID  | Season Format |
| ------------------------ | --- | ------------- |
| Premier League (England) | 39  | 2024          |
| La Liga (Spain)          | 140 | 2024          |
| Bundesliga (Germany)     | 78  | 2024          |
| Serie A (Italy)          | 135 | 2024          |
| Ligue 1 (France)         | 61  | 2024          |
| Champions League         | 2   | 2024          |
| Europa League            | 3   | 2024          |

**Round Format:**

- Most leagues: `"Regular Season - {number}"` (e.g., "Regular Season - 18")
- Champions League: `"Group Stage - {number}"` or `"Round of 16"`, `"Quarter-finals"`, etc.

## API Rate Limits

**API-Football Free Tier:**

- 100 requests/day
- 1 request/second

**Optimization Tips:**

1. Cache match data (don't refetch same matches)
2. Batch requests when possible
3. Only fetch finished matches (`status: 'FT'`)
4. Use `enrichSocial=false` to save YouTube API quota
5. Schedule jobs during off-peak hours

## Error Handling

```typescript
try {
  const matches = await footballDataService.getTodaysMatches();
} catch (error) {
  if (error.message.includes('API key')) {
    console.error('Football API not configured');
  } else if (error.message.includes('rate limit')) {
    console.error('API rate limit exceeded - try again later');
  } else {
    console.error('Error fetching matches:', error);
  }
}
```

## Next Steps

1. **Set up automation**: Create cron jobs for daily/weekly highlights
2. **Add more data sources**: Integrate FotMob, LiveScore, etc.
3. **Video processing**: Use FFmpeg to extract highlights
4. **Storage**: Upload compiled videos to GCS
5. **Publishing**: Auto-publish to TikTok/YouTube

## Troubleshooting

### "Football API not configured"

- Add `FOOTBALL_API_KEY=your-key` to `.env`
- Restart API server

### "No matches found"

- Check if there were matches today (use demo data for testing)
- Verify league IDs are correct
- Check if matches are finished (`status: 'FT'`)

### "Rate limit exceeded"

- Free tier: 100 requests/day
- Wait until next day or upgrade plan
- Use caching to reduce requests

## Resources

- [API-Football Documentation](https://www.api-football.com/documentation-v3)
- [Available Leagues](https://www.api-football.com/documentation-v3#tag/Leagues)
- [Fixture Endpoints](https://www.api-football.com/documentation-v3#tag/Fixtures)
- [Statistics Format](https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures-statistics)

## License

Part of Morpho Shorts Factory
