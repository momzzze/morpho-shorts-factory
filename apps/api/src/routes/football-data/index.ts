// ==============================================================================
// Football Data Routes - Real match data from external APIs
// ==============================================================================

import { Router } from 'express';
import {
  getTodaysMatches,
  getTodaysRankedMatches,
  getLeagueRoundMatches,
  getLeagueRoundRanked,
  getLeagueRounds,
  getLeagueIds,
} from '../../controllers/footballDataController.js';

const router = Router();

// GET /api/v1/football/data/leagues - Reference for league IDs
router.get('/leagues', getLeagueIds);

// GET /api/v1/football/data/today - Today's finished matches
router.get('/today', getTodaysMatches);

// GET /api/v1/football/data/today/ranked - Today's best matches (ranked)
router.get('/today/ranked', getTodaysRankedMatches);

// GET /api/v1/football/data/league/:leagueId/rounds - Available rounds
router.get('/league/:leagueId/rounds', getLeagueRounds);

// GET /api/v1/football/data/league/:leagueId/round/:round - Specific round matches
router.get('/league/:leagueId/round/:round', getLeagueRoundMatches);

// GET /api/v1/football/data/league/:leagueId/round/:round/ranked - Round's best matches
router.get('/league/:leagueId/round/:round/ranked', getLeagueRoundRanked);

export default router;
