import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file BEFORE validating environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const envSchema = z.object({
  NODE_ENV: z.string().optional().default('development'),
  PORT: z.coerce.number().int().positive().default(5001),

  CORS_ORIGINS: z.string().optional().default(''),
  RABBIT_URL: z.string().optional(),

  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  API_KEY: z.string().optional(),

  // JWT authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Redis caching
  REDIS_URL: z.string().optional(), // redis://localhost:6379 or redis://:password@host:port

  // Google Cloud Storage
  STORAGE_DRIVER: z.enum(['local', 'gcs']).optional().default('local'),
  GCS_PROJECT_ID: z.string().optional(),
  GCS_BUCKET_NAME: z.string().optional(),
  GCS_CREDENTIALS_PATH: z.string().optional(),

  // RapidAPI - TikTok API
  RAPIDAPI_KEY: z.string().optional(),
  RAPIDAPI_HOST: z.string().optional().default('tiktok-api123.p.rapidapi.com'),
  // YouTube Data API
  YOUTUBE_API_KEY: z.string().optional(),
  FOOTBALL_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
