import { Router } from 'express';
import {
  getFootballHighlights,
  processFootballWithAI,
} from './football.controller.js';
import type { ApiModule } from '../module.types.js';

const router = Router();

// GET /api/v1/football/highlights?league=47
router.get('/highlights', getFootballHighlights);

// POST /api/v1/football/process
router.post('/process', processFootballWithAI);

export const footballModule: ApiModule = {
  name: 'football',
  basePath: '/football',
  router,
};
