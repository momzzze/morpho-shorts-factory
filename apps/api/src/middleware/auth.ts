import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { ApiError } from '../errors.js';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT tokens
 * Expects: Authorization: Bearer <token>
 * Attaches userId to req.userId if valid
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError('Authentication required', {
        statusCode: 401,
        code: 'NO_TOKEN',
      });
    }

    // Check Bearer format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError('Invalid token format. Use: Bearer <token>', {
        statusCode: 401,
        code: 'INVALID_TOKEN_FORMAT',
      });
    }

    const token = parts[1];

    // Verify token and extract userId
    const { userId } = AuthService.verifyToken(token);

    // Attach userId to request object
    req.userId = userId;

    next();
  } catch (error) {
    // If it's already an ApiError, pass it through
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    // Otherwise create a generic auth error
    next(
      new ApiError('Authentication failed', {
        statusCode: 401,
        code: 'AUTH_FAILED',
      })
    );
  }
};

/**
 * Optional authentication middleware
 * Attaches userId if token is valid, but doesn't fail if no token
 * Useful for routes that can work for both authenticated and guest users
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const { userId } = AuthService.verifyToken(token);
      req.userId = userId;
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
