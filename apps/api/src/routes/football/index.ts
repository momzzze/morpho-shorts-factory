// ==============================================================================
// Football Routes - Match selection and highlight extraction
// ==============================================================================

import { Router } from 'express';
import {
  rankMatches,
  detectHighlights,
  getDemoMatches,
  fullPipeline,
} from '../../controllers/footballController.js';
import footballDataRouter from '../football-data/index.js';
import footballScraperRouter from '../football-scraper/index.js';

const router = Router();

// Web scraping endpoints (FREE, CURRENT DATA!)
router.use('/scraper', footballScraperRouter);

// Real data endpoints (from external APIs - requires API key)
router.use('/data', footballDataRouter);

// Demo/testing endpoints
router.post('/rank-matches', rankMatches);
router.post('/detect-highlights', detectHighlights);
router.get('/demo-matches', getDemoMatches);
router.get('/full-pipeline', fullPipeline);

export default router;
