/**
 * Stocks Module - SIMPLIFIED WITH DATABASE
 */

import { Router } from 'express';
import type { ApiModule } from '../module.types.js';
import {
  getCompanyInfo,
  getFundamentals,
  getSavedFundamentals,
  listCompanies,
} from './stocks.controller.js';

const router = Router();

// GET /stocks/list - List all companies with saved data
router.get('/list', listCompanies);

// GET /stocks/:ticker/info - Get company info
router.get('/:ticker/info', getCompanyInfo);

// GET /stocks/:ticker/fundamentals - Fetch from SEC and save to database
router.get('/:ticker/fundamentals', getFundamentals);

// GET /stocks/:ticker/saved - Get saved data from database
router.get('/:ticker/saved', getSavedFundamentals);

export const stocksModule: ApiModule = {
  name: 'stocks',
  basePath: '/stocks',
  router,
};
