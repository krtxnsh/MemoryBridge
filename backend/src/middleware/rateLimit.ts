import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

// Standard per-IP rate limiter for general auth routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.setHeader('Retry-After', '900');
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429);
  }
});

// General API Rate Limiter
export const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'API rate limit exceeded. Please try again later.', 429);
  }
});

// Stricter limiter on search routes
export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'SEARCH_RATE_LIMIT_EXCEEDED', 'Search rate limit exceeded. Please wait a moment before searching again.', 429);
  }
});

// Stricter limiter on write routes (create / update / delete)
export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'WRITE_RATE_LIMIT_EXCEEDED', 'Write rate limit exceeded. Please try again in a few moments.', 429);
  }
});

// Media upload URL rate limiter
export const uploadUrlRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'Upload URL request limit exceeded. Please try again later.', 429);
  }
});

// Media confirm rate limiter
export const confirmRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'Media confirm limit exceeded. Please try again later.', 429);
  }
});

// Media read URL rate limiter
export const mediaUrlRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'Media URL rate limit exceeded. Please try again later.', 429);
  }
});

interface FailureRecord {
  count: number;
  firstFailedAt: number;
  lastFailedAt: number;
}

// In-memory progressive delay store: key = ip:email
const failureStore = new Map<string, FailureRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10; // After 10 consecutive failures, return 429

function cleanupExpired() {
  const now = Date.now();
  for (const [key, record] of failureStore.entries()) {
    if (now - record.lastFailedAt > WINDOW_MS) {
      failureStore.delete(key);
    }
  }
}

// Periodically clean up failure store
setInterval(cleanupExpired, 5 * 60 * 1000).unref();

export function getFailureKey(req: Request, email?: string): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const cleanEmail = email ? email.toLowerCase().trim() : 'unknown';
  return `${ip}:${cleanEmail}`;
}

export function recordLoginFailure(key: string): number {
  const now = Date.now();
  const existing = failureStore.get(key);

  if (!existing || now - existing.lastFailedAt > WINDOW_MS) {
    failureStore.set(key, { count: 1, firstFailedAt: now, lastFailedAt: now });
    return 1;
  }

  existing.count += 1;
  existing.lastFailedAt = now;
  return existing.count;
}

export function resetLoginFailure(key: string): void {
  failureStore.delete(key);
}

export async function loginProgressiveDelay(req: Request, res: Response, next: NextFunction): Promise<void> {
  const email = req.body?.email;
  const key = getFailureKey(req, email);
  const record = failureStore.get(key);

  if (!record) {
    next();
    return;
  }

  const now = Date.now();
  if (now - record.lastFailedAt > WINDOW_MS) {
    failureStore.delete(key);
    next();
    return;
  }

  // If >= MAX_ATTEMPTS (10 failures), rate limit with 429
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.lastFailedAt + WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    sendError(res, 'TOO_MANY_FAILED_ATTEMPTS', 'Too many failed login attempts. Please wait before retrying.', 429);
    return;
  }

  // Progressive delay: 200ms per failure above 3 attempts (max 2000ms)
  if (record.count >= 3) {
    const delay = Math.min((record.count - 2) * 200, 2000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  next();
}

