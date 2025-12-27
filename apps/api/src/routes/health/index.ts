import { Router } from 'express';
import { asyncHandler } from '../../asyncHandler.js';
import { logger } from '../../logger.js';
import { prisma } from '../../lib/prisma.js';

export const healthRouter = Router();

// liveness: process is up
healthRouter.get(
  '/live',
  asyncHandler(async (req, res) => {
    res.json({ status: 'ok', requestId: (req as any).requestId });
  })
);

// readiness: dependencies (database, etc.)
healthRouter.get(
  '/ready',
  asyncHandler(async (req, res) => {
    logger.debug({ requestId: (req as any).requestId }, 'Readiness check');

    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      res.json({
        status: 'ready',
        checks: {
          database: 'connected',
        },
        requestId: (req as any).requestId,
      });
    } catch (error) {
      logger.error(
        { error, requestId: (req as any).requestId },
        'Readiness check failed'
      );
      res.status(503).json({
        status: 'not_ready',
        checks: {
          database: 'disconnected',
        },
        requestId: (req as any).requestId,
      });
    }
  })
);
