// ==============================================================================
// Validation Utils - Common validation helpers
// ==============================================================================

import { z } from 'zod';
import { ApiError } from '../errors.js';

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

/**
 * Validate request data against Zod schema
 * Throws ApiError if validation fails
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((err: z.ZodIssue) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    throw new ApiError('Validation failed', {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: errors,
    });
  }

  return result.data;
}

export function validateRequired(
  data: any,
  requiredFields: string[]
): ValidationResult {
  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
