import { Router } from 'express';
import { messageController } from './messages.controller.js';
import { asyncHandler } from '../../asyncHandler.js';
import type { ApiModule } from '../module.types.js';

const router = Router();

// POST /api/v1/messages/task
router.post(
  '/task',
  asyncHandler(messageController.sendTask.bind(messageController))
);

// POST /api/v1/messages/video
router.post(
  '/video',
  asyncHandler(messageController.sendVideo.bind(messageController))
);

// POST /api/v1/messages/thumbnail
router.post(
  '/thumbnail',
  asyncHandler(messageController.sendThumbnail.bind(messageController))
);

export const messagesModule: ApiModule = {
  name: 'messages',
  basePath: '/messages',
  router,
};
