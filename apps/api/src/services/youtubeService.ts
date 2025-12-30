import axios, { AxiosInstance } from 'axios';
import ytdl from '@distube/ytdl-core';
import { Readable } from 'stream';
import { env } from '../env.js';
import { logger } from '../logger.js';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  thumbnails: {
    default: string;
    medium: string;
    high: string;
  };
  publishedAt: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
}

export class YouTubeService {
  private apiClient: AxiosInstance;
  private apiKey: string;

  constructor() {
    if (!env.YOUTUBE_API_KEY) {
      logger.warn('YOUTUBE_API_KEY not configured');
      this.apiKey = '';
    } else {
      this.apiKey = env.YOUTUBE_API_KEY;
    }

    this.apiClient = axios.create({
      baseURL: 'https://www.googleapis.com/youtube/v3',
      params: {
        key: this.apiKey,
      },
    });

    logger.info('YouTube Service initialized');
  }

  /**
   * Search YouTube videos by keyword
   * @param query - Search query (e.g., "football raw footage", "soccer training")
   * @param maxResults - Number of results (default: 10, max: 50)
   * @param videoDuration - Filter by duration: any, short, medium, long
   */
  async searchVideos(
    query: string,
    maxResults: number = 10,
    videoDuration: 'any' | 'short' | 'medium' | 'long' = 'any'
  ): Promise<YouTubeSearchResult[]> {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key not configured');
      }

      logger.info(
        { query, maxResults, videoDuration },
        'Searching YouTube videos'
      );

      const response = await this.apiClient.get('/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults,
          videoDuration,
          order: 'relevance',
        },
      });

      const videos: YouTubeSearchResult[] = response.data.items.map(
        (item: any) => ({
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          thumbnailUrl:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
        })
      );

      logger.info(
        { query, resultsCount: videos.length },
        'YouTube search completed'
      );

      return videos;
    } catch (error: any) {
      logger.error(
        {
          error: error.message || error,
          query,
          responseData: error.response?.data,
        },
        'Failed to search YouTube videos'
      );
      throw error;
    }
  }

  /**
   * Get detailed video information
   * @param videoId - YouTube video ID
   */
  async getVideoDetails(videoId: string): Promise<YouTubeVideo> {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key not configured');
      }

      logger.info({ videoId }, 'Fetching YouTube video details');

      const response = await this.apiClient.get('/videos', {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
        },
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];

      const videoInfo: YouTubeVideo = {
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        thumbnails: {
          default: video.snippet.thumbnails.default.url,
          medium: video.snippet.thumbnails.medium.url,
          high: video.snippet.thumbnails.high.url,
        },
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        viewCount: parseInt(video.statistics.viewCount || '0'),
        likeCount: parseInt(video.statistics.likeCount || '0'),
        commentCount: parseInt(video.statistics.commentCount || '0'),
      };

      logger.info(
        { videoId, title: videoInfo.title },
        'Successfully fetched video details'
      );

      return videoInfo;
    } catch (error: any) {
      logger.error(
        {
          error: error.message || error,
          videoId,
        },
        'Failed to fetch video details'
      );
      throw error;
    }
  }

  /**
   * Get video stream for downloading
   * @param videoUrl - YouTube video URL or ID
   * @returns Stream and video info
   */
  async getVideoStream(
    videoUrl: string
  ): Promise<{ stream: Readable; videoInfo: ytdl.videoInfo }> {
    try {
      logger.info({ videoUrl }, 'Getting YouTube video stream');

      // Get video info first
      const info = await ytdl.getInfo(videoUrl);

      // Get best quality video+audio format
      const stream = ytdl(videoUrl, {
        quality: 'highestvideo',
        filter: 'audioandvideo',
      });

      logger.info(
        {
          videoId: info.videoDetails.videoId,
          title: info.videoDetails.title,
        },
        'Successfully got video stream'
      );

      return { stream, videoInfo: info };
    } catch (error: any) {
      logger.error(
        {
          error: error.message || error,
          stack: error.stack,
          videoUrl,
        },
        'Failed to get video stream'
      );
      throw error;
    }
  }

  /**
   * Search for raw footage videos
   * @param niche - Niche/topic (e.g., "football", "basketball")
   * @param count - Number of results
   */
  async searchRawFootage(
    niche: string,
    count: number = 10
  ): Promise<YouTubeSearchResult[]> {
    const queries = [
      `${niche} raw footage`,
      `${niche} unedited footage`,
      `${niche} practice footage`,
      `${niche} training footage`,
    ];

    logger.info({ niche, count }, 'Searching for raw footage');

    // Search with multiple queries and combine results
    const allResults: YouTubeSearchResult[] = [];

    for (const query of queries) {
      try {
        const results = await this.searchVideos(
          query,
          Math.ceil(count / queries.length),
          'medium'
        );
        allResults.push(...results);
      } catch (error) {
        logger.warn(
          { query, error },
          'Failed to search with query, continuing...'
        );
      }
    }

    // Remove duplicates and limit to count
    const uniqueVideos = Array.from(
      new Map(allResults.map((v) => [v.videoId, v])).values()
    ).slice(0, count);

    logger.info(
      { niche, resultsCount: uniqueVideos.length },
      'Raw footage search completed'
    );

    return uniqueVideos;
  }
}

export const youtubeService = new YouTubeService();
