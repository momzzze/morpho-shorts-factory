import { getRedis } from '../lib/redis.js';
import { logger } from '../logger.js';

export const cacheService = {
  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/no cache available
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedis();
      if (!redis) return null;

      const data = await redis.get(key);
      if (data) {
        logger.debug({ key }, 'Cache hit');
        return JSON.parse(data) as T;
      }

      logger.debug({ key }, 'Cache miss');
      return null;
    } catch (error) {
      logger.warn({ error, key }, 'Cache read failed');
      return null;
    }
  },

  /**
   * Set value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (default: 10 minutes)
   */
  async set(key: string, value: unknown, ttl = 600): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;

      await redis.setex(key, ttl, JSON.stringify(value));
      logger.debug({ key, ttl }, 'Cache set');
    } catch (error) {
      logger.warn({ error, key }, 'Cache write failed');
      // Don't throw - cache failure shouldn't break the app
    }
  },

  /**
   * Invalidate cache key
   * @param key Cache key to delete
   */
  async invalidate(key: string): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;

      await redis.del(key);
      logger.debug({ key }, 'Cache invalidated');
    } catch (error) {
      logger.warn({ error, key }, 'Cache invalidation failed');
    }
  },

  /**
   * Invalidate multiple cache keys by pattern
   * @param pattern Pattern to match (e.g., "company:*")
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;

      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug({ pattern, count: keys.length }, 'Cache pattern invalidated');
      }
    } catch (error) {
      logger.warn({ error, pattern }, 'Cache pattern invalidation failed');
    }
  },

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;

      await redis.flushdb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.warn({ error }, 'Cache clear failed');
    }
  },

  /**
   * Get-or-set pattern: Get from cache, or fetch and cache
   * @param key Cache key
   * @param fetchFn Function to fetch value if not cached
   * @param ttl Time to live in seconds
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = 600
  ): Promise<T> {
    try {
      // Try cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Cache miss - fetch value
      const value = await fetchFn();

      // Cache the result
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      logger.error({ error, key }, 'Get-or-set failed');
      throw error;
    }
  },
};

export default cacheService;
