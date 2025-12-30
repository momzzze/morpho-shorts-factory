// ==============================================================================
// Football Scraper Routes - Web scraping for current data
// ==============================================================================

import { Router } from 'express';
import {
  getTodaysMatchesFromScraper,
  getTodaysRankedFromScraper,
  getLeagueMatchesFromScraper,
  getLeagueRankedFromScraper,
  getFotMobLeagueIds,
} from '../../controllers/footballScraperController.js';

const router = Router();

// GET /api/v1/football/scraper/leagues - FotMob league IDs
router.get('/leagues', getFotMobLeagueIds);

// GET /api/v1/football/scraper/today - Today's matches (scraped)
router.get('/today', getTodaysMatchesFromScraper);

// GET /api/v1/football/scraper/today/ranked - Today's best matches
router.get('/today/ranked', getTodaysRankedFromScraper);

// GET /api/v1/football/scraper/league/:leagueId - League matches
router.get('/league/:leagueId', getLeagueMatchesFromScraper);

// GET /api/v1/football/scraper/league/:leagueId/ranked - League best matches
router.get('/league/:leagueId/ranked', getLeagueRankedFromScraper);

export default router;
