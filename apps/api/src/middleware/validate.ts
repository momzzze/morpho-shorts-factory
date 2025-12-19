import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../errors.js';

export const validateBody =
  <T extends ZodTypeAny>(schema: T) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(
        new ApiError('Invalid request body', {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          details: result.error.flatten(),
        })
      );
    }

    // Replace body with parsed + typed data
    req.body = result.data;
    next();
  };

export const validateQuery =
  <T extends ZodTypeAny>(schema: T) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return next(
        new ApiError('Invalid query parameters', {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          details: result.error.flatten(),
        })
      );
    }

    req.query = result.data as any;
    next();
  };
