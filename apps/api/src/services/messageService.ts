// ==============================================================================
// Message Service - Business logic for sending messages
// ==============================================================================

import { getProducer } from '../rabbitmq/setup.js';
import { logger } from '../logger.js';

class MessageService {
  async sendTaskCreated(taskData: {
    taskId: string;
    userId: string;
    type: string;
    payload: any;
  }): Promise<void> {
    const producer = getProducer();

    const message = {
      type: 'TASK_CREATED',
      taskId: taskData.taskId,
      userId: taskData.userId,
      taskType: taskData.type,
      payload: taskData.payload,
      createdAt: new Date().toISOString(),
    };

    await producer.sendMessage('task.created', message);
    logger.info({ taskId: taskData.taskId }, 'Task message sent to RabbitMQ');
  }

  async sendVideoUpload(videoData: {
    videoId: string;
    userId: string;
    url: string;
    metadata?: any;
  }): Promise<void> {
    const producer = getProducer();

    const message = {
      type: 'VIDEO_UPLOAD',
      videoId: videoData.videoId,
      userId: videoData.userId,
      url: videoData.url,
      metadata: videoData.metadata,
      createdAt: new Date().toISOString(),
    };

    await producer.sendMessage('video.upload', message);
    logger.info(
      { videoId: videoData.videoId },
      'Video upload message sent to RabbitMQ'
    );
  }

  async sendThumbnailGeneration(thumbnailData: {
    thumbnailId: string;
    videoId: string;
    userId: string;
    timestamp: number;
    size?: string;
  }): Promise<void> {
    const producer = getProducer();

    const message = {
      type: 'THUMBNAIL_GENERATION',
      thumbnailId: thumbnailData.thumbnailId,
      videoId: thumbnailData.videoId,
      userId: thumbnailData.userId,
      timestamp: thumbnailData.timestamp,
      size: thumbnailData.size || 'medium',
      createdAt: new Date().toISOString(),
    };

    await producer.sendMessage('thumbnail.created', message);
    logger.info(
      { thumbnailId: thumbnailData.thumbnailId },
      'Thumbnail generation message sent to RabbitMQ'
    );
  }
}

// Singleton instance
export const messageService = new MessageService();
