import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './routes/index.js';
import { httpLogger } from './httpLogger.js';
import { logger } from './logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';

dotenv.config();

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
app.use('/api', router);

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error(err, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  logger.info(`API server running on port ${PORT}`);
});
