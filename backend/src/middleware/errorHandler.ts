import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { sendError } from '../utils/response.js';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    sendError(
      res,
      'VALIDATION_ERROR',
      'The provided request data is invalid',
      400,
      err.errors.map((e) => ({ path: e.path.join('.'), message: e.message }))
    );
    return;
  }

  // 2. Custom Application Errors
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // 3. Fallback Internal Server Error
  logger.error({ err }, 'Unhandled server error');
  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred. Please try again later.',
    500
  );
}

