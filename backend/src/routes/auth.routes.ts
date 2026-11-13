import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter, loginProgressiveDelay } from '../middleware/rateLimit.js';
import { verifyCsrfOrigin } from '../middleware/csrf.js';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', authRateLimiter, (req, res, next) => {
  authController.register(req, res, next);
});

// POST /api/v1/auth/login
router.post('/login', authRateLimiter, loginProgressiveDelay, (req, res, next) => {
  authController.login(req, res, next);
});

// POST /api/v1/auth/refresh
router.post('/refresh', authRateLimiter, verifyCsrfOrigin, (req, res, next) => {
  authController.refresh(req, res, next);
});

// POST /api/v1/auth/logout
router.post('/logout', verifyCsrfOrigin, async (req, res, next) => {
  // If authorization header is provided, run authenticate to capture userId
  if (req.headers.authorization) {
    authenticate(req, res, () => {
      authController.logout(req, res, next);
    });
  } else {
    authController.logout(req, res, next);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, (req, res, next) => {
  authController.getMe(req, res, next);
});

export default router;

