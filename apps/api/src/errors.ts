export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;
  constructor(
    message: string,
    opts?: { statusCode?: number; code?: string; details?: unknown }
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = opts?.statusCode ?? 500;
    this.code = opts?.code ?? 'INTERNAL_ERROR';
    this.details = opts?.details;
  }
}

export function isAppError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
