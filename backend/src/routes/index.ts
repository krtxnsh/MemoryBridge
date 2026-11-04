import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Health check mounted at /api/v1/health and /health
router.use(healthRoutes);

export default router;

