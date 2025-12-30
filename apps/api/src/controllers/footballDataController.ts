// ==============================================================================
// Football Data Controller - Real match data from APIs
// ==============================================================================

import { Request, Response } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { ApiError } from '../errors.js';
import {
  footballDataService,
  LEAGUE_IDS,
} from '../services/footballDataService.js';
import { footballMatchService } from '../services/footballMatchService.js';
import { youtubeService } from '../services/youtubeService.js';
import { logger } from '../logger.js';

/**
 * Get today's finished matches
 * GET /api/v1/football/data/today
 */
export const getTodaysMatches = asyncHandler(
  async (req: Request, res: Response) => {
    if (!footballDataService.isConfigured()) {
      throw new ApiError(
        'Football API not configured. Set FOOTBALL_API_KEY in .env',
        {
          statusCode: 503,
          code: 'API_NOT_CONFIGURED',
        }
      );
    }

    const matches = await footballDataService.getTodaysMatches();

    res.json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        count: matches.length,
        matches,
      },
    });
  }
);

/**
 * Get matches for a specific league round
 * GET /api/v1/football/data/league/:leagueId/round/:round?season=2024
 */
export const getLeagueRoundMatches = asyncHandler(
  async (req: Request, res: Response) => {
    if (!footballDataService.isConfigured()) {
      throw new ApiError(
        'Football API not configured. Set FOOTBALL_API_KEY in .env',
        {
          statusCode: 503,
          code: 'API_NOT_CONFIGURED',
        }
      );
    }

    const { leagueId, round } = req.params;
    const season = parseInt(req.query.season as string) || 2023; // Free plan: 2021-2023

    const matches = await footballDataService.getLeagueRoundMatches(
      parseInt(leagueId),
      season,
      round
    );

    res.json({
      success: true,
      data: {
        leagueId,
        round,
        season,
        count: matches.length,
        matches,
      },
    });
  }
);

/**
 * Get and rank today's best matches
 * GET /api/v1/football/data/today/ranked?limit=5&minGoals=2&enrichSocial=true
 */
export const getTodaysRankedMatches = asyncHandler(
  async (req: Request, res: Response) => {
    if (!footballDataService.isConfigured()) {
      throw new ApiError(
        'Football API not configured. Set FOOTBALL_API_KEY in .env',
        {
          statusCode: 503,
          code: 'API_NOT_CONFIGURED',
        }
      );
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const minGoals = parseInt(req.query.minGoals as string) || 2;
    const minExcitementScore =
      parseInt(req.query.minExcitementScore as string) || 60;
    const enrichSocial = req.query.enrichSocial === 'true';

    logger.info(
      { limit, minGoals, minExcitementScore, enrichSocial },
      "Fetching and ranking today's matches"
    );

    // 1. Fetch today's matches
    let matches = await footballDataService.getTodaysMatches();

    // 2. Optionally enrich with social metrics from YouTube
    if (enrichSocial) {
      matches = await footballDataService.enrichWithSocialMetrics(
        matches,
        youtubeService
      );
    }

    // 3. Rank matches
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
        date: new Date().toISOString().split('T')[0],
        totalMatches: matches.length,
        qualifiedMatches: rankedMatches.length,
        enrichedWithSocial: enrichSocial,
        matches: rankedMatches,
      },
    });
  }
);

/**
 * Get best matches from a specific league round
 * GET /api/v1/football/data/league/:leagueId/round/:round/ranked?season=2024&limit=3
 */
export const getLeagueRoundRanked = asyncHandler(
  async (req: Request, res: Response) => {
    if (!footballDataService.isConfigured()) {
      throw new ApiError(
        'Football API not configured. Set FOOTBALL_API_KEY in .env',
        {
          statusCode: 503,
          code: 'API_NOT_CONFIGURED',
        }
      );
    }

    const { leagueId, round } = req.params;
    const season = parseInt(req.query.season as string) || 2023; // Free plan: 2021-2023
    const limit = parseInt(req.query.limit as string) || 3;
    const minGoals = parseInt(req.query.minGoals as string) || 2;
    const enrichSocial = req.query.enrichSocial === 'true';

    logger.info(
      { leagueId, round, season, limit },
      'Fetching and ranking league round'
    );

    // 1. Fetch round matches
    let matches = await footballDataService.getLeagueRoundMatches(
      parseInt(leagueId),
      season,
      round
    );

    // 2. Optionally enrich with social metrics
    if (enrichSocial) {
      matches = await footballDataService.enrichWithSocialMetrics(
        matches,
        youtubeService
      );
    }

    // 3. Rank matches
    const rankedMatches = footballMatchService.selectBestMatches(
      matches,
      { minGoals },
      limit
    );

    res.json({
      success: true,
      data: {
        leagueId,
        round,
        season,
        totalMatches: matches.length,
        qualifiedMatches: rankedMatches.length,
        enrichedWithSocial: enrichSocial,
        matches: rankedMatches,
      },
    });
  }
);

/**
 * Get available rounds for a league
 * GET /api/v1/football/data/league/:leagueId/rounds?season=2024
 */
export const getLeagueRounds = asyncHandler(
  async (req: Request, res: Response) => {
    if (!footballDataService.isConfigured()) {
      throw new ApiError(
        'Football API not configured. Set FOOTBALL_API_KEY in .env',
        {
          statusCode: 503,
          code: 'API_NOT_CONFIGURED',
        }
      );
    }

    const { leagueId } = req.params;
    const season = parseInt(req.query.season as string) || 2023; // Free plan: 2021-2023

    const rounds = await footballDataService.getRounds(
      parseInt(leagueId),
      season
    );

    res.json({
      success: true,
      data: {
        leagueId,
        season,
        count: rounds.length,
        rounds,
        latest: rounds[rounds.length - 1] || null,
      },
    });
  }
);

/**
 * Get league IDs reference
 * GET /api/v1/football/data/leagues
 */
export const getLeagueIds = asyncHandler(
  async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        leagues: LEAGUE_IDS,
        usage: {
          premierLeague: LEAGUE_IDS.PREMIER_LEAGUE,
          laLiga: LEAGUE_IDS.LA_LIGA,
          bundesliga: LEAGUE_IDS.BUNDESLIGA,
          serieA: LEAGUE_IDS.SERIE_A,
          ligue1: LEAGUE_IDS.LIGUE_1,
          championsLeague: LEAGUE_IDS.CHAMPIONS_LEAGUE,
          europaLeague: LEAGUE_IDS.EUROPA_LEAGUE,
        },
        example: {
          getPremierLeagueRound18:
            '/api/v1/football/data/league/39/round/Regular Season - 18?season=2024',
          getTodaysRanked:
            '/api/v1/football/data/today/ranked?limit=5&minGoals=3&enrichSocial=true',
        },
      },
    });
  }
);
