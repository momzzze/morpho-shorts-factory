// ==============================================================================
// Football Routes - Get highlights and submit for AI processing
// ==============================================================================

import { Router } from 'express';
import {
  getMatchesWithHighlights,
  processHighlightsWithAI,
} from '../../controllers/footballController.js';

const router = Router();

/**
 * GET /api/v1/football/highlights?league=47
 * Get highlight suggestions with YouTube videos
 * Query params:
 *   - league: 47 (Premier League), 87 (La Liga), 54 (Bundesliga), 55 (Serie A), 53 (Ligue 1), 42 (Champions League)
 *   - limit: 5 (default), max videos to return
 */
router.get('/highlights', getMatchesWithHighlights);

/**
 * POST /api/v1/football/process
 * Submit video highlights to AI service for processing
 * Body: { videoUrl, teams, score, stats, breakdown }
 */
router.post('/process', processHighlightsWithAI);

export default router;
