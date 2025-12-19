import pinoHttp from 'pino-http';
import { logger } from './logger.js';

export const httpLogger = pinoHttp({
  logger,

  customAttributeKeys: {
    responseTime: 'timeMs',
  },

  customProps: (req, res) => ({
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    statusCode: res.statusCode,
    method: req.method,
  }),

  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        query: (req as any).query,
        body: (req as any).body,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },

  customSuccessMessage: (req, res) =>
    `[${(req as any).requestId}] ${req.method} ${req.url} -> ${res.statusCode}`,

  customErrorMessage: (req, res, err) =>
    `[${(req as any).requestId}] ${req.method} ${req.url} → ${
      res.statusCode
    } (${err.message})`,
});
