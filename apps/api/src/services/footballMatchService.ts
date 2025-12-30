// ==============================================================================
// Football Match Service - Smart match selection and highlight extraction
// ==============================================================================

import { logger } from '../logger.js';

/**
 * Match metadata from API (e.g., API-Football, FotMob, LiveScore)
 */
export interface FootballMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: Date;
  league: string;

  // Stats for scoring algorithm
  stats?: {
    totalGoals: number;
    totalShots: number;
    shotsOnTarget: number;
    yellowCards: number;
    redCards: number;
    penalties: number;
    possession?: { home: number; away: number };
  };

  // Social metrics
  social?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };

  // Available highlight video sources
  highlightVideos?: {
    url: string;
    duration: number;
    quality: string;
    source: 'youtube' | 'tiktok' | 'other';
  }[];
}

/**
 * Scored match with ranking
 */
export interface ScoredMatch extends FootballMatch {
  excitementScore: number;
  breakdown: {
    goalScore: number;
    actionScore: number;
    cardScore: number;
    socialScore: number;
    importanceScore: number;
  };
}

/**
 * Highlight segment detected in video
 */
export interface HighlightSegment {
  startTime: number; // seconds
  endTime: number;
  type: 'goal' | 'near_miss' | 'save' | 'card' | 'penalty' | 'celebration';
  confidence: number; // 0-1
  description: string;
  metadata?: {
    team?: string;
    player?: string;
    minute?: number;
  };
}

/**
 * Configuration for match selection algorithm
 */
export interface MatchSelectionConfig {
  minGoals?: number; // Default: 2
  minExcitementScore?: number; // Default: 50
  maxDaysAgo?: number; // Default: 7
  preferredLeagues?: string[]; // e.g., ['Premier League', 'La Liga']
  minSocialEngagement?: number; // Minimum views/likes
}

export class FootballMatchService {
  /**
   * Score a single match based on excitement factors
   */
  scoreMatch(match: FootballMatch): ScoredMatch {
    const stats = match.stats || {
      totalGoals: 0,
      totalShots: 0,
      shotsOnTarget: 0,
      yellowCards: 0,
      redCards: 0,
      penalties: 0,
    };
    const social = match.social || {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    };

    // 1. Goal Score (0-40 points)
    const goalScore = Math.min(stats.totalGoals * 8, 40);

    // 2. Action Score (0-30 points)
    // Shots, saves, attacking play
    const shotsScore = Math.min((stats.totalShots || 0) * 0.5, 15);
    const shotsOnTargetScore = Math.min((stats.shotsOnTarget || 0) * 1, 15);
    const actionScore = shotsScore + shotsOnTargetScore;

    // 3. Card Score (0-15 points)
    // Red cards and penalties make matches more dramatic
    const cardScore =
      (stats.redCards || 0) * 5 +
      (stats.penalties || 0) * 5 +
      (stats.yellowCards || 0) * 1;

    // 4. Social Score (0-30 points)
    // Normalize by typical viral football content (1M views = 30 points)
    const views = social.views || 0;
    const socialScore = Math.min((views / 1_000_000) * 30, 30);

    // 5. Importance Score (0-15 points)
    // League importance, rivalry, etc. (can be enhanced later)
    const importanceScore = this.calculateImportanceScore(match);

    const excitementScore =
      goalScore + actionScore + cardScore + socialScore + importanceScore;

    return {
      ...match,
      excitementScore: Math.round(excitementScore),
      breakdown: {
        goalScore: Math.round(goalScore),
        actionScore: Math.round(actionScore),
        cardScore: Math.round(cardScore),
        socialScore: Math.round(socialScore),
        importanceScore: Math.round(importanceScore),
      },
    };
  }

  /**
   * Calculate importance score based on league, teams, etc.
   */
  private calculateImportanceScore(match: FootballMatch): number {
    let score = 0;

    // Top 5 leagues get bonus
    const topLeagues = [
      'Premier League',
      'La Liga',
      'Serie A',
      'Bundesliga',
      'Ligue 1',
    ];
    if (topLeagues.includes(match.league)) {
      score += 10;
    }

    // Derby/Rivalry detection (basic - can enhance with team rivalry DB)
    const derbies = [
      ['Manchester United', 'Manchester City'],
      ['Liverpool', 'Everton'],
      ['Barcelona', 'Real Madrid'],
      ['Inter', 'Milan'],
      ['Dortmund', 'Schalke'],
    ];

    const isRivalry = derbies.some(
      ([team1, team2]) =>
        (match.homeTeam.includes(team1) && match.awayTeam.includes(team2)) ||
        (match.homeTeam.includes(team2) && match.awayTeam.includes(team1))
    );

    if (isRivalry) {
      score += 5;
    }

    return score;
  }

  /**
   * Select best matches from a list based on config
   */
  selectBestMatches(
    matches: FootballMatch[],
    config: MatchSelectionConfig = {},
    limit: number = 10
  ): ScoredMatch[] {
    const {
      minGoals = 2,
      minExcitementScore = 50,
      maxDaysAgo = 7,
      preferredLeagues,
      minSocialEngagement = 0,
    } = config;

    const now = new Date();
    const maxDate = new Date(now.getTime() - maxDaysAgo * 24 * 60 * 60 * 1000);

    // Filter matches
    let filtered = matches.filter((match) => {
      // Recent matches only
      if (match.date < maxDate) return false;

      // Minimum goals
      if ((match.stats?.totalGoals || 0) < minGoals) return false;

      // Preferred leagues (if specified)
      if (preferredLeagues && !preferredLeagues.includes(match.league)) {
        return false;
      }

      // Social engagement threshold
      if ((match.social?.views || 0) < minSocialEngagement) {
        return false;
      }

      return true;
    });

    // Score all matches
    const scored = filtered.map((m) => this.scoreMatch(m));

    // Filter by minimum excitement score
    const qualified = scored.filter(
      (m) => m.excitementScore >= minExcitementScore
    );

    // Sort by excitement score (descending)
    qualified.sort((a, b) => b.excitementScore - a.excitementScore);

    logger.info(
      {
        totalMatches: matches.length,
        filtered: filtered.length,
        qualified: qualified.length,
        returning: Math.min(limit, qualified.length),
      },
      'Match selection completed'
    );

    return qualified.slice(0, limit);
  }

  /**
   * Detect highlights in a video using AI/heuristics
   * This is a placeholder - actual implementation would use:
   * - Audio analysis (crowd noise, commentator volume)
   * - Visual analysis (ball movement, player clustering)
   * - OCR on scoreboard
   * - Scene change detection
   */
  async detectHighlights(
    videoPath: string,
    matchMetadata?: FootballMatch
  ): Promise<HighlightSegment[]> {
    logger.info({ videoPath }, 'Detecting highlights in video');

    // TODO: Implement actual AI detection
    // Options:
    // 1. FFmpeg audio analysis for crowd noise spikes
    // 2. Computer vision for ball tracking
    // 3. OCR for score changes
    // 4. ML model trained on football highlights

    // For now, return mock data
    return this.mockHighlightDetection(matchMetadata);
  }

  /**
   * Mock highlight detection (replace with real AI)
   */
  private mockHighlightDetection(match?: FootballMatch): HighlightSegment[] {
    if (!match || !match.stats) {
      return [];
    }

    const segments: HighlightSegment[] = [];
    const totalGoals = match.stats.totalGoals;

    // Simulate goal highlights (every 15 minutes of match on average)
    for (let i = 0; i < totalGoals; i++) {
      const minute = Math.floor(Math.random() * 90) + 1;
      const startTime = minute * 60;

      segments.push({
        startTime,
        endTime: startTime + 30, // 30 second highlight
        type: 'goal',
        confidence: 0.85 + Math.random() * 0.15,
        description: `Goal scored at ${minute}'`,
        metadata: {
          minute,
          team: Math.random() > 0.5 ? match.homeTeam : match.awayTeam,
        },
      });
    }

    // Add penalty/red card highlights
    if (match.stats.penalties > 0) {
      segments.push({
        startTime: 2100, // 35 minutes
        endTime: 2130,
        type: 'penalty',
        confidence: 0.9,
        description: 'Penalty awarded',
      });
    }

    return segments.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Extract highlight segments from video file
   * Uses FFmpeg to cut video segments
   */
  async extractHighlightSegments(
    videoPath: string,
    segments: HighlightSegment[],
    outputDir: string
  ): Promise<string[]> {
    logger.info(
      {
        videoPath,
        segmentCount: segments.length,
        outputDir,
      },
      'Extracting highlight segments'
    );

    // TODO: Implement FFmpeg extraction
    // ffmpeg -i input.mp4 -ss 00:10:00 -to 00:10:30 -c copy segment1.mp4

    throw new Error('Not implemented - requires FFmpeg integration');
  }

  /**
   * Full pipeline: Find best matches, download highlights, extract clips
   */
  async createHighlightCompilation(
    matches: FootballMatch[],
    config: MatchSelectionConfig = {}
  ): Promise<{
    selectedMatches: ScoredMatch[];
    highlightSegments: { match: ScoredMatch; segments: HighlightSegment[] }[];
  }> {
    // 1. Select best matches
    const selectedMatches = this.selectBestMatches(matches, config, 5);

    logger.info(
      {
        selectedCount: selectedMatches.length,
        topMatch:
          selectedMatches[0]?.homeTeam + ' vs ' + selectedMatches[0]?.awayTeam,
        topScore: selectedMatches[0]?.excitementScore,
      },
      'Top matches selected'
    );

    // 2. Detect highlights for each match
    const highlightSegments = [];

    for (const match of selectedMatches) {
      const segments = await this.detectHighlights('', match);
      highlightSegments.push({ match, segments });
    }

    return {
      selectedMatches,
      highlightSegments,
    };
  }
}

// Singleton export
export const footballMatchService = new FootballMatchService();
