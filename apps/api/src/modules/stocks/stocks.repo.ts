/**
 * Stocks Repository - Database Access Layer
 */

import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

export const stocksRepo = {
  /**
   * Find company by ticker
   */
  async findByTicker(ticker: string) {
    return prisma.company.findUnique({
      where: { ticker },
    });
  },

  /**
   * Create new company
   */
  async createCompany(data: {
    ticker: string;
    cik: string;
    name: string;
    sic?: string;
  }) {
    return prisma.company.create({
      data,
    });
  },

  /**
   * Get fundamentals snapshots for a company
   */
  async getFundamentals(
    companyId: string,
    period: 'ttm' | 'annual' | 'quarter',
    limit: number
  ) {
    const where: Prisma.FundamentalsSnapshotWhereInput = {
      companyId,
    };

    // Filter by period if not TTM
    if (period !== 'ttm') {
      where.periodType = period;
    }

    return prisma.fundamentalsSnapshot.findMany({
      where,
      orderBy: { periodEnd: 'desc' },
      take: limit,
      include: {
        company: {
          select: {
            ticker: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Upsert fundamentals snapshot
   */
  async upsertFundamentals(data: {
    companyId: string;
    periodType: string;
    periodEnd: Date;
    revenue?: number;
    netIncome?: number;
    assets?: number;
    liabilities?: number;
    equity?: number;
    cfo?: number;
  }) {
    return prisma.fundamentalsSnapshot.upsert({
      where: {
        companyId_periodType_periodEnd: {
          companyId: data.companyId,
          periodType: data.periodType,
          periodEnd: data.periodEnd,
        },
      },
      update: {
        revenue: data.revenue,
        netIncome: data.netIncome,
        assets: data.assets,
        liabilities: data.liabilities,
        equity: data.equity,
        cfo: data.cfo,
      },
      create: {
        ...data,
        source: 'SEC',
      },
    });
  },

  /**
   * Run screener query
   */
  async runScreener(filters: Record<string, any>, limit: number) {
    // Build dynamic where clause
    const where: any = {};

    // Note: This is simplified - you'd need to compute metrics first
    // For now, we'll return latest snapshots with basic filtering

    return prisma.fundamentalsSnapshot.findMany({
      where,
      orderBy: { periodEnd: 'desc' },
      distinct: ['companyId'],
      take: limit,
      include: {
        company: {
          select: {
            ticker: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Create job run
   */
  async createJobRun(data: { key: string; jobType: string }) {
    return prisma.jobRun.create({
      data: {
        key: data.key,
        jobType: data.jobType,
        status: 'queued',
        startedAt: new Date(),
      },
    });
  },

  /**
   * Update job run
   */
  async updateJobRun(id: string, data: { status: string; error?: string }) {
    return prisma.jobRun.update({
      where: { id },
      data: {
        status: data.status,
        error: data.error,
        endedAt:
          data.status === 'success' || data.status === 'failed'
            ? new Date()
            : undefined,
      },
    });
  },

  /**
   * Get job run
   */
  async getJobRun(id: string) {
    return prisma.jobRun.findUnique({
      where: { id },
    });
  },
};
