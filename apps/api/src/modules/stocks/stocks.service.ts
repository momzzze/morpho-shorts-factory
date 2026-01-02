/**
 * Stocks Service - SIMPLIFIED VERSION WITH DATABASE STORAGE
 * Fetch from SEC API and save to database for viewing in Prisma Studio
 */

import { logger } from '../../logger.js';
import { ApiError } from '../../errors.js';
import { secAdapter } from '../../adapters/secAdapter.js';
import { prisma } from '../../lib/prisma.js';

export const stocksService = {
  /**
   * Get company info - just fetch from SEC, no database
   */
  async getCompanyInfo(ticker: string) {
    const normalizedTicker = ticker.toUpperCase();

    // Resolve ticker to CIK via SEC
    const cik = await secAdapter.tickerToCIK(normalizedTicker);
    if (!cik) {
      throw new ApiError(`Ticker ${ticker} not found`, {
        statusCode: 404,
        code: 'TICKER_NOT_FOUND',
      });
    }

    // Get basic company facts
    const facts = await secAdapter.getCompanyFacts(cik, false);

    return {
      ticker: normalizedTicker,
      cik,
      name: facts?.entityName || normalizedTicker,
    };
  },

  /**
   * Get fundamentals - fetch from SEC API and SAVE TO DATABASE
   */
  async getFundamentals(ticker: string) {
    const normalizedTicker = ticker.toUpperCase();

    // Get CIK first
    const cik = await secAdapter.tickerToCIK(normalizedTicker);
    if (!cik) {
      throw new ApiError(`Ticker ${ticker} not found`, {
        statusCode: 404,
        code: 'TICKER_NOT_FOUND',
      });
    }

    // Fetch company facts from SEC
    const facts = await secAdapter.getCompanyFacts(cik, false);
    if (!facts) {
      throw new ApiError(`No data found for ${ticker}`, {
        statusCode: 404,
        code: 'NO_DATA',
      });
    }

    // Create or update company in database
    const company = await prisma.company.upsert({
      where: { ticker: normalizedTicker },
      update: {
        name: facts.entityName,
        updatedAt: new Date(),
      },
      create: {
        ticker: normalizedTicker,
        cik,
        name: facts.entityName,
      },
    });

    // Parse fundamentals into clean format
    const parsed = secAdapter.parseFundamentals(facts);

    // Save fundamentals to database
    const saved = [];
    for (const period of parsed) {
      const snapshot = await prisma.fundamentalsSnapshot.upsert({
        where: {
          companyId_periodType_periodEnd: {
            companyId: company.id,
            periodType: period.periodType,
            periodEnd: period.periodEnd,
          },
        },
        update: {
          revenue: period.revenue,
          netIncome: period.netIncome,
          assets: period.assets,
          liabilities: period.liabilities,
          equity: period.equity,
          cfo: period.cfo,
          source: 'SEC',
        },
        create: {
          companyId: company.id,
          periodType: period.periodType,
          periodEnd: period.periodEnd,
          revenue: period.revenue,
          netIncome: period.netIncome,
          assets: period.assets,
          liabilities: period.liabilities,
          equity: period.equity,
          cfo: period.cfo,
          source: 'SEC',
        },
      });
      saved.push(snapshot);
    }

    logger.info(
      { ticker: normalizedTicker, cik, saved: saved.length },
      'Saved fundamentals to database'
    );

    return {
      ticker: normalizedTicker,
      cik,
      name: facts.entityName,
      fundamentals: saved,
      message: `Saved ${saved.length} periods to database`,
    };
  },

  /**
   * Get saved fundamentals from database
   */
  async getSavedFundamentals(ticker: string) {
    const normalizedTicker = ticker.toUpperCase();

    const company = await prisma.company.findUnique({
      where: { ticker: normalizedTicker },
      include: {
        fundamentals: {
          orderBy: { periodEnd: 'desc' },
        },
      },
    });

    if (!company) {
      throw new ApiError(`No data saved for ${ticker}`, {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }

    return {
      ticker: company.ticker,
      name: company.name,
      cik: company.cik,
      fundamentals: company.fundamentals,
      totalPeriods: company.fundamentals.length,
    };
  },

  /**
   * List all companies with saved data
   */
  async listCompanies() {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { fundamentals: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return companies.map((c) => ({
      ticker: c.ticker,
      name: c.name,
      cik: c.cik,
      savedPeriods: c._count.fundamentals,
      lastUpdated: c.updatedAt,
    }));
  },
};
