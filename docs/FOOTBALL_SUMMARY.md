# Football Match Intelligence - Summary

## ✅ What's Implemented

### 1. Smart Match Ranking Algorithm

**Location:** [footballMatchService.ts](../apps/api/src/services/footballMatchService.ts)

Scores matches 0-130 points based on:

- **Goals** (0-40 pts): 8 points per goal
- **Action** (0-30 pts): Shots, shots on target
- **Drama** (0-15 pts): Red cards, penalties, yellow cards
- **Social** (0-30 pts): Views, likes, engagement
- **Importance** (0-15 pts): Top leagues, derby matches

### 2. Real Data Integration

**Location:** [footballDataService.ts](../apps/api/src/services/footballDataService.ts)

Connects to **API-Football** to fetch:

- ✅ Today's finished matches
- ✅ League round matches (e.g., Premier League Round 18)
- ✅ Match statistics (shots, cards, possession)
- ✅ All major leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1)

### 3. Social Enrichment

Optionally fetches YouTube engagement metrics:

- Views from top 3 highlight videos
- Likes, comments on highlights
- Combines with match stats for accurate ranking

### 4. Highlight Detection (Mock)

**Location:** [footballMatchService.ts](../apps/api/src/services/footballMatchService.ts)

Detects key moments:

- Goals (with timestamps)
- Penalties
- Red cards
- Celebrations

_Note: Currently returns mock data - AI detection coming in Phase 3_

## 📡 API Endpoints

### Demo Endpoints (No API Key Required)

```bash
GET  /api/v1/football/demo-matches          # Generate test data
POST /api/v1/football/rank-matches          # Rank custom matches
POST /api/v1/football/detect-highlights     # Detect highlights
GET  /api/v1/football/full-pipeline         # Complete demo workflow
```

### Real Data Endpoints (Requires FOOTBALL_API_KEY)

```bash
GET  /api/v1/football/data/leagues                           # League IDs reference
GET  /api/v1/football/data/today                             # Today's matches
GET  /api/v1/football/data/today/ranked                      # Today's best (ranked)
GET  /api/v1/football/data/league/:id/rounds                 # Available rounds
GET  /api/v1/football/data/league/:id/round/:round           # Round matches
GET  /api/v1/football/data/league/:id/round/:round/ranked    # Round's best
```

## 🚀 Quick Start

### Option A: Demo Data (No Setup)

```bash
pnpm dev:api
curl http://localhost:5001/api/v1/football/full-pipeline
```

### Option B: Real Data

```bash
# 1. Get API key from https://www.api-football.com/
# 2. Add to apps/api/.env:
FOOTBALL_API_KEY=your-key-here

# 3. Test with real data:
curl "http://localhost:5001/api/v1/football/data/today/ranked?limit=5&enrichSocial=true"
```

## 📋 Use Cases

### 1. Daily Highlight Compilation

```bash
# Get today's top 5 matches with social metrics
curl "http://localhost:5001/api/v1/football/data/today/ranked?limit=5&minGoals=3&enrichSocial=true"

# Response includes:
# - Match scores & stats
# - Excitement score (0-130)
# - YouTube views/engagement
# - Ranked by viral potential
```

**Result:** Automatically identify the most exciting matches for highlight videos.

### 2. Weekly League Roundup

```bash
# Step 1: Get latest round
curl "http://localhost:5001/api/v1/football/data/league/39/rounds?season=2024"

# Step 2: Get best matches from Round 18
curl "http://localhost:5001/api/v1/football/data/league/39/round/Regular%20Season%20-%2018/ranked?limit=3"
```

**Result:** Create a "Best of Premier League Round 18" compilation.

### 3. Multi-League Best Goals

```bash
# Get best matches from all leagues today
curl "http://localhost:5001/api/v1/football/data/today/ranked?limit=10&minGoals=4"
```

**Result:** "Top 10 Goals of the Day" video across all leagues.

## 📖 Documentation

| Document                                           | Description                      |
| -------------------------------------------------- | -------------------------------- |
| [FOOTBALL_QUICK_START.md](FOOTBALL_QUICK_START.md) | API endpoints & examples         |
| [FOOTBALL_HIGHLIGHTS.md](FOOTBALL_HIGHLIGHTS.md)   | Algorithm details & architecture |
| [REAL_FOOTBALL_DATA.md](REAL_FOOTBALL_DATA.md)     | **Real data integration guide**  |

## 🎯 League IDs Reference

```javascript
PREMIER_LEAGUE: 39; // England
LA_LIGA: 140; // Spain
BUNDESLIGA: 78; // Germany
SERIE_A: 135; // Italy
LIGUE_1: 61; // France
CHAMPIONS_LEAGUE: 2; // UEFA
EUROPA_LEAGUE: 3; // UEFA
```

**Get full list:**

```bash
curl http://localhost:5001/api/v1/football/data/leagues
```

## 🔧 Next Steps

### Phase 2: Automation ⏳

- [ ] Cron job for daily highlights
- [ ] Auto-download from YouTube
- [ ] Store matches in database
- [ ] Cache API responses

### Phase 3: AI Highlight Detection 🤖

- [ ] FFmpeg audio analysis (crowd noise)
- [ ] Computer vision (ball tracking)
- [ ] ML model (goal detection)
- [ ] OCR (scoreboard reading)

### Phase 4: Video Processing 🎬

- [ ] FFmpeg video extraction
- [ ] Multi-quality output
- [ ] Vertical format (9:16 for TikTok)
- [ ] Auto-captions

### Phase 5: Publishing 📱

- [ ] Auto-publish to TikTok
- [ ] Auto-publish to YouTube
- [ ] Twitter/X integration
- [ ] Instagram Reels

## 📦 Files Structure

```
apps/api/src/
├── services/
│   ├── footballMatchService.ts       # Ranking algorithm
│   └── footballDataService.ts        # Real data fetching
├── controllers/
│   ├── footballController.ts         # Demo endpoints
│   └── footballDataController.ts     # Real data endpoints
└── routes/
    ├── football/index.ts              # Main routes
    └── football-data/index.ts         # Real data routes

docs/
├── FOOTBALL_SUMMARY.md               # This file
├── FOOTBALL_QUICK_START.md           # Quick reference
├── FOOTBALL_HIGHLIGHTS.md            # Full architecture
└── REAL_FOOTBALL_DATA.md             # Integration guide
```

## 🧪 Testing

### Postman Collection Updated

Import [postman-auth-collection.json](../apps/api/postman-auth-collection.json)

New folders:

- **football** - Demo endpoints
- **football-real-data** - Real data endpoints

### Example Workflow in Postman

1. `GET /football/data/leagues` - Get league IDs
2. `GET /football/data/league/39/rounds` - Get Premier League rounds
3. `GET /football/data/league/39/round/Regular Season - 18/ranked` - Get best matches
4. Search YouTube for highlights (existing endpoint)
5. Create compilation (FFmpeg - coming soon)

## 💡 Tips

### API Rate Limits

- **API-Football Free:** 100 requests/day
- **Solution:** Cache match data, schedule jobs wisely

### Social Enrichment

- Set `enrichSocial=true` to get YouTube views
- Slower (requires YouTube API calls)
- Use sparingly to save quota

### Round Names

- URL encode spaces: `Regular Season - 18` → `Regular%20Season%20-%2018`
- Get exact names from `/rounds` endpoint first

## 📞 Support

- Read the docs: [REAL_FOOTBALL_DATA.md](REAL_FOOTBALL_DATA.md)
- Check Postman collection for examples
- Test with demo data first (no API key needed)

## ⚽ Example: Find Today's Viral Matches

```bash
# One command to get the most exciting matches:
curl "http://localhost:5001/api/v1/football/data/today/ranked?limit=3&minGoals=3&enrichSocial=true" | jq '.data.matches[] | {match: "\(.homeTeam) \(.homeScore)-\(.awayScore) \(.awayTeam)", score: .excitementScore, views: .social.views}'
```

**Output:**

```json
{
  "match": "Barcelona 4-3 Real Madrid",
  "score": 112,
  "views": 4500000
}
{
  "match": "Liverpool 3-2 Manchester United",
  "score": 98,
  "views": 3200000
}
{
  "match": "Bayern Munich 5-1 Dortmund",
  "score": 95,
  "views": 2800000
}
```

---

**Built for Morpho Shorts Factory** - Turn exciting matches into viral short-form content 🎬⚡
