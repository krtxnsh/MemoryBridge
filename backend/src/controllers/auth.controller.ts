import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  REFRESH_COOKIE_NAME,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
} from '../utils/token.js';
import { getFailureKey } from '../middleware/rateLimit.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(validated);

      setRefreshTokenCookie(res, result.refreshToken);

      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const failureKey = getFailureKey(req, validated.email);

      const result = await authService.login(validated, failureKey);

      setRefreshTokenCookie(res, result.refreshToken);

      sendSuccess(res, {
        user: result.user,
        accessToken: result.accessToken
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

      if (!refreshToken) {
        sendError(res, 'MISSING_REFRESH_TOKEN', 'Refresh token cookie is missing', 401);
        return;
      }

      const result = await authService.refresh(refreshToken);

      setRefreshTokenCookie(res, result.refreshToken);

      sendSuccess(res, {
        accessToken: result.accessToken
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const userId = req.user?.id;

      if (userId) {
        await authService.logout(userId, refreshToken);
      }

      clearRefreshTokenCookie(res);

      sendSuccess(res, {
        message: 'Successfully logged out and session revoked'
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHENTICATED', 'Authentication required', 401);
        return;
      }

      const me = await authService.getMe(req.user.id);
      sendSuccess(res, me);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();

