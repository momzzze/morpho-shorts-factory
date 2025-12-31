# Postman Environment Setup

## Overview

Morpho Shorts Factory uses Postman **Environments** to switch between development and production APIs.

## Required Environments

### 1. **DEV Environment**

```json
{
  "name": "Morpho API - DEV",
  "values": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5001",
      "type": "default",
      "enabled": true
    },
    {
      "key": "authToken",
      "value": "",
      "type": "secret",
      "enabled": true
    }
  ]
}
```

### 2. **PROD Environment**

```json
{
  "name": "Morpho API - PROD",
  "values": [
    {
      "key": "baseUrl",
      "value": "https://morpho-api-prod.up.railway.app",
      "type": "default",
      "enabled": true
    },
    {
      "key": "authToken",
      "value": "",
      "type": "secret",
      "enabled": true
    }
  ]
}
```

## Usage

### Switch Environments

1. Click the **Environment dropdown** in top-right of Postman
2. Select **"Morpho API - DEV"** for local development
3. Select **"Morpho API - PROD"** for production testing

### Auto-Saved Variables

- `authToken` - Automatically saved after successful login/register
- Used in all authenticated endpoints via `{{authToken}}` variable

## New Football Highlights Endpoints

### GET /api/v1/football/matches-with-highlights

Get today's matches with YouTube highlight video URLs.

**Example Response:**

```json
{
  "success": true,
  "data": {
    "count": 10,
    "withVideos": 7,
    "matches": [
      {
        "id": "4813546",
        "homeTeam": "Brentford",
        "awayTeam": "AFC Bournemouth",
        "homeScore": 4,
        "awayScore": 1,
        "excitementScore": 85,
        "highlightVideos": [
          {
            "url": "https://www.youtube.com/watch?v=abc123",
            "source": "youtube",
            "quality": "hd"
          }
        ]
      }
    ]
  }
}
```

### POST /api/v1/football/download-highlights/:matchId

Download highlight video for specific match.

**Example:**

```bash
POST {{baseUrl}}/api/v1/football/download-highlights/4813546
Body: { "username": "testuser" }
```

## Environment Variables in Collection

All requests use `{{baseUrl}}` variable:

```
{{baseUrl}}/api/v1/football/matches-with-highlights
```

When you switch environments:

- **DEV**: `http://localhost:5001/api/v1/football/matches-with-highlights`
- **PROD**: `https://morpho-api-prod.up.railway.app/api/v1/football/matches-with-highlights`
