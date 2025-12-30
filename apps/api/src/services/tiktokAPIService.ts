import axios, { AxiosInstance } from 'axios';
import { env } from '../env.js';
import { logger } from '../logger.js';

export interface TikTokSearchResult {
  aweme_id: string;
  video_id?: string;
  author: {
    unique_id: string;
    nickname: string;
  };
  desc: string;
  video: {
    play_addr: {
      url_list: string[];
    };
    cover: {
      url_list: string[];
    };
    duration: number;
  };
  statistics: {
    digg_count: number;
    comment_count: number;
    share_count: number;
    play_count: number;
  };
  stats?: {
    digg_count?: number;
    comment_count?: number;
    share_count?: number;
    play_count?: number;
  };
  create_time: number;
}

export interface TikTokUserPost {
  aweme_id: string;
  desc: string;
  video: {
    play_addr: {
      url_list: string[];
    };
    cover: {
      url_list: string[];
    };
    duration: number;
  };
  statistics: {
    digg_count: number;
    comment_count: number;
    share_count: number;
    play_count: number;
  };
  author: {
    unique_id: string;
    nickname: string;
  };
}

export class TikTokAPIService {
  private client: AxiosInstance;

  constructor() {
    if (!env.RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY is required in environment variables');
    }

    this.client = axios.create({
      baseURL: `https://${env.RAPIDAPI_HOST}`,
      headers: {
        'x-rapidapi-key': env.RAPIDAPI_KEY,
        'x-rapidapi-host': env.RAPIDAPI_HOST,
      },
    });

    logger.info('TikTok API Service initialized');
  }

  /**
   * Search TikTok videos by keyword
   * @param keyword - Search term (e.g., "football tricks", "crafting ideas")
   * @param count - Number of results (default: 10)
   */
  async searchVideos(
    keyword: string,
    count: number = 10
  ): Promise<TikTokSearchResult[]> {
    try {
      logger.info({ keyword, count }, 'Searching TikTok videos');

      const response = await this.client.get('/api/search/general', {
        params: {
          keyword: keyword,
          cursor: 0,
          search_id: 0,
        },
      });

      const allResults = response.data?.data || [];

      // Filter for video results (type 1) and extract item
      const videos = allResults
        .filter((item: any) => item.type === 1 && item.item)
        .map((item: any) => ({
          aweme_id: item.item.id,
          desc: item.item.desc,
          author: {
            unique_id: item.item.author?.uniqueId || '',
            nickname: item.item.author?.nickname || '',
          },
          video: {
            play_addr: {
              url_list: [item.item.video?.playAddr || ''],
            },
            cover: {
              url_list: [item.item.video?.cover || ''],
            },
            duration: item.item.video?.duration || 0,
          },
          statistics: {
            digg_count: item.item.stats?.diggCount || 0,
            comment_count: item.item.stats?.commentCount || 0,
            share_count: item.item.stats?.shareCount || 0,
            play_count: item.item.stats?.playCount || 0,
          },
          create_time: item.item.createTime || 0,
        }))
        .slice(0, count);

      logger.info({ keyword, resultsCount: videos.length }, 'Search completed');

      return videos;
    } catch (error: any) {
      logger.error(
        {
          error,
          keyword,
          responseData: error.response?.data,
          responseStatus: error.response?.status,
          responseHeaders: error.response?.headers,
        },
        'Failed to search TikTok videos'
      );
      throw error;
    }
  }

  /**
   * Get popular/trending videos by hashtag
   * @param hashtag - Hashtag name (without #)
   * @param count - Number of results
   */
  async getHashtagVideos(
    hashtag: string,
    count: number = 10
  ): Promise<TikTokSearchResult[]> {
    try {
      logger.info({ hashtag, count }, 'Fetching hashtag videos');

      const response = await this.client.get('/api/hashtag/posts', {
        params: {
          name: hashtag,
          count,
          offset: 0,
        },
      });

      const videos = response.data?.data || [];

      logger.info(
        { hashtag, resultsCount: videos.length },
        'Hashtag videos fetched'
      );

      return videos;
    } catch (error) {
      logger.error({ error, hashtag }, 'Failed to fetch hashtag videos');
      throw error;
    }
  }

  /**
   * Get user's most popular videos
   * @param username - TikTok username (e.g., "cristiano")
   * @param count - Number of videos to fetch
   */
  async getUserPopularVideos(
    username: string,
    count: number = 10
  ): Promise<TikTokUserPost[]> {
    try {
      logger.info({ username, count }, 'Fetching user popular videos');

      const response = await this.client.get('/api/user/posts', {
        params: {
          unique_id: username,
          count,
          offset: 0,
        },
      });

      let videos = response.data?.data || [];

      // Sort by likes (digg_count) to get most popular
      videos = videos.sort(
        (a: TikTokUserPost, b: TikTokUserPost) =>
          (b.statistics?.digg_count || 0) - (a.statistics?.digg_count || 0)
      );

      logger.info(
        { username, resultsCount: videos.length },
        'User videos fetched'
      );

      return videos.slice(0, count);
    } catch (error) {
      logger.error({ error, username }, 'Failed to fetch user videos');
      throw error;
    }
  }

  /**
   * Get top trending videos in a niche
   * This searches and returns the most popular videos by likes
   */
  async getTopVideosInNiche(
    niche: string,
    topCount: number = 5
  ): Promise<TikTokSearchResult[]> {
    try {
      logger.info({ niche, topCount }, 'Fetching top videos in niche');

      // Search for more videos than needed to filter best ones
      const videos = await this.searchVideos(niche, topCount * 3);

      // Sort by likes (digg_count) and take top N
      const topVideos = videos
        .sort((a, b) => (b.stats?.digg_count || 0) - (a.stats?.digg_count || 0))
        .slice(0, topCount);

      logger.info(
        {
          niche,
          topCount,
          results: topVideos.map((v) => ({
            id: v.video_id,
            likes: v.stats?.digg_count,
          })),
        },
        'Top videos fetched'
      );

      return topVideos;
    } catch (error) {
      logger.error({ error, niche }, 'Failed to fetch top videos');
      throw error;
    }
  }

  /**
   * Convert TikTok API result to downloadable URL format
   */
  convertToDownloadUrl(videoId: string): string {
    return `https://www.tiktok.com/@user/video/${videoId}`;
  }
}

export const tiktokAPIService = env.RAPIDAPI_KEY
  ? new TikTokAPIService()
  : null;
