// ==============================================================================
// Football Scraper Controller - Current match data from web scraping
// ==============================================================================

import { Request, Response } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import {
  footballScraperService,
  FOTMOB_LEAGUE_IDS,
} from '../services/footballScraperService.js';
import { footballMatchService } from '../services/footballMatchService.js';
import { youtubeService } from '../services/youtubeService.js';
import { footballDataService } from '../services/footballDataService.js';
import { logger } from '../logger.js';

/**
 * Get today's matches from FotMob (FREE, CURRENT DATA!)
 * GET /api/v1/football/scraper/today
 */
export const getTodaysMatchesFromScraper = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info("Fetching today's matches from FotMob (web scraping)");

    const matches = await footballScraperService.getTodaysMatchesFromFotMob();

    res.json({
      success: true,
      data: {
        source: 'FotMob (scraped)',
        date: new Date().toISOString().split('T')[0],
        count: matches.length,
        matches,
      },
    });
  }
);

/**
 * Get today's best matches (ranked) from FotMob
 * GET /api/v1/football/scraper/today/ranked?limit=5&enrichStats=true&enrichSocial=true
 */
export const getTodaysRankedFromScraper = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 5;
    const minGoals = parseInt(req.query.minGoals as string) || 2;
    const minExcitementScore =
      parseInt(req.query.minExcitementScore as string) || 60;
    const enrichStats = req.query.enrichStats === 'true';
    const enrichSocial = req.query.enrichSocial === 'true';

    logger.info(
      { limit, minGoals, enrichStats, enrichSocial },
      "Fetching and ranking today's matches from FotMob"
    );

    // 1. Fetch today's matches
    let matches = await footballScraperService.getTodaysMatchesFromFotMob();

    // 2. Optionally enrich with detailed stats
    if (enrichStats) {
      matches = await footballScraperService.enrichMatchesWithStats(matches);
    }

    // 3. Optionally enrich with YouTube social metrics
    if (enrichSocial) {
      matches = await footballDataService.enrichWithSocialMetrics(
        matches,
        youtubeService
      );
    }

    // 4. Rank matches
    const rankedMatches = footballMatchService.selectBestMatches(
      matches,
      {
        minGoals,
        minExcitementScore,
        maxDaysAgo: 1,
      },
      limit
    );

    res.json({
      success: true,
      data: {
        source: 'FotMob (scraped)',
        date: new Date().toISOString().split('T')[0],
        totalMatches: matches.length,
        qualifiedMatches: rankedMatches.length,
        enrichedWithStats: enrichStats,
        enrichedWithSocial: enrichSocial,
        matches: rankedMatches,
      },
    });
  }
);

/**
 * Get league matches from FotMob
 * GET /api/v1/football/scraper/league/:leagueId
 */
export const getLeagueMatchesFromScraper = asyncHandler(
  async (req: Request, res: Response) => {
    const { leagueId } = req.params;

    logger.info({ leagueId }, 'Fetching league matches from FotMob');

    const matches = await footballScraperService.getLeagueMatches(
      parseInt(leagueId)
    );

    res.json({
      success: true,
      data: {
        source: 'FotMob (scraped)',
        leagueId,
        count: matches.length,
        matches,
      },
    });
  }
);

/**
 * Get league best matches (ranked) from FotMob
 * GET /api/v1/football/scraper/league/:leagueId/ranked?limit=5
 */
export const getLeagueRankedFromScraper = asyncHandler(
  async (req: Request, res: Response) => {
    const { leagueId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    const minGoals = parseInt(req.query.minGoals as string) || 2;
    const enrichStats = req.query.enrichStats === 'true';
    const enrichSocial = req.query.enrichSocial === 'true';
    const maxDaysAgo = req.query.maxDaysAgo
      ? parseInt(req.query.maxDaysAgo as string)
      : 7;

    logger.info(
      { leagueId, limit, minGoals, maxDaysAgo },
      'Fetching and ranking league matches'
    );

    // 1. Fetch league matches
    let matches = await footballScraperService.getLeagueMatches(
      parseInt(leagueId)
    );

    // 2. Optionally enrich with stats
    if (enrichStats) {
      matches = await footballScraperService.enrichMatchesWithStats(matches);
    }

    // 3. Optionally enrich with social
    if (enrichSocial) {
      matches = await footballDataService.enrichWithSocialMetrics(
        matches,
        youtubeService
      );
    }

    // 4. Rank matches
    const rankedMatches = footballMatchService.selectBestMatches(
      matches,
      { minGoals, maxDaysAgo },
      limit
    );

    res.json({
      success: true,
      data: {
        source: 'FotMob (scraped)',
        leagueId,
        totalMatches: matches.length,
        qualifiedMatches: rankedMatches.length,
        enrichedWithStats: enrichStats,
        enrichedWithSocial: enrichSocial,
        matches: rankedMatches,
      },
    });
  }
);

/**
 * Get FotMob league IDs reference
 * GET /api/v1/football/scraper/leagues
 */
export const getFotMobLeagueIds = asyncHandler(
  async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        source: 'FotMob API (FREE, CURRENT DATA!)',
        leagues: FOTMOB_LEAGUE_IDS,
        examples: {
          todaysBest:
            '/api/v1/football/scraper/today/ranked?limit=5&enrichStats=true',
          premierLeague: '/api/v1/football/scraper/league/47/ranked?limit=3',
          laLiga: '/api/v1/football/scraper/league/87/ranked?limit=3',
          championsLeague: '/api/v1/football/scraper/league/42/ranked?limit=5',
        },
        note: 'FotMob provides CURRENT season data for FREE! No API key needed.',
      },
    });
  }
);
