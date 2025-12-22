// ==============================================================================
// Messages Routes - Routes for sending messages to RabbitMQ
// ==============================================================================

import { Router } from 'express';
import { messageController } from '../../controllers/messageController.js';
import { asyncHandler } from '../../asyncHandler.js';

const router = Router();

// Send task message
router.post(
  '/task',
  asyncHandler(messageController.sendTask.bind(messageController))
);

// Send video upload message
router.post(
  '/video',
  asyncHandler(messageController.sendVideo.bind(messageController))
);

// Send thumbnail generation message
router.post(
  '/thumbnail',
  asyncHandler(messageController.sendThumbnail.bind(messageController))
);

export default router;
