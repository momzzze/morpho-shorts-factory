// ==============================================================================
// Football Controller - Endpoints for match selection and highlight extraction
// ==============================================================================

import { Request, Response } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import {
  footballMatchService,
  FootballMatch,
} from '../services/footballMatchService.js';
import { logger } from '../logger.js';

/**
 * Test endpoint: Score and rank football matches
 * POST /api/v1/football/rank-matches
 * Body: { matches: FootballMatch[], config?: MatchSelectionConfig }
 */
export const rankMatches = asyncHandler(async (req: Request, res: Response) => {
  const { matches, config } = req.body;

  if (!matches || !Array.isArray(matches)) {
    res.status(400).json({
      success: false,
      error: 'matches array is required',
    });
    return;
  }

  const limit = parseInt(req.query.limit as string) || 10;
  const bestMatches = footballMatchService.selectBestMatches(
    matches,
    config,
    limit
  );

  res.json({
    success: true,
    data: {
      analyzed: matches.length,
      returned: bestMatches.length,
      matches: bestMatches,
    },
  });
});

/**
 * Test endpoint: Detect highlights in a match
 * POST /api/v1/football/detect-highlights
 * Body: { match: FootballMatch, videoPath?: string }
 */
export const detectHighlights = asyncHandler(
  async (req: Request, res: Response) => {
    const { match, videoPath } = req.body;

    if (!match) {
      res.status(400).json({
        success: false,
        error: 'match object is required',
      });
      return;
    }

    const highlights = await footballMatchService.detectHighlights(
      videoPath || '',
      match
    );

    res.json({
      success: true,
      data: {
        match: {
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          score: `${match.homeScore}-${match.awayScore}`,
        },
        highlightCount: highlights.length,
        totalDuration: highlights.reduce(
          (sum, h) => sum + (h.endTime - h.startTime),
          0
        ),
        highlights,
      },
    });
  }
);

/**
 * Demo endpoint: Generate sample match data with realistic stats
 * GET /api/v1/football/demo-matches?count=20
 */
export const getDemoMatches = asyncHandler(
  async (req: Request, res: Response) => {
    const count = parseInt(req.query.count as string) || 20;

    const teams = [
      'Manchester United',
      'Manchester City',
      'Liverpool',
      'Chelsea',
      'Arsenal',
      'Barcelona',
      'Real Madrid',
      'Atletico Madrid',
      'Bayern Munich',
      'Dortmund',
      'Inter Milan',
      'AC Milan',
      'Juventus',
      'PSG',
      'Lyon',
    ];

    const leagues = [
      'Premier League',
      'La Liga',
      'Serie A',
      'Bundesliga',
      'Ligue 1',
    ];

    const matches: FootballMatch[] = [];

    for (let i = 0; i < count; i++) {
      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam = teams[Math.floor(Math.random() * teams.length)];

      // Ensure different teams
      while (awayTeam === homeTeam) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      }

      const homeScore = Math.floor(Math.random() * 5);
      const awayScore = Math.floor(Math.random() * 5);
      const totalGoals = homeScore + awayScore;

      // Generate realistic stats
      const totalShots = totalGoals * 3 + Math.floor(Math.random() * 15);
      const shotsOnTarget = totalGoals + Math.floor(Math.random() * 5);

      matches.push({
        id: `match_${i + 1}`,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        league: leagues[Math.floor(Math.random() * leagues.length)],
        stats: {
          totalGoals,
          totalShots,
          shotsOnTarget,
          yellowCards: Math.floor(Math.random() * 6),
          redCards: Math.random() > 0.9 ? 1 : 0,
          penalties: Math.random() > 0.8 ? 1 : 0,
        },
        social: {
          views: Math.floor(Math.random() * 5_000_000),
          likes: Math.floor(Math.random() * 100_000),
          comments: Math.floor(Math.random() * 10_000),
          shares: Math.floor(Math.random() * 50_000),
        },
      });
    }

    res.json({
      success: true,
      data: {
        count: matches.length,
        matches,
      },
    });
  }
);

/**
 * Full pipeline demo: Generate matches, rank them, detect highlights
 * GET /api/v1/football/full-pipeline
 */
export const fullPipeline = asyncHandler(
  async (req: Request, res: Response) => {
    logger.info('Running full football highlight pipeline');

    // 1. Generate demo matches
    const matches: FootballMatch[] = [];
    const teams = [
      'Manchester United',
      'Manchester City',
      'Liverpool',
      'Chelsea',
      'Barcelona',
      'Real Madrid',
      'Bayern Munich',
      'Dortmund',
    ];

    for (let i = 0; i < 30; i++) {
      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam = teams[Math.floor(Math.random() * teams.length)];
      while (awayTeam === homeTeam) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      }

      const homeScore = Math.floor(Math.random() * 5);
      const awayScore = Math.floor(Math.random() * 5);

      matches.push({
        id: `match_${i + 1}`,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        league: 'Premier League',
        stats: {
          totalGoals: homeScore + awayScore,
          totalShots:
            (homeScore + awayScore) * 3 + Math.floor(Math.random() * 10),
          shotsOnTarget: homeScore + awayScore + Math.floor(Math.random() * 5),
          yellowCards: Math.floor(Math.random() * 6),
          redCards: Math.random() > 0.9 ? 1 : 0,
          penalties: Math.random() > 0.8 ? 1 : 0,
        },
        social: {
          views: Math.floor(Math.random() * 5_000_000),
          likes: Math.floor(Math.random() * 100_000),
          comments: Math.floor(Math.random() * 10_000),
          shares: Math.floor(Math.random() * 50_000),
        },
      });
    }

    // 2. Select best matches
    const config = {
      minGoals: 2,
      minExcitementScore: 60,
      maxDaysAgo: 7,
    };

    const bestMatches = footballMatchService.selectBestMatches(
      matches,
      config,
      5
    );

    // 3. Detect highlights for top match
    const topMatch = bestMatches[0];
    const highlights = topMatch
      ? await footballMatchService.detectHighlights('', topMatch)
      : [];

    res.json({
      success: true,
      data: {
        step1_analyzed: matches.length,
        step2_qualified: bestMatches.length,
        step3_topMatch: topMatch
          ? {
              match: `${topMatch.homeTeam} ${topMatch.homeScore}-${topMatch.awayScore} ${topMatch.awayTeam}`,
              excitementScore: topMatch.excitementScore,
              breakdown: topMatch.breakdown,
            }
          : null,
        step4_highlights: {
          count: highlights.length,
          totalDuration: highlights.reduce(
            (sum, h) => sum + (h.endTime - h.startTime),
            0
          ),
          segments: highlights,
        },
      },
    });
  }
);
