import Router from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as videoController from '../../controllers/videoController.js';

const router = Router();

// All video routes require authentication
router.use(authenticate);

// Get user's storage usage
router.get('/storage/usage', videoController.getStorageUsage);

// Get all user's videos
router.get('/', videoController.getUserVideos);

// Get videos by status
router.get('/status/:status', videoController.getVideosByStatus);

// Get videos by niche
router.get('/niche/:niche', videoController.getVideosByNiche);

// Create new video
router.post('/', videoController.createVideo);

// Get specific video
router.get('/:id', videoController.getVideoById);

// Update video
router.patch('/:id', videoController.updateVideo);

// Delete video
router.delete('/:id', videoController.deleteVideo);

export default router;
