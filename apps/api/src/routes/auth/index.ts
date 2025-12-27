import { Router } from 'express';
import { authController } from '../../controllers/authController.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user account
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Protected route - requires JWT token
 */
router.get('/me', authenticate, authController.me);

export default router;
