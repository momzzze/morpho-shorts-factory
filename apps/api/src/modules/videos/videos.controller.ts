import { Request, Response } from 'express';
import { videoService } from '../../services/videoService.js';
import { ApiError } from '../../errors.js';
import { VideoStatus } from '@prisma/client';
import { asyncHandler } from '../../asyncHandler.js';

export const getUserVideos = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const videos = await videoService.getUserVideos(userId);

    res.json({
      success: true,
      data: videos,
    });
  }
);

export const getVideoById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    const video = await videoService.getVideoById(id, userId);

    res.json({
      success: true,
      data: video,
    });
  }
);

export const createVideo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { title, description, niche, sourceVideos } = req.body;

  if (!title || !niche) {
    throw new ApiError('Title and niche are required', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    });
  }

  const video = await videoService.createVideo({
    userId,
    title,
    description,
    niche,
    sourceVideos,
  });

  res.status(201).json({
    success: true,
    data: video,
  });
});

export const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const updates = req.body;
  const video = await videoService.updateVideo(id, userId, updates);

  res.json({
    success: true,
    data: video,
  });
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  await videoService.deleteVideo(id, userId);

  res.json({
    success: true,
    message: 'Video deleted successfully',
  });
});

export const getVideosByNiche = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { niche } = req.params;
    const videos = await videoService.getVideosByNiche(userId, niche);

    res.json({
      success: true,
      data: videos,
    });
  }
);

export const getVideosByStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { status } = req.params;

    if (!Object.values(VideoStatus).includes(status as VideoStatus)) {
      throw new ApiError('Invalid video status', {
        statusCode: 400,
        code: 'INVALID_STATUS',
      });
    }

    const videos = await videoService.getVideosByStatus(
      userId,
      status as VideoStatus
    );

    res.json({
      success: true,
      data: videos,
    });
  }
);

export const getStorageUsage = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId!;
    const usageBytes = await videoService.getUserStorageUsage(userId);
    const usageMB = Math.round(usageBytes / 1024 / 1024);

    res.json({
      success: true,
      data: {
        usageBytes,
        usageMB,
        usageGB: (usageMB / 1024).toFixed(2),
      },
    });
  }
);
