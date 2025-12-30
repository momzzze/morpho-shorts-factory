import { Request, Response } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { ApiError } from '../errors.js';
import { tiktokAPIService } from '../services/tiktokAPIService.js';
import { tiktokScraperService } from '../services/tiktokScraperService.js';
import { youtubeService } from '../services/youtubeService.js';
import { gcsService } from '../services/gcsService.js';
import { logger } from '../logger.js';

/**
 * Test endpoint: Search and download top TikTok videos by niche
 * GET /api/test/tiktok/:niche?count=5
 */
export const testTikTokSearch = asyncHandler(
  async (req: Request, res: Response) => {
    const { niche } = req.params;
    const count = parseInt(req.query.count as string) || 5;

    if (!tiktokAPIService) {
      throw new ApiError(
        'TikTok API not configured. Set RAPIDAPI_KEY in .env',
        {
          statusCode: 500,
          code: 'API_NOT_CONFIGURED',
        }
      );
    }

    logger.info({ niche, count }, 'Testing TikTok search');

    // Search for top videos
    const topVideos = await tiktokAPIService.getTopVideosInNiche(niche, count);

    const results = topVideos.map((video) => ({
      id: video.aweme_id,
      url: `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.aweme_id}`,
      author: video.author?.nickname || 'Unknown',
      username: video.author?.unique_id || 'unknown',
      description: video.desc || '',
      likes: video.statistics?.digg_count || 0,
      views: video.statistics?.play_count || 0,
      comments: video.statistics?.comment_count || 0,
      shares: video.statistics?.share_count || 0,
    }));

    res.json({
      success: true,
      data: {
        niche,
        count: results.length,
        videos: results,
      },
    });
  }
);

/**
 * Test endpoint: Download a single TikTok video
 * POST /api/test/tiktok/download
 * Body: { tiktokUrl: string }
 */
export const testTikTokDownload = asyncHandler(
  async (req: Request, res: Response) => {
    const { tiktokUrl } = req.body;

    if (!tiktokUrl) {
      throw new ApiError('tiktokUrl is required', {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    logger.info({ tiktokUrl }, 'Testing TikTok download');

    // Get video info
    const videoInfo = await tiktokScraperService.getVideoInfo(tiktokUrl);

    res.json({
      success: true,
      data: {
        videoInfo,
        message: 'Video info retrieved successfully',
      },
    });
  }
);

/**
 * Test endpoint: Full workflow - Search, download, upload to GCS
 * POST /api/test/tiktok/full-workflow
 * Body: { niche: string, count?: number, username: string }
 */
export const testFullWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { niche, count = 5, username = 'testuser' } = req.body;

    if (!niche) {
      throw new ApiError('niche is required', {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    if (!tiktokAPIService) {
      throw new ApiError('TikTok API not configured', {
        statusCode: 500,
        code: 'API_NOT_CONFIGURED',
      });
    }

    logger.info({ niche, count, username }, 'Testing full workflow');

    // Step 0: Cleanup temp folder before downloading new videos
    if (gcsService) {
      try {
        const deletedCount = await gcsService.cleanupUserTemp(username);
        logger.info(
          { username, deletedCount },
          'Cleaned up temp folder before workflow'
        );
      } catch (error) {
        logger.warn(
          { error, username },
          'Failed to cleanup temp folder, continuing anyway'
        );
      }
    }

    // Step 1: Search for top videos
    const topVideos = await tiktokAPIService.getTopVideosInNiche(niche, count);
    logger.info(`Found ${topVideos.length} videos`);

    const uploadedVideos = [];

    // Step 2 & 3: Download and upload to GCS
    for (let i = 0; i < topVideos.length; i++) {
      const video = topVideos[i];
      const tiktokUrl = `https://www.tiktok.com/@${video.author.unique_id}/video/${video.aweme_id}`;

      try {
        logger.info({ index: i + 1, tiktokUrl }, 'Processing video');

        if (gcsService) {
          // Stream directly to GCS (no local storage)
          const { stream, videoInfo } =
            await tiktokScraperService.getVideoStream(tiktokUrl);
          let url = null;
          let gcsPath = null;
          const result = await gcsService.uploadScrapedVideoStream(
            username,
            stream,
            `video_${i + 1}.mp4`
          );
          url = result.url;
          gcsPath = result.gcsPath;
          uploadedVideos.push({
            index: i + 1,
            tiktokUrl,
            gcsUrl: url,
            gcsPath,
            videoInfo: {
              title: videoInfo.title,
              author: videoInfo.author,
              likes: videoInfo.likes,
              views: videoInfo.views,
            },
          });

          logger.info({ gcsUrl: url }, 'Video uploaded to GCS');
        } else {
          // Just get video info if GCS not configured
          const videoInfo = await tiktokScraperService.getVideoInfo(tiktokUrl);

          uploadedVideos.push({
            index: i + 1,
            tiktokUrl,
            message: 'GCS not configured - video info only',
            videoInfo: {
              title: videoInfo.title,
              author: videoInfo.author,
              likes: videoInfo.likes,
              views: videoInfo.views,
            },
          });
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error({ error, tiktokUrl }, 'Failed to process video');
        uploadedVideos.push({
          index: i + 1,
          tiktokUrl,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    res.json({
      success: true,
      data: {
        niche,
        totalFound: topVideos.length,
        processed: uploadedVideos.length,
        videos: uploadedVideos,
      },
    });
  }
);

/**
 * Test endpoint: Search YouTube videos
 * GET /api/test/youtube/:query?count=10
 */
export const testYouTubeSearch = asyncHandler(
  async (req: Request, res: Response) => {
    const { query } = req.params;
    const count = parseInt(req.query.count as string) || 10;

    logger.info({ query, count }, 'Testing YouTube search');

    const videos = await youtubeService.searchVideos(query, count);

    res.json({
      success: true,
      data: {
        query,
        count: videos.length,
        videos: videos.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          description: v.description.substring(0, 100) + '...',
          channel: v.channelTitle,
          thumbnail: v.thumbnailUrl,
          publishedAt: v.publishedAt,
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
        })),
      },
    });
  }
);

/**
 * Test endpoint: Search raw footage on YouTube
 * GET /api/test/youtube/raw/:niche?count=10
 */
export const testYouTubeRawFootage = asyncHandler(
  async (req: Request, res: Response) => {
    const { niche } = req.params;
    const count = parseInt(req.query.count as string) || 10;

    logger.info({ niche, count }, 'Testing YouTube raw footage search');

    const videos = await youtubeService.searchRawFootage(niche, count);

    res.json({
      success: true,
      data: {
        niche,
        count: videos.length,
        videos: videos.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          description: v.description.substring(0, 100) + '...',
          channel: v.channelTitle,
          thumbnail: v.thumbnailUrl,
          publishedAt: v.publishedAt,
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
        })),
      },
    });
  }
);

/**
 * Test endpoint: Download YouTube video
 * POST /api/test/youtube/download
 * Body: { videoId: string, username: string }
 */
export const testYouTubeDownload = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId, username = 'testuser' } = req.body;

    if (!videoId) {
      throw new ApiError('Missing videoId', {
        statusCode: 400,
        code: 'MISSING_VIDEO_ID',
      });
    }

    logger.info({ videoId, username }, 'Testing YouTube video download');

    // Get video stream
    const { stream, videoInfo } = await youtubeService.getVideoStream(
      `https://www.youtube.com/watch?v=${videoId}`
    );

    // Upload to GCS
    const fileName = `youtube_${videoId}_${Date.now()}.mp4`;
    let gcsPath = null;
    if (gcsService) {
      gcsPath = await gcsService.uploadScrapedVideoStream(
        username,
        stream,
        fileName
      );
    }

    res.json({
      success: true,
      data: {
        videoId,
        title: videoInfo.videoDetails.title,
        author: videoInfo.videoDetails.author.name,
        duration: videoInfo.videoDetails.lengthSeconds,
        gcsPath,
      },
    });
  }
);

/**
 * Test endpoint: Full YouTube workflow
 * POST /api/test/youtube/full-workflow
 * Body: { niche: string, count: number, username: string }
 */
export const testYouTubeFullWorkflow = asyncHandler(
  async (req: Request, res: Response) => {
    const { niche, count = 3, username = 'testuser' } = req.body;

    if (!niche) {
      throw new ApiError('Missing niche parameter', {
        statusCode: 400,
        code: 'MISSING_NICHE',
      });
    }

    logger.info({ niche, count, username }, 'Testing YouTube full workflow');

    // 0. Cleanup temp folder before downloading new videos
    if (gcsService) {
      try {
        const deletedCount = await gcsService.cleanupUserTemp(username);
        logger.info(
          { username, deletedCount },
          'Cleaned up temp folder before workflow'
        );
      } catch (error) {
        logger.warn(
          { error, username },
          'Failed to cleanup temp folder, continuing anyway'
        );
      }
    }

    // 1. Search for raw footage
    const videos = await youtubeService.searchRawFootage(niche, count);

    if (videos.length === 0) {
      throw new ApiError('No videos found', {
        statusCode: 404,
        code: 'NO_VIDEOS_FOUND',
      });
    }

    logger.info(
      { niche, foundCount: videos.length },
      'Found videos, starting downloads'
    );

    // 2. Download and upload videos
    const uploadedVideos = [];

    for (const video of videos.slice(0, count)) {
      try {
        logger.info(
          { videoId: video.videoId, title: video.title },
          'Downloading video'
        );

        const { stream, videoInfo } = await youtubeService.getVideoStream(
          `https://www.youtube.com/watch?v=${video.videoId}`
        );

        const fileName = `youtube_${video.videoId}_${Date.now()}.mp4`;
        let gcsPath = null;
        if (gcsService) {
          gcsPath = await gcsService.uploadScrapedVideoStream(
            username,
            stream,
            fileName
          );
        }

        uploadedVideos.push({
          videoId: video.videoId,
          title: videoInfo.videoDetails.title,
          author: videoInfo.videoDetails.author.name,
          duration: videoInfo.videoDetails.lengthSeconds,
          gcsPath,
        });

        // Add delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        logger.error(
          {
            videoId: video.videoId,
            error: error.message,
          },
          'Failed to download video, skipping'
        );
      }
    }

    res.json({
      success: true,
      data: {
        niche,
        totalFound: videos.length,
        processed: uploadedVideos.length,
        videos: uploadedVideos,
      },
    });
  }
);
