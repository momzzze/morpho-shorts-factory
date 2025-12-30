// ==============================================================================
// Football Scraper Service - Get current match data from websites
// ==============================================================================

import { logger } from '../logger.js';
import { FootballMatch } from './footballMatchService.js';
import { isFinished, parseScoreStr } from '../utils/footballParseHelpers.js';
/**
 * Scrape match data from various sources
 * Options:
 * 1. LiveScore.com - Simple, reliable
 * 2. FlashScore.com - Detailed stats
 * 3. FotMob.com - Mobile API (easier to scrape)
 * 4. ESPN.com - Good for highlights
 */

export class FootballScraperService {
  private baseUrls = {
    livescore: 'https://www.livescore.com',
    flashscore: 'https://www.flashscore.com',
    fotmob: 'https://www.fotmob.com/api',
    espn: 'https://www.espn.com',
  };

  /**
   * FotMob has a mobile API that's easier to use than scraping HTML
   * Doesn't require authentication, just HTTP requests
   */
  async getFotMobMatches(date?: string): Promise<any[]> {
    const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      const url = `https://www.fotmob.com/api/matches?date=${targetDate}`;

      logger.info({ url }, 'Fetching from FotMob API');

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`FotMob API error: ${response.status}`);
      }

      const data = await response.json();
      return data.leagues || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch from FotMob');
      throw error;
    }
  }

  /**
   * Convert FotMob data to our FootballMatch format
   */
  async getTodaysMatchesFromFotMob(): Promise<FootballMatch[]> {
    const leagues = await this.getFotMobMatches();
    const matches: FootballMatch[] = [];

    for (const league of leagues) {
      if (!league.matches) continue;

      for (const match of league.matches) {
        // Only include finished matches
        if (match.status?.finished !== true) continue;

        const homeScore = match.home?.score || 0;
        const awayScore = match.away?.score || 0;

        matches.push({
          id: String(match.id),
          homeTeam: match.home?.name || '',
          awayTeam: match.away?.name || '',
          homeScore,
          awayScore,
          date: new Date(match.status?.utcTime || Date.now()),
          league:
            league.primaryId === 47
              ? 'Premier League'
              : league.primaryId === 87
              ? 'La Liga'
              : league.primaryId === 54
              ? 'Bundesliga'
              : league.primaryId === 55
              ? 'Serie A'
              : league.primaryId === 53
              ? 'Ligue 1'
              : league.name || 'Unknown',
          stats: {
            totalGoals: homeScore + awayScore,
            totalShots: 0, // FotMob doesn't provide this in match list
            shotsOnTarget: 0,
            yellowCards: 0,
            redCards: 0,
            penalties: 0,
          },
          social: {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
          },
        });
      }
    }

    logger.info({ count: matches.length }, 'Fetched matches from FotMob');
    return matches;
  }

  /**
   * Get detailed match statistics from FotMob
   */
  async getMatchDetails(matchId: string): Promise<any> {
    try {
      const url = `https://www.fotmob.com/api/matchDetails?matchId=${matchId}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `FotMob API error: ${response.status} - ${errorText.substring(
            0,
            100
          )}`
        );
      }

      const data = await response.json();

      // Parse statistics
      const stats = {
        totalShots: 0,
        shotsOnTarget: 0,
        yellowCards: 0,
        redCards: 0,
        penalties: 0,
      };

      // FotMob provides stats in data.content.stats.Periods.All
      if (data.content?.stats?.Periods?.All) {
        const allStatsData = data.content.stats.Periods.All;

        // Convert to array if it's an object
        const allStats = Array.isArray(allStatsData)
          ? allStatsData
          : Object.values(allStatsData);

        for (const stat of allStats) {
          if (!stat || typeof stat !== 'object') continue;

          const homeStat = parseInt(stat.stats?.[0] || '0');
          const awayStat = parseInt(stat.stats?.[1] || '0');

          switch (stat.title) {
            case 'Shots':
              stats.totalShots = homeStat + awayStat;
              break;
            case 'Shots on target':
              stats.shotsOnTarget = homeStat + awayStat;
              break;
            case 'Yellow cards':
              stats.yellowCards = homeStat + awayStat;
              break;
            case 'Red cards':
              stats.redCards = homeStat + awayStat;
              break;
          }
        }
      }

      return { data, stats };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        { matchId, error: errorMessage, errorType: error?.constructor?.name },
        'Failed to fetch match details from FotMob'
      );
      throw error;
    }
  }

  /**
   * Enrich matches with detailed statistics
   */
  async enrichMatchesWithStats(
    matches: FootballMatch[]
  ): Promise<FootballMatch[]> {
    let successCount = 0;
    let failCount = 0;

    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        try {
          const { stats } = await this.getMatchDetails(match.id);

          match.stats = {
            ...match.stats,
            ...stats,
          };

          successCount++;
        } catch (error) {
          failCount++;
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          // Only log first 3 failures to avoid spam
          if (failCount <= 3) {
            logger.warn(
              { matchId: match.id, error: errorMessage },
              'Failed to enrich match stats'
            );
          }
        }

        return match;
      })
    );

    logger.info(
      { total: matches.length, enriched: successCount, failed: failCount },
      'Match stat enrichment completed'
    );

    return enrichedMatches;
  }

  /**
   * Alternative: LiveScore scraper using their internal API
   * LiveScore has a JSON endpoint that's easier than HTML parsing
   */
  async getLiveScoreMatches(): Promise<any[]> {
    try {
      // LiveScore uses a date-based endpoint
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const url = `https://prod-public-api.livescore.com/v1/api/app/date/soccer/${today}/0?locale=en&MD=1`;

      logger.info({ url }, 'Fetching from LiveScore API');

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`LiveScore API error: ${response.status}`);
      }

      const data = await response.json();
      return data.Stages || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch from LiveScore');
      throw error;
    }
  }

  /**
   * Get league matches from FotMob by league ID
   * League IDs: Premier League = 47, La Liga = 87, Bundesliga = 54, Serie A = 55, Ligue 1 = 53
   */
  async getLeagueMatches(
    leagueId: number,
    season?: string
  ): Promise<FootballMatch[]> {
    try {
      const url = `https://www.fotmob.com/api/leagues?id=${leagueId}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`FotMob API error: ${response.status}`);
      }
      console.log('====================================');
      console.log(response);
      console.log('====================================');
      const data = await response.json();
      console.log('FotMob league keys:', Object.keys(data));
      console.log(
        'FotMob fixtures keys:',
        data.fixtures ? Object.keys(data.fixtures) : null
      );
      console.log(
        'Sample data.fixtures?.allMatches?.[0]:',
        data.fixtures?.allMatches?.[0]
      );

      // Parse matches from league data
      const matches: FootballMatch[] = [];

      // FotMob league API structure - matches are in fixtures.allMatches array
      const matchList = data.fixtures?.allMatches ?? [];

      for (const match of matchList) {
        if (!isFinished(match)) continue;

        const { home: homeScore, away: awayScore } = parseScoreStr(
          match.status?.scoreStr
        );

        matches.push({
          id: String(match.id),
          homeTeam: match.home?.name ?? '',
          awayTeam: match.away?.name ?? '',
          homeScore,
          awayScore,
          date: new Date(match.status?.utcTime ?? Date.now()),
          league: data.details?.name ?? data.name ?? 'Unknown',
          stats: {
            totalGoals: homeScore + awayScore,
            totalShots: 0,
            shotsOnTarget: 0,
            yellowCards: 0,
            redCards: 0,
            penalties: 0,
          },
          social: { views: 0, likes: 0, comments: 0, shares: 0 },
        });
      }

      return matches;
    } catch (error) {
      logger.error({ leagueId, error }, 'Failed to fetch league matches');
      throw error;
    }
  }
}

// Singleton export
export const footballScraperService = new FootballScraperService();

/**
 * FotMob League IDs (FREE, CURRENT DATA!)
 */
export const FOTMOB_LEAGUE_IDS = {
  PREMIER_LEAGUE: 47,
  LA_LIGA: 87,
  BUNDESLIGA: 54,
  SERIE_A: 55,
  LIGUE_1: 53,
  CHAMPIONS_LEAGUE: 42,
  EUROPA_LEAGUE: 73,
} as const;
