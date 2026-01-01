import { Request, Response } from 'express';
import { asyncHandler } from '../../asyncHandler.js';
import { ApiError } from '../../errors.js';
import { footballModuleService } from './football.service.js';
import { footballAdapter } from './football.adapter.js';

// GET /api/v1/football/highlights?league=47&limit=10
export const getFootballHighlights = asyncHandler(
  async (req: Request, res: Response) => {
    const leagueParam = req.query.league as string;
    const limitParam = parseInt(req.query.limit as string, 10) || 100;

    const leagueMap: Record<string, number> = {
      'premier-league': footballAdapter.leagueIds.PREMIER_LEAGUE,
      'la-liga': footballAdapter.leagueIds.LA_LIGA,
      bundesliga: footballAdapter.leagueIds.BUNDESLIGA,
      'serie-a': footballAdapter.leagueIds.SERIE_A,
      'ligue-1': footballAdapter.leagueIds.LIGUE_1,
      'champions-league': footballAdapter.leagueIds.CHAMPIONS_LEAGUE,
    };

    const leagueId = leagueParam
      ? parseInt(leagueParam, 10) || leagueMap[leagueParam.toLowerCase()]
      : footballAdapter.leagueIds.PREMIER_LEAGUE;

    if (!leagueId) {
      throw new ApiError('Invalid league ID or name', {
        statusCode: 400,
        code: 'INVALID_LEAGUE',
      });
    }

    const result = await footballModuleService.getHighlights({
      leagueId,
      limit: limitParam,
    });

    res.json({
      success: true,
      data: result,
    });
  }
);

// POST /api/v1/football/process
export const processFootballWithAI = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoUrl, homeTeam, awayTeam } = req.body;
    if (!videoUrl || !homeTeam || !awayTeam) {
      throw new ApiError('Missing required fields', {
        statusCode: 400,
        code: 'MISSING_FIELDS',
      });
    }

    // TODO: connect to AI pipeline; placeholder response
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
