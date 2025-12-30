import Router from 'express';
import * as testController from '../../controllers/testController.js';

const router = Router();

// TikTok test endpoints
router.get('/tiktok/:niche', testController.testTikTokSearch);
router.post('/tiktok/download', testController.testTikTokDownload);
router.post('/tiktok/full-workflow', testController.testFullWorkflow);

// YouTube test endpoints
router.get('/youtube/:query', testController.testYouTubeSearch);
router.get('/youtube/raw/:niche', testController.testYouTubeRawFootage);
router.post('/youtube/download', testController.testYouTubeDownload);
router.post('/youtube/full-workflow', testController.testYouTubeFullWorkflow);

export default router;
