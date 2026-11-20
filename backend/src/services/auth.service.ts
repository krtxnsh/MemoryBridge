import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken
} from '../utils/token.js';
import { recordLoginFailure, resetLoginFailure, getFailureKey } from '../middleware/rateLimit.js';

// Dummy hash for constant-time comparison when email is not found
const DUMMY_HASH = '$2a$12$e8Y4L59q2o2i1C9sX7iGpeqU2wF5zQ1gX1O7jN2uB6dE3vP1u0j6m';
const BCRYPT_SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: 'CAREGIVER' | 'FAMILY_MEMBER';
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const email = input.email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      throw new AppError('EMAIL_ALREADY_EXISTS', 'An account with this email address already exists', 409);
    }

    // Role assignment (self-registration strictly forbids ADMIN)
    const role: UserRole = input.role === 'CAREGIVER' ? UserRole.CAREGIVER : UserRole.FAMILY_MEMBER;

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: input.name.trim(),
        passwordHash,
        role,
        tokenVersion: 0
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tokenVersion: true,
        createdAt: true
      }
    });

    // Issue tokens
    const accessToken = signAccessToken(user);
    const { token: refreshToken, family, tokenHash, expiresAt } = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        family,
        expiresAt
      }
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }

  async login(input: LoginInput, failureKey: string) {
    const email = input.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        tokenVersion: true
      }
    });

    if (!user) {
      // Perform dummy comparison to prevent timing enumeration
      await bcrypt.compare(input.password, DUMMY_HASH);
      recordLoginFailure(failureKey);
      logger.warn({ email }, 'Login failed: unknown email');
      throw new AppError('INVALID_CREDENTIALS', 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!isMatch) {
      recordLoginFailure(failureKey);
      logger.warn({ userId: user.id, email }, 'Login failed: incorrect password');
      throw new AppError('INVALID_CREDENTIALS', 'Invalid credentials', 401);
    }

    // Reset login failures on success
    resetLoginFailure(failureKey);

    // Issue tokens
    const accessToken = signAccessToken(user);
    const { token: refreshToken, family, tokenHash, expiresAt } = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        family,
        expiresAt
      }
    });

    logger.info({ userId: user.id }, 'User logged in successfully');

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  }

  async refresh(tokenStr: string) {
    let payload: ReturnType<typeof verifyRefreshToken>;
    try {
      payload = verifyRefreshToken(tokenStr);
    } catch (err) {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token is expired or malformed', 401);
    }

    const tokenHash = hashToken(tokenStr);

    // Look up token in database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!tokenRecord) {
      logger.warn({ userId: payload.sub }, 'Refresh token not found in database');
      throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token not recognized', 401);
    }

    // Reuse Detection: If token is already revoked, an attacker or compromised client reused it!
    if (tokenRecord.isRevoked) {
      logger.warn(
        { userId: tokenRecord.userId, family: tokenRecord.family },
        'SECURITY ALERT: Refresh token reuse detected! Revoking token family and invalidating sessions.'
      );

      // Invalidate entire family and bump user tokenVersion
      await prisma.$transaction([
        prisma.refreshToken.updateMany({
          where: { family: tokenRecord.family },
          data: { isRevoked: true }
        }),
        prisma.user.update({
          where: { id: tokenRecord.userId },
          data: { tokenVersion: { increment: 1 } }
        })
      ]);

      throw new AppError(
        'REFRESH_TOKEN_REUSED',
        'Security violation: Refresh token reuse detected. All sessions revoked.',
        401
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError('REFRESH_TOKEN_EXPIRED', 'Refresh token has expired', 401);
    }

    // Token is valid! Rotate it:
    // 1. Mark current token as revoked
    // 2. Generate new refresh token in the same family
    // 3. Generate new access token
    const newRefreshToken = signRefreshToken(tokenRecord.userId, tokenRecord.family);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true }
      }),
      prisma.refreshToken.create({
        data: {
          userId: tokenRecord.userId,
          tokenHash: newRefreshToken.tokenHash,
          family: tokenRecord.family,
          expiresAt: newRefreshToken.expiresAt
        }
      })
    ]);

    const newAccessToken = signAccessToken({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      role: tokenRecord.user.role,
      tokenVersion: tokenRecord.user.tokenVersion
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token
    };
  }

  async logout(userId: string, tokenStr?: string) {
    if (tokenStr) {
      try {
        const tokenHash = hashToken(tokenStr);
        await prisma.refreshToken.updateMany({
          where: { tokenHash },
          data: { isRevoked: true }
        });
      } catch {
        // ignore
      }
    }

    // Global session revocation: increment tokenVersion and revoke all refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } }
      }),
      prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true }
      })
    ]);

    logger.info({ userId }, 'User logged out and all active sessions revoked.');
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        patientAccess: {
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
                profileImage: true,
                deletedAt: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User profile not found', 404);
    }

    // Filter out access to soft-deleted patients
    const patientAccess = user.patientAccess
      .filter((pa) => pa.patient.deletedAt === null)
      .map((pa) => ({
        patientId: pa.patient.id,
        patientName: pa.patient.fullName,
        profileImage: pa.patient.profileImage,
        relationship: pa.relationship,
        accessRole: pa.accessRole
      }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientAccess
    };
  }
}

export const authService = new AuthService();

