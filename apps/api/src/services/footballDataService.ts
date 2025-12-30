// ==============================================================================
// Football Data Service - Fetch real match data from external APIs
// ==============================================================================

import { logger } from '../logger.js';
import { FootballMatch } from './footballMatchService.js';

/**
 * API-Football response types
 * Docs: https://www.api-football.com/documentation-v3
 */
interface APIFootballFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    status: {
      short: string; // 'FT', 'NS', 'LIVE', etc.
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    season: number;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
}

interface APIFootballStatistics {
  team: { id: number; name: string };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

/**
 * League IDs for API-Football
 */
export const LEAGUE_IDS = {
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  BUNDESLIGA: 78,
  SERIE_A: 135,
  LIGUE_1: 61,
  CHAMPIONS_LEAGUE: 2,
  EUROPA_LEAGUE: 3,
} as const;

export class FootballDataService {
  private apiKey: string;
  private baseUrl = 'https://v3.football.api-sports.io';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FOOTBALL_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('FOOTBALL_API_KEY not set - football data features disabled');
    }
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Make API request to API-Football
   */
  private async apiRequest<T>(
    endpoint: string,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error(
        'Football API key not configured. Set FOOTBALL_API_KEY in .env'
      );
    }

    const queryString = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();

    const url = `${this.baseUrl}${endpoint}${
      queryString ? '?' + queryString : ''
    }`;

    logger.info({ endpoint, params }, 'Fetching from API-Football');

    const response = await fetch(url, {
      headers: {
        'x-apisports-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `API-Football error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      const errorMsg = JSON.stringify(data.errors);

      // Provide helpful message for common errors
      if (errorMsg.includes('do not have access to this season')) {
        throw new Error(
          `API-Football error: Free plan only has access to seasons 2021-2023. Please use season=2023 or upgrade your plan. Details: ${errorMsg}`
        );
      }

      throw new Error(`API-Football error: ${errorMsg}`);
    }

    return data.response as T;
  }

  /**
   * Get fixtures (matches) for a specific date
   * @param date - Format: YYYY-MM-DD
   * @param leagueId - Optional league filter
   */
  async getFixturesByDate(
    date: string,
    leagueId?: number
  ): Promise<APIFootballFixture[]> {
    const params: Record<string, string | number> = { date };

    if (leagueId) {
      params.league = leagueId;
    }

    return this.apiRequest<APIFootballFixture[]>('/fixtures', params);
  }

  /**
   * Get fixtures for a specific round in a league
   * @param leagueId - League ID (e.g., 39 for Premier League)
   * @param season - Year (e.g., 2024)
   * @param round - Round name (e.g., "Regular Season - 18")
   */
  async getFixturesByRound(
    leagueId: number,
    season: number,
    round: string
  ): Promise<APIFootballFixture[]> {
    return this.apiRequest<APIFootballFixture[]>('/fixtures', {
      league: leagueId,
      season,
      round,
    });
  }

  /**
   * Get all rounds for a league season
   */
  async getRounds(leagueId: number, season: number): Promise<string[]> {
    const response = await this.apiRequest<string[]>('/fixtures/rounds', {
      league: leagueId,
      season,
    });
    return response;
  }

  /**
   * Get match statistics (shots, possession, cards, etc.)
   */
  async getMatchStatistics(
    fixtureId: number
  ): Promise<APIFootballStatistics[]> {
    return this.apiRequest<APIFootballStatistics[]>('/fixtures/statistics', {
      fixture: fixtureId,
    });
  }

  /**
   * Convert API-Football fixture to our FootballMatch format
   */
  private async convertToFootballMatch(
    fixture: APIFootballFixture
  ): Promise<FootballMatch> {
    const homeScore = fixture.goals.home ?? 0;
    const awayScore = fixture.goals.away ?? 0;

    // Fetch detailed statistics
    let stats = {
      totalGoals: homeScore + awayScore,
      totalShots: 0,
      shotsOnTarget: 0,
      yellowCards: 0,
      redCards: 0,
      penalties: 0,
    };

    try {
      const matchStats = await this.getMatchStatistics(fixture.fixture.id);

      // Parse statistics from both teams
      for (const teamStats of matchStats) {
        for (const stat of teamStats.statistics) {
          const value =
            typeof stat.value === 'number'
              ? stat.value
              : parseInt(String(stat.value)) || 0;

          switch (stat.type) {
            case 'Total Shots':
              stats.totalShots += value;
              break;
            case 'Shots on Goal':
              stats.shotsOnTarget += value;
              break;
            case 'Yellow Cards':
              stats.yellowCards += value;
              break;
            case 'Red Cards':
              stats.redCards += value;
              break;
          }
        }
      }

      // Check for penalties (if penalty shootout occurred or penalties in match)
      const penaltyStats = matchStats.flatMap((t) =>
        t.statistics.filter((s) => s.type === 'Penalty Scored')
      );
      stats.penalties = penaltyStats.reduce(
        (sum, s) =>
          sum +
          (typeof s.value === 'number'
            ? s.value
            : parseInt(String(s.value)) || 0),
        0
      );
    } catch (error) {
      logger.warn(
        { fixtureId: fixture.fixture.id, error },
        'Failed to fetch match statistics'
      );
    }

    return {
      id: String(fixture.fixture.id),
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeScore,
      awayScore,
      date: new Date(fixture.fixture.date),
      league: fixture.league.name,
      stats,
      // Social metrics would need to be fetched from YouTube/TikTok separately
      social: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      },
    };
  }

  /**
   * Get today's matches across major leagues
   */
  async getTodaysMatches(): Promise<FootballMatch[]> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const fixtures = await this.getFixturesByDate(today);

    // Filter to only finished matches (status: 'FT')
    const finishedMatches = fixtures.filter(
      (f) => f.fixture.status.short === 'FT'
    );

    logger.info(
      {
        total: fixtures.length,
        finished: finishedMatches.length,
      },
      "Fetched today's matches"
    );

    const matches = await Promise.all(
      finishedMatches.map((f) => this.convertToFootballMatch(f))
    );

    return matches;
  }

  /**
   * Get matches for a specific league round
   */
  async getLeagueRoundMatches(
    leagueId: number,
    season: number,
    round: string
  ): Promise<FootballMatch[]> {
    const fixtures = await this.getFixturesByRound(leagueId, season, round);

    // Only include finished matches
    const finishedMatches = fixtures.filter(
      (f) => f.fixture.status.short === 'FT'
    );

    logger.info(
      {
        league: leagueId,
        round,
        total: fixtures.length,
        finished: finishedMatches.length,
      },
      'Fetched league round matches'
    );

    const matches = await Promise.all(
      finishedMatches.map((f) => this.convertToFootballMatch(f))
    );

    return matches;
  }

  /**
   * Get latest round number for a league
   */
  async getLatestRound(
    leagueId: number,
    season: number
  ): Promise<string | null> {
    const rounds = await this.getRounds(leagueId, season);

    if (rounds.length === 0) return null;

    // Get the last round (most recent)
    return rounds[rounds.length - 1];
  }

  /**
   * Enrich matches with social media metrics
   * Search YouTube/TikTok for highlight videos and get engagement
   */
  async enrichWithSocialMetrics(
    matches: FootballMatch[],
    youtubeService?: any
  ): Promise<FootballMatch[]> {
    if (!youtubeService) {
      logger.warn('YouTube service not provided - skipping social enrichment');
      return matches;
    }

    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        try {
          const query = `${match.homeTeam} vs ${match.awayTeam} highlights`;
          const videos = await youtubeService.searchVideos(query, 3);

          if (videos.length > 0) {
            // Sum up views from top 3 highlight videos
            const totalViews = videos.reduce((sum: number, v: any) => {
              const views = parseInt(v.statistics?.viewCount || '0');
              return sum + views;
            }, 0);

            match.social = {
              views: totalViews,
              likes: parseInt(videos[0].statistics?.likeCount || '0'),
              comments: parseInt(videos[0].statistics?.commentCount || '0'),
              shares: 0, // YouTube API doesn't provide share count
            };

            logger.info(
              {
                match: `${match.homeTeam} vs ${match.awayTeam}`,
                views: totalViews,
              },
              'Enriched with social metrics'
            );
          }
        } catch (error) {
          logger.warn(
            {
              match: `${match.homeTeam} vs ${match.awayTeam}`,
              error,
            },
            'Failed to enrich match with social metrics'
          );
        }

        return match;
      })
    );

    return enrichedMatches;
  }
}

// Singleton export
export const footballDataService = new FootballDataService();
