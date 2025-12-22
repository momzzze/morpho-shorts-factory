// ==============================================================================
// Response Utils - Standardized API responses
// ==============================================================================

import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  details?: any,
  statusCode = 500
): void {
  const response: ApiResponse = {
    success: false,
    error,
    details,
  };
  res.status(statusCode).json(response);
}

export function sendBadRequest(
  res: Response,
  error: string,
  details?: any
): void {
  sendError(res, error, details, 400);
}

export function sendNotFound(res: Response, error: string): void {
  sendError(res, error, undefined, 404);
}

export function sendUnauthorized(res: Response, error: string): void {
  sendError(res, error, undefined, 401);
}
