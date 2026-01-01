import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  getUserVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  getVideosByNiche,
  getVideosByStatus,
  getStorageUsage,
} from './videos.controller.js';
import type { ApiModule } from '../module.types.js';

const router = Router();

// All video routes require authentication
router.use(authenticate);

// GET /api/v1/videos/storage/usage
router.get('/storage/usage', getStorageUsage);

// GET /api/v1/videos
router.get('/', getUserVideos);

// GET /api/v1/videos/status/:status
router.get('/status/:status', getVideosByStatus);

// GET /api/v1/videos/niche/:niche
router.get('/niche/:niche', getVideosByNiche);

// POST /api/v1/videos
router.post('/', createVideo);

// GET /api/v1/videos/:id
router.get('/:id', getVideoById);

// PATCH /api/v1/videos/:id
router.patch('/:id', updateVideo);

// DELETE /api/v1/videos/:id
router.delete('/:id', deleteVideo);

export const videosModule: ApiModule = {
  name: 'videos',
  basePath: '/videos',
  router,
};
