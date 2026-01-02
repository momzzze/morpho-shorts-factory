/**
 * Company Service - Example with Redis Caching
 *
 * This demonstrates how to integrate caching with your services:
 * - Get-or-set pattern for database queries
 * - Cache invalidation on updates
 * - Pattern-based cache clearing
 */

import { prisma } from '../lib/prisma.js';
import { cacheService } from './cacheService.js';
import { logger } from '../logger.js';
import { ApiError } from '../errors.js';

export const companyService = {
  /**
   * Get company by ticker with caching
   * Cache miss → fetch from DB → cache for 1 hour
   */
  async getCompanyByTicker(ticker: string) {
    const cacheKey = `company:${ticker.toUpperCase()}:info`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const company = await prisma.company.findUnique({
          where: { ticker: ticker.toUpperCase() },
          include: {
            fundamentals: {
              orderBy: { periodEnd: 'desc' },
              take: 1,
            },
          },
        });

        if (!company) {
          throw new ApiError('Company not found', {
            statusCode: 404,
            code: 'COMPANY_NOT_FOUND',
            details: { ticker },
          });
        }

        return company;
      },
      3600 // 1 hour
    );
  },

  /**
   * Get company by CIK (SEC identifier) with caching
   * Useful for SEC data lookups
   */
  async getCompanyByCIK(cik: string) {
    const normalizedCIK = cik.padStart(10, '0');
    const cacheKey = `company:cik:${normalizedCIK}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const company = await prisma.company.findUnique({
          where: { cik: normalizedCIK },
        });

        if (!company) {
          throw new ApiError('Company not found', {
            statusCode: 404,
            code: 'COMPANY_NOT_FOUND',
            details: { cik },
          });
        }

        return company;
      },
      86400 // 24 hours (CIK doesn't change often)
    );
  },

  /**
   * Create new company (no caching - fresh data)
   */
  async createCompany(data: {
    ticker: string;
    cik: string;
    name?: string;
    sic?: string;
  }) {
    const company = await prisma.company.create({
      data: {
        ticker: data.ticker.toUpperCase(),
        cik: data.cik.padStart(10, '0'),
        name: data.name,
        sic: data.sic,
      },
    });

    logger.info({ ticker: company.ticker }, 'Company created');
    return company;
  },

  /**
   * Update company - invalidate cache after update
   */
  async updateCompany(
    ticker: string,
    data: {
      name?: string;
      sic?: string;
    }
  ) {
    const company = await prisma.company.update({
      where: { ticker: ticker.toUpperCase() },
      data,
    });

    // Invalidate related caches
    const cacheKey = `company:${ticker.toUpperCase()}:info`;
    await cacheService.invalidate(cacheKey);
    await cacheService.invalidate(`company:cik:${company.cik}`);

    logger.info(
      { ticker: company.ticker },
      'Company updated, cache invalidated'
    );
    return company;
  },

  /**
   * Get fundamentals with caching
   * Different cache based on period type
   */
  async getFundamentals(
    companyId: string,
    periodType: 'annual' | 'quarter' | 'ttm',
    limit = 10
  ) {
    const cacheKey = `fundamentals:${companyId}:${periodType}:latest-${limit}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const fundamentals = await prisma.fundamentalsSnapshot.findMany({
          where: {
            companyId,
            periodType,
          },
          orderBy: { periodEnd: 'desc' },
          take: limit,
        });

        if (fundamentals.length === 0) {
          throw new ApiError('No fundamentals found', {
            statusCode: 404,
            code: 'FUNDAMENTALS_NOT_FOUND',
            details: { companyId, periodType },
          });
        }

        return fundamentals;
      },
      3600 // 1 hour - fundamentals update regularly
    );
  },

  /**
   * Sync fundamentals from SEC
   * Invalidate cache after successful sync
   */
  async syncFundamentals(companyId: string, fundamentals: any[]) {
    try {
      // Upsert all fundamentals
      const results = await Promise.all(
        fundamentals.map((fund) =>
          prisma.fundamentalsSnapshot.upsert({
            where: {
              companyId_periodType_periodEnd: {
                companyId,
                periodType: fund.periodType,
                periodEnd: new Date(fund.periodEnd),
              },
            },
            update: fund,
            create: { companyId, ...fund },
          })
        )
      );

      // Invalidate all fundamentals caches for this company
      await cacheService.invalidatePattern(`fundamentals:${companyId}:*`);

      logger.info(
        { companyId, count: results.length },
        'Fundamentals synced and cache invalidated'
      );

      return results;
    } catch (error) {
      logger.error({ error, companyId }, 'Failed to sync fundamentals');
      throw error;
    }
  },

  /**
   * Bulk invalidate company cache (for admin operations)
   */
  async clearCompanyCache(ticker?: string) {
    if (ticker) {
      // Clear specific company
      await cacheService.invalidatePattern(`company:${ticker.toUpperCase()}:*`);
      await cacheService.invalidatePattern(`fundamentals:*:*`);
      logger.info({ ticker }, 'Company cache cleared');
    } else {
      // Clear all company caches
      await cacheService.invalidatePattern('company:*');
      await cacheService.invalidatePattern('fundamentals:*');
      logger.info('All company caches cleared');
    }
  },
};

export default companyService;
