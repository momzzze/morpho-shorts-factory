import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().optional().default('development'),
  PORT: z.coerce.number().int().positive().default(5001),

  CORS_ORIGINS: z.string().optional().default(''),
  RABBIT_URL: z.string().optional(),

  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
