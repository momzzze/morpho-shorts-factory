import { prisma } from '../lib/prisma.js';
import { VideoStatus } from '@prisma/client';
import { logger } from '../logger.js';

export interface CreateVideoInput {
  userId: string;
  title: string;
  description?: string;
  niche: string;
  sourceVideos?: any[];
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
  status?: VideoStatus;
  outputUrl?: string;
  gcsPath?: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  error?: string;
  progress?: number;
  completedAt?: Date;
}

export class VideoService {
  /**
   * Get all videos for a user
   */
  async getUserVideos(userId: string) {
    return prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        outputUrl: true,
        thumbnailUrl: true,
        duration: true,
        createdAt: true,
        updatedAt: true,
        completedAt: true,
      },
    });
  }

  /**
   * Get a specific video by ID
   */
  async getVideoById(videoId: string, userId: string) {
    const video = await prisma.video.findFirst({
      where: { id: videoId, userId },
    });

    if (!video) {
      throw new Error('Video not found');
    }

    return video;
  }

  /**
   * Create a new video compilation job
   */
  async createVideo(input: CreateVideoInput) {
    logger.info({ input }, 'Creating new video');

    const video = await prisma.video.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        niche: input.niche,
        status: 'PENDING',
        sourceUrl: '',
        sourceSize: 0,
        sourceVideos: input.sourceVideos
          ? JSON.stringify(input.sourceVideos)
          : undefined,
      },
    });

    logger.info({ videoId: video.id }, 'Video created successfully');

    return video;
  }

  /**
   * Update video details
   */
  async updateVideo(
    videoId: string,
    userId: string,
    updates: UpdateVideoInput
  ) {
    // Verify ownership
    await this.getVideoById(videoId, userId);

    const video = await prisma.video.update({
      where: { id: videoId },
      data: updates,
    });

    logger.info({ videoId, updates }, 'Video updated');

    return video;
  }

  /**
   * Delete a video
   */
  async deleteVideo(videoId: string, userId: string) {
    // Verify ownership
    await this.getVideoById(videoId, userId);

    await prisma.video.delete({
      where: { id: videoId },
    });

    logger.info({ videoId }, 'Video deleted');
  }

  /**
   * Update video processing status
   */
  async updateVideoStatus(
    videoId: string,
    status: VideoStatus,
    options?: {
      progress?: number;
      error?: string;
      outputUrl?: string;
      gcsPath?: string;
    }
  ) {
    const updates: any = { status };

    if (options?.progress !== undefined) {
      updates.progress = options.progress;
    }
    if (options?.error) {
      updates.error = options.error;
    }
    if (options?.outputUrl) {
      updates.outputUrl = options.outputUrl;
    }
    if (options?.gcsPath) {
      updates.gcsPath = options.gcsPath;
    }
    if (status === 'COMPLETED') {
      updates.completedAt = new Date();
    }

    return prisma.video.update({
      where: { id: videoId },
      data: updates,
    });
  }

  /**
   * Get videos by niche
   */
  async getVideosByNiche(userId: string, niche: string) {
    return prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get videos by status
   */
  async getVideosByStatus(userId: string, status: VideoStatus) {
    return prisma.video.findMany({
      where: { userId, status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's storage usage (sum of video sizes)
   */
  async getUserStorageUsage(userId: string): Promise<number> {
    const result = await prisma.video.aggregate({
      where: { userId },
      _sum: { sourceSize: true },
    });

    return Number(result._sum.sourceSize || 0);
  }
}

export const videoService = new VideoService();
