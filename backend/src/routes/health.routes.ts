import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// GET /health - unauthenticated health check
router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() });
});

export default router;

