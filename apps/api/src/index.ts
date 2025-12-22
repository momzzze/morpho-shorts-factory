import express from 'express';
import cors from 'cors';

import { env } from './env.js';
import router from './routes/index.js';
import { httpLogger } from './httpLogger.js';
import { logger } from './logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { isAppError } from './errors.js';
import { initializeRabbitMQ } from './rabbitmq/setup.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(
  express.json({
    limit: '1mb',
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(httpLogger);

app.use(express.json());
app.use('/api/v1', router);

app.use((err: any, req: any, res: any, _next: any) => {
  const requestId = req.requestId;

  if (isAppError(err)) {
    logger.warn(
      {
        requestId,
        code: err.code,
        statusCode: err.statusCode,
        details: err.details,
      },
      err.message
    );
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      requestId,
      details: err.details,
    });
  }
  logger.error(
    { requestId, err: { message: err?.message, stack: err?.stack } },
    'Unhandled error'
  );
  return res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    requestId,
  });
});

app.listen(env.PORT, async () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API server running');

  // Initialize RabbitMQ and start consuming messages
  try {
    await initializeRabbitMQ();
  } catch (error) {
    logger.error(
      { error },
      'Failed to initialize RabbitMQ, continuing without it'
    );
  }
});
