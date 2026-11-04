import { Response } from 'express';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): Response {
  const body: ApiResponse<T> = {
    data,
    error: null
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: unknown
): Response {
  const body: ApiResponse<null> = {
    data: null,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };
  return res.status(statusCode).json(body);
}

