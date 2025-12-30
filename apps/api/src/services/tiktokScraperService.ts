import TikTokScraper from '@tobyg74/tiktok-api-dl';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { logger } from '../logger.js';

export interface TikTokVideoInfo {
  id?: string;
  url: string;
  title?: string;
  desc?: string;
  author?: string;
  authorUsername?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  views?: number;
  downloadUrl?: string;
  duration?: number;
  thumbnailUrl?: string;
  videoHD?: string;
  videoSD?: string;
  cover?: string;
  dynamicCover?: string;
  statistics?: {
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    playCount?: number;
  };
  authorObj?: {
    name?: string;
    nickname?: string;
    unique_id?: string;
  };
}

export class TikTokScraperService {
  /**
   * Get video information from TikTok URL
   */
  async getVideoInfo(tiktokUrl: string): Promise<TikTokVideoInfo> {
    try {
      logger.info({ tiktokUrl }, 'Fetching TikTok video info');

      const result = await TikTokScraper.Downloader(tiktokUrl, {
        version: 'v3',
      });

      if (result.status !== 'success' || !result.result) {
        throw new Error('Failed to fetch TikTok video info');
      }

      const video = result.result;

      // Log the entire result to see what's available
      logger.info(
        {
          fullResult: result,
          videoKeys: video ? Object.keys(video) : [],
        },
        'Full TikTok scraper result'
      );

      const videoInfo: TikTokVideoInfo = {
        id: (video as any).id ?? undefined,
        url: tiktokUrl,
        title: (video as any).title ?? (video as any).desc ?? undefined,
        desc: (video as any).desc ?? undefined,
        author:
          (video as any).author?.name ??
          (video as any).author?.nickname ??
          undefined,
        authorUsername: (video as any).author?.unique_id ?? undefined,
        likes: (video as any).statistics?.likeCount ?? undefined,
        comments: (video as any).statistics?.commentCount ?? undefined,
        shares: (video as any).statistics?.shareCount ?? undefined,
        views: (video as any).statistics?.playCount ?? undefined,
        downloadUrl:
          (video as any).videoHD ?? (video as any).videoSD ?? undefined,
        duration: (video as any).duration ?? undefined,
        thumbnailUrl:
          (video as any).cover ?? (video as any).dynamicCover ?? undefined,
        videoHD: (video as any).videoHD ?? undefined,
        videoSD: (video as any).videoSD ?? undefined,
        cover: (video as any).cover ?? undefined,
        dynamicCover: (video as any).dynamicCover ?? undefined,
        statistics: (video as any).statistics ?? undefined,
        authorObj: (video as any).author ?? undefined,
      };

      logger.info(
        { id: videoInfo.id, title: videoInfo.title },
        'Successfully fetched TikTok video info'
      );

      return videoInfo;
    } catch (error) {
      logger.error({ error, tiktokUrl }, 'Failed to fetch TikTok video info');
      throw error;
    }
  }

  /**
   * Get video download stream (for direct upload to GCS without local storage)
   * @param tiktokUrl - TikTok video URL
   * @returns Stream and video info
   */
  async getVideoStream(
    tiktokUrl: string
  ): Promise<{ stream: Readable; videoInfo: TikTokVideoInfo }> {
    try {
      logger.info({ tiktokUrl }, 'Getting TikTok video stream');

      // Get video info first
      const videoInfo = await this.getVideoInfo(tiktokUrl);

      if (!videoInfo.downloadUrl) {
        throw new Error('No download URL available for this video');
      }

      logger.info(
        { downloadUrl: videoInfo.downloadUrl },
        'Fetching video stream from URL'
      );

      // Get video as stream
      const response = await axios.get(videoInfo.downloadUrl, {
        responseType: 'stream',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      logger.info({ tiktokUrl }, 'Successfully got video stream');

      return { stream: response.data, videoInfo };
    } catch (error: any) {
      logger.error(
        {
          error: error.message || error,
          stack: error.stack,
          tiktokUrl,
        },
        'Failed to get video stream'
      );
      throw error;
    }
  }

  /**
   * Download TikTok video to local file
   */
  async downloadVideo(
    tiktokUrl: string,
    outputPath: string
  ): Promise<{ filePath: string; videoInfo: TikTokVideoInfo }> {
    try {
      logger.info({ tiktokUrl, outputPath }, 'Downloading TikTok video');

      // Get video info first
      const videoInfo = await this.getVideoInfo(tiktokUrl);

      if (!videoInfo.downloadUrl) {
        throw new Error('No download URL available for this video');
      }

      // Ensure output directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Download video
      const response = await axios.get(videoInfo.downloadUrl, {
        responseType: 'stream',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      // Write to file
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      logger.info({ outputPath }, 'Successfully downloaded TikTok video');

      return { filePath: outputPath, videoInfo };
    } catch (error) {
      logger.error({ error, tiktokUrl }, 'Failed to download TikTok video');
      throw error;
    }
  }

  /**
   * Download multiple TikTok videos
   */
  async downloadMultipleVideos(
    tiktokUrls: string[],
    outputDir: string
  ): Promise<Array<{ filePath: string; videoInfo: TikTokVideoInfo }>> {
    const results: Array<{ filePath: string; videoInfo: TikTokVideoInfo }> = [];

    for (let i = 0; i < tiktokUrls.length; i++) {
      const url = tiktokUrls[i];
      const fileName = `video_${i + 1}.mp4`;
      const outputPath = path.join(outputDir, fileName);

      try {
        const result = await this.downloadVideo(url, outputPath);
        results.push(result);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error({ error, url }, 'Failed to download video, skipping');
        // Continue with next video
      }
    }

    logger.info(
      { total: tiktokUrls.length, downloaded: results.length },
      'Finished downloading TikTok videos'
    );

    return results;
  }

  /**
   * Search for trending TikTok videos by hashtag (mock - real search needs TikTok API)
   * For now, this is a placeholder. You'd need to integrate with TikTok's official API
   * or use a third-party service for real hashtag search
   */
  async searchByHashtag(hashtag: string, limit: number = 5): Promise<string[]> {
    // This is a placeholder
    // In production, you'd use:
    // 1. TikTok Official API (requires approval)
    // 2. Third-party APIs like RapidAPI's TikTok API
    // 3. Web scraping with Puppeteer/Playwright

    logger.warn(
      { hashtag },
      'Hashtag search not implemented - manual URLs required'
    );

    throw new Error(
      'Hashtag search requires TikTok API or third-party service integration'
    );
  }
}

export const tiktokScraperService = new TikTokScraperService();
