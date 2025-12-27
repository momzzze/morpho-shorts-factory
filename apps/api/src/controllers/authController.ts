import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService.js';
import { asyncHandler } from '../asyncHandler.js';
import { validateRequest } from '../utils/validation.js';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3).max(30).optional(),
  displayName: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const authController = {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  register: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = validateRequest(registerSchema, req.body);

    const result = await AuthService.register(validatedData);

    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
    });
  }),

  /**
   * POST /api/auth/login
   * Login existing user
   */
  login: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = validateRequest(loginSchema, req.body);

    const result = await AuthService.login(validatedData);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  }),

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  me: asyncHandler(async (req: Request, res: Response) => {
    // User ID is attached by auth middleware
    const userId = (req as any).userId;

    const user = await AuthService.getUserById(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  }),
};
