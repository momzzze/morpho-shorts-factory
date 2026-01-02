/**
 * Stocks Controller - SIMPLIFIED
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../asyncHandler.js';
import { z } from 'zod';
import { stocksService } from './stocks.service.js';

// Validation schema
const tickerSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
});

/**
 * GET /stocks/:ticker/info
 * Get company info
 */
export const getCompanyInfo = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticker } = tickerSchema.parse(req.params);

    const company = await stocksService.getCompanyInfo(ticker);

    res.json({ data: company });
  }
);

/**
 * GET /stocks/:ticker/fundamentals
 * Fetch from SEC API and save to database
 */
export const getFundamentals = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticker } = tickerSchema.parse(req.params);

    const result = await stocksService.getFundamentals(ticker);

    res.json({
      data: result,
    });
  }
);

/**
 * GET /stocks/:ticker/saved
 * Get saved fundamentals from database
 */
export const getSavedFundamentals = asyncHandler(
  async (req: Request, res: Response) => {
    const { ticker } = tickerSchema.parse(req.params);

    const result = await stocksService.getSavedFundamentals(ticker);

    res.json({ data: result });
  }
);

/**
 * GET /stocks/list
 * List all companies with saved data
 */
export const listCompanies = asyncHandler(
  async (req: Request, res: Response) => {
    const companies = await stocksService.listCompanies();

    res.json({
      data: companies,
      total: companies.length,
    });
  }
);
