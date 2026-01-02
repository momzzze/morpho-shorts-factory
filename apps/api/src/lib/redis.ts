import Redis from 'ioredis';
import { env } from '../env.js';
import { logger } from '../logger.js';

let redis: Redis | null = null;
let isConnecting = false;

export const initRedis = async (): Promise<Redis | null> => {
  // Already connected
  if (redis) return redis;

  // Currently connecting
  if (isConnecting) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (redis) {
          clearInterval(checkInterval);
          resolve(redis);
        }
      }, 100);
    });
  }

  if (!env.REDIS_URL) {
    logger.info('REDIS_URL not configured, caching disabled');
    return null;
  }

  isConnecting = true;

  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('connect', () => {
      isConnecting = false;
      logger.info('Redis connected successfully');
    });

    redis.on('ready', () => {
      logger.debug('Redis ready');
    });

    redis.on('error', (error) => {
      logger.error({ error }, 'Redis connection error');
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
      redis = null;
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        isConnecting = false;
        reject(new Error('Redis connection timeout'));
      }, 5000);

      const onConnect = () => {
        clearTimeout(timeout);
        redis?.off('error', onError);
        isConnecting = false;
        resolve();
      };

      const onError = (err: Error) => {
        clearTimeout(timeout);
        redis?.off('connect', onConnect);
        isConnecting = false;
        reject(err);
      };

      redis?.once('connect', onConnect);
      redis?.once('error', onError);
    });

    return redis;
  } catch (error) {
    isConnecting = false;
    logger.warn({ error }, 'Failed to connect to Redis, caching disabled');
    redis = null;
    return null;
  }
};

export const getRedis = (): Redis | null => {
  return redis;
};

export const closeRedis = async (): Promise<void> => {
  if (redis) {
    try {
      await redis.quit();
      redis = null;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error({ error }, 'Error closing Redis connection');
    }
  }
};

export const isRedisHealthy = async (): Promise<boolean> => {
  try {
    const redisClient = getRedis();
    if (!redisClient) return false;
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
};
