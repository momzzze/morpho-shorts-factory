import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import type { ApiModule } from '../module.types.js';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', authController.register);

// POST /api/v1/auth/login
router.post('/login', authController.login);

// GET /api/v1/auth/me (protected)
router.get('/me', authenticate, authController.me);

export const authModule: ApiModule = {
  name: 'auth',
  basePath: '/auth',
  router,
};
