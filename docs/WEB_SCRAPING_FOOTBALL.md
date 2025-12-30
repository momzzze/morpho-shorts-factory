# Getting CURRENT Match Data - Web Scraping Guide

## 🎯 Problem Solved!

API-Football free plan only has 2021-2023 data. **Solution: Scrape FotMob!**

## ✅ Why FotMob?

- ✅ **FREE** - No API key needed
- ✅ **CURRENT** - Live 2024-2025 season data
- ✅ **JSON API** - No HTML parsing needed
- ✅ **Detailed Stats** - Shots, cards, possession
- ✅ **All Leagues** - Premier League, La Liga, etc.
- ✅ **Legal** - Public data, no authentication bypass

## 🚀 Quick Start

### Get Today's Best Matches

```bash
# No setup needed - works immediately!
curl "http://localhost:5001/api/v1/football/scraper/today/ranked?limit=5&enrichStats=true"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "source": "FotMob (scraped)",
    "date": "2024-12-29",
    "totalMatches": 15,
    "qualifiedMatches": 5,
    "matches": [
      {
        "homeTeam": "Liverpool",
        "awayTeam": "Manchester United",
        "homeScore": 3,
        "awayScore": 2,
        "excitementScore": 95,
        "stats": {
          "totalGoals": 5,
          "totalShots": 22,
          "shotsOnTarget": 12
        }
      }
    ]
  }
}
```

## 📡 New API Endpoints (Web Scraping)

### 1. Get FotMob League IDs

```bash
GET /api/v1/football/scraper/leagues
```

**Response:**

```json
{
  "leagues": {
    "PREMIER_LEAGUE": 47,
    "LA_LIGA": 87,
    "BUNDESLIGA": 54,
    "SERIE_A": 55,
    "LIGUE_1": 53,
    "CHAMPIONS_LEAGUE": 42,
    "EUROPA_LEAGUE": 73
  }
}
```

### 2. Get Today's Matches (Scraped)

```bash
GET /api/v1/football/scraper/today
```

Returns all finished matches from today.

### 3. Get Today's Best Matches

```bash
GET /api/v1/football/scraper/today/ranked?limit=5&enrichStats=true&enrichSocial=true
```

**Parameters:**

- `limit` - Number of matches (default: 5)
- `minGoals` - Minimum goals (default: 2)
- `minExcitementScore` - Min score 0-130 (default: 60)
- `enrichStats` - Fetch detailed stats from FotMob (default: false)
- `enrichSocial` - Fetch YouTube views (default: false)

### 4. Get Premier League Matches

```bash
GET /api/v1/football/scraper/league/47
```

### 5. Get Premier League Best Matches

```bash
GET /api/v1/football/scraper/league/47/ranked?limit=3&enrichStats=true
```

## 🎬 Full Workflow Example

```bash
# Step 1: Get today's most exciting matches (current data!)
curl "http://localhost:5001/api/v1/football/scraper/today/ranked?limit=3&enrichStats=true&enrichSocial=true"

# Response shows:
# - Liverpool 3-2 Man Utd (Score: 95)
# - Barcelona 4-1 Real Madrid (Score: 88)
# - Bayern 2-2 Dortmund (Score: 72)

# Step 2: For each match, search YouTube for highlights
curl "http://localhost:5001/api/v1/test/youtube/Liverpool%20vs%20Man%20Utd%20highlights"

# Step 3: Download highlight videos
# (Use existing YouTube service)

# Step 4: Create compilation
# (FFmpeg - coming soon)
```

## 📊 Comparison: API vs Scraping

| Feature         | API-Football (Free) | FotMob Scraping             |
| --------------- | ------------------- | --------------------------- |
| **Cost**        | Free (100 req/day)  | Free (unlimited\*)          |
| **Season**      | 2021-2023 only      | **Current 2024-2025**       |
| **Setup**       | Requires API key    | **No setup needed**         |
| **Stats**       | ✅ Detailed         | ✅ Detailed                 |
| **Reliability** | ✅ High             | ⚠️ Medium (can change)      |
| **Legal**       | ✅ Official API     | ⚠️ Public data, ToS unclear |

\*Rate limit yourself to avoid detection (~1 request/second)

## 🔧 Implementation Details

### How It Works

1. **FotMob JSON API** - They have a mobile API that returns JSON
2. **No authentication** - Public endpoints, no API key
3. **Two-step process**:
   - First, get match list (basic data)
   - Then, get match details (full stats)

### Example FotMob URLs

```javascript
// Today's matches
https://www.fotmob.com/api/matches?date=2024-12-29

// Match details
https://www.fotmob.com/api/matchDetails?matchId=4194142

// League matches
https://www.fotmob.com/api/leagues?id=47
```

### Code Location

```
apps/api/src/
├── services/
│   └── footballScraperService.ts    # FotMob scraping logic
├── controllers/
│   └── footballScraperController.ts  # Scraper endpoints
└── routes/
    └── football-scraper/index.ts     # Scraper routes
```

## 🎯 Use Cases

### Daily Highlight Compilation (CURRENT DATA!)

```bash
# Get today's top 5 matches with full stats
curl "http://localhost:5001/api/v1/football/scraper/today/ranked?limit=5&enrichStats=true&enrichSocial=true"

# Result: Perfect for creating daily highlight videos!
```

### Premier League Weekly Roundup

```bash
# Get all Premier League finished matches
curl "http://localhost:5001/api/v1/football/scraper/league/47"

# Get top 3 Premier League matches
curl "http://localhost:5001/api/v1/football/scraper/league/47/ranked?limit=3&enrichStats=true"
```

### Multi-League Best Goals

```bash
# Today's best from all leagues
curl "http://localhost:5001/api/v1/football/scraper/today/ranked?limit=10&minGoals=3"
```

## ⚠️ Best Practices

### 1. Rate Limiting

```typescript
// Add delays between requests
await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second
```

### 2. Caching

```typescript
// Cache matches for 5-10 minutes
// Don't refetch same data repeatedly
```

### 3. Error Handling

```typescript
try {
  const matches = await footballScraperService.getTodaysMatchesFromFotMob();
} catch (error) {
  // Fallback to cached data or API-Football historical data
}
```

### 4. User-Agent

```typescript
// Always set a proper User-Agent
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
```

## 🔄 Alternative Scraping Sources

### 1. LiveScore

- **URL**: `https://prod-public-api.livescore.com/v1/api/app/date/soccer/{date}/0`
- **Pros**: Clean JSON API
- **Cons**: Less detailed stats

### 2. FlashScore

- **URL**: `https://www.flashscore.com/`
- **Pros**: Very detailed stats
- **Cons**: Harder to scrape (needs HTML parsing)

### 3. ESPN

- **URL**: `https://site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard`
- **Pros**: Official API, good highlight links
- **Cons**: US-focused

## 🚀 Production Tips

### Hybrid Approach (Best!)

```typescript
// Use scraping for current data
const currentMatches =
  await footballScraperService.getTodaysMatchesFromFotMob();

// Use API-Football for historical data
const historicalMatches = await footballDataService.getFixturesByDate(
  '2023-12-29'
);

// Combine both!
const allMatches = [...currentMatches, ...historicalMatches];
```

### Scheduled Jobs

```typescript
// Run every hour during match days
cron.schedule('0 * * * *', async () => {
  const matches = await footballScraperService.getTodaysMatchesFromFotMob();
  const best = footballMatchService.selectBestMatches(matches, {}, 5);

  // Create highlights automatically
  for (const match of best) {
    await createHighlightVideo(match);
  }
});
```

## 📋 Testing

```bash
# Test FotMob scraping
curl http://localhost:5001/api/v1/football/scraper/leagues

# Test today's matches
curl http://localhost:5001/api/v1/football/scraper/today

# Test ranking
curl "http://localhost:5001/api/v1/football/scraper/today/ranked?limit=3"
```

## ⚡ Performance

- **First request**: ~500ms (fetch from FotMob)
- **With enrichStats**: ~2s (fetches details for each match)
- **With enrichSocial**: ~5s (searches YouTube)

**Optimization**: Only enrich top matches, not all matches!

## 🎉 Summary

**You now have TWO options:**

1. **API-Football** - Historical data (2021-2023) - Requires API key
2. **FotMob Scraping** - **CURRENT data (2024-2025)** - **FREE, no setup!**

**Recommended Setup:**

```bash
# Get today's CURRENT best matches (no API key needed!)
curl "http://localhost:5001/api/v1/football/scraper/today/ranked?limit=5&enrichStats=true"
```

This gives you **real-time data** for creating viral highlight videos! 🎬⚽🔥
