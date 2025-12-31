// ==============================================================================
// Football Controller - Highlights and AI processing
// ==============================================================================

import { Request, Response } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import {
  footballMatchService,
  FootballMatch,
} from '../services/footballMatchService.js';
import {
  footballScraperService,
  FOTMOB_LEAGUE_IDS,
} from '../services/footballScraperService.js';
import { logger } from '../logger.js';
import { ApiError } from '../errors.js';

/**
 * Get highlight suggestions with YouTube videos
 * GET /api/v1/football/highlights?league=47&limit=10
 */
export const getMatchesWithHighlights = asyncHandler(
  async (req: Request, res: Response) => {
    const leagueParam = req.query.league as string;
    const limitParam = parseInt(req.query.limit as string) || 100; // Default to all matches

    // Map league names to IDs
    const leagueMap: Record<string, number> = {
      'premier-league': FOTMOB_LEAGUE_IDS.PREMIER_LEAGUE,
      'la-liga': FOTMOB_LEAGUE_IDS.LA_LIGA,
      bundesliga: FOTMOB_LEAGUE_IDS.BUNDESLIGA,
      'serie-a': FOTMOB_LEAGUE_IDS.SERIE_A,
      'ligue-1': FOTMOB_LEAGUE_IDS.LIGUE_1,
      'champions-league': FOTMOB_LEAGUE_IDS.CHAMPIONS_LEAGUE,
    };

    // Use league param or default to Premier League
    let leagueId = leagueParam
      ? parseInt(leagueParam) || leagueMap[leagueParam.toLowerCase()]
      : FOTMOB_LEAGUE_IDS.PREMIER_LEAGUE;

    if (!leagueId) {
      throw new ApiError('Invalid league ID or name', {
        statusCode: 400,
        code: 'INVALID_LEAGUE',
      });
    }

    logger.info(
      { leagueId, limit: limitParam },
      'Fetching all league highlights'
    );

    // Get ALL matches from FotMob league
    const matches = await footballScraperService.getLeagueMatches(leagueId);

    logger.info(
      { leagueId, totalMatches: matches.length },
      'Fetched all league matches'
    );

    // Enrich with detailed stats (parallel)
    const enrichedMatches = await footballScraperService.enrichMatchesWithStats(
      matches
    );

    // Rank by excitement (keep all, just sort)
    const rankedMatches = footballMatchService.selectBestMatches(
      enrichedMatches,
      { minGoals: 1, minExcitementScore: 0 }, // Lower thresholds to get more matches
      limitParam
    );

    logger.info(
      { leagueId, ranked: rankedMatches.length, limit: limitParam },
      'Ranked matches'
    );

    // Add YouTube highlights to ALL ranked matches (not just top 10)
    const matchesWithVideos = await Promise.all(
      rankedMatches.map(async (match) => {
        try {
          const videoUrl = await footballScraperService.searchYouTubeHighlights(
            match.homeTeam,
            match.awayTeam,
            match.league || 'Unknown'
          );

          if (videoUrl) {
            return {
              ...match,
              highlightVideos: [
                {
                  url: videoUrl,
                  source: 'youtube' as const,
                  platform: 'youtube',
                },
              ],
            };
          }
        } catch (error) {
          logger.warn(
            { matchId: match.id },
            'Failed to get YouTube highlights'
          );
        }
        return match;
      })
    );

    res.json({
      success: true,
      data: {
        count: matchesWithVideos.length,
        withVideos: matchesWithVideos.filter((m) => m.highlightVideos?.length)
          .length,
        matches: matchesWithVideos,
      },
    });
  }
);

/**
 * Submit highlight video to AI service for processing
 * POST /api/v1/football/process
 * Body: { videoUrl, homeTeam, awayTeam, score, stats, breakdown }
 */
export const processHighlightsWithAI = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoUrl, homeTeam, awayTeam, score, stats, breakdown } = req.body;

    if (!videoUrl || !homeTeam || !awayTeam) {
      throw new ApiError('Missing required fields', {
        statusCode: 400,
        code: 'MISSING_FIELDS',
      });
    }

    logger.info(
      { videoUrl, homeTeam, awayTeam },
      'Submitting to AI service for processing'
    );

    // TODO: Send to AI service via RabbitMQ
    // This will extract goals, best moments, and generate short clips
    // For now, return a placeholder response

    res.json({
      success: true,
      data: {
        message: 'Video submitted for AI processing',
        videoUrl,
        homeTeam,
        awayTeam,
        status: 'processing',
        estimatedTime: '2-5 minutes',
      },
    });
  }
);
