import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export function verifyCsrfOrigin(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Expected origin from config (e.g., http://localhost:5173)
  const allowedOrigin = env.CORS_ORIGIN;

  if (origin) {
    if (origin !== allowedOrigin) {
      sendError(res, 'CSRF_INVALID_ORIGIN', 'Cross-site request rejected: invalid origin', 403);
      return;
    }
  } else if (referer) {
    if (!referer.startsWith(allowedOrigin)) {
      sendError(res, 'CSRF_INVALID_REFERER', 'Cross-site request rejected: invalid referer', 403);
      return;
    }
  } else if (env.NODE_ENV === 'production') {
    // In production, state-changing cookie requests MUST present Origin or Referer
    sendError(res, 'CSRF_MISSING_ORIGIN', 'Missing Origin or Referer header', 403);
    return;
  }

  next();
}

