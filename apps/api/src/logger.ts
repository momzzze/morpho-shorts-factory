import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'prod';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          singleLine: false,
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
