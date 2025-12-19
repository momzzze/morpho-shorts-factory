import { Router } from 'express';
import { asyncHandler } from '../../asyncHandler';
import { logger } from '../../logger';

export const healthRouter = Router();

// liveness: process is up
healthRouter.get(
  '/live',
  asyncHandler(async (req, res) => {
    res.json({ status: 'ok', requestId: (req as any).requestId });
  })
);

// readiness: dependencies
healthRouter.get(
  '/ready',
  asyncHandler(async (req, res) => {
    logger.debug({ requestId: (req as any).requestId }, 'Readiness check');
    res.json({ status: 'ok', requestId: (req as any).requestId });
  })
);
