// ==============================================================================
// Message Controller - Handles HTTP requests for messaging
// ==============================================================================

import { Request, Response } from 'express';
import { messageService } from '../services/messageService.js';

export class MessageController {
  async sendTask(req: Request, res: Response): Promise<void> {
    try {
      const { taskId, userId, type, payload } = req.body;

      if (!taskId || !userId || !type) {
        res.status(400).json({
          error: 'Missing required fields: taskId, userId, type',
        });
        return;
      }

      await messageService.sendTaskCreated({
        taskId,
        userId,
        type,
        payload: payload || {},
      });

      res.status(200).json({
        success: true,
        message: 'Task message sent to RabbitMQ',
        taskId,
      });
    } catch (error) {
      console.error('Error sending task message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async sendVideo(req: Request, res: Response): Promise<void> {
    try {
      const { videoId, userId, url, metadata } = req.body;

      if (!videoId || !userId || !url) {
        res.status(400).json({
          error: 'Missing required fields: videoId, userId, url',
        });
        return;
      }

      await messageService.sendVideoUpload({
        videoId,
        userId,
        url,
        metadata,
      });

      res.status(200).json({
        success: true,
        message: 'Video upload message sent to RabbitMQ',
        videoId,
      });
    } catch (error) {
      console.error('Error sending video message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async sendThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { thumbnailId, videoId, userId, timestamp, size } = req.body;

      if (!thumbnailId || !videoId || !userId || timestamp === undefined) {
        res.status(400).json({
          error:
            'Missing required fields: thumbnailId, videoId, userId, timestamp',
        });
        return;
      }

      await messageService.sendThumbnailGeneration({
        thumbnailId,
        videoId,
        userId,
        timestamp,
        size,
      });

      res.status(200).json({
        success: true,
        message: 'Thumbnail generation message sent to RabbitMQ',
        thumbnailId,
      });
    } catch (error) {
      console.error('Error sending thumbnail message:', error);
      res.status(500).json({
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export a singleton instance
export const messageController = new MessageController();
