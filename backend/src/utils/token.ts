import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';
import { env } from '../config/env.js';
import { UserRole } from '@prisma/client';

export interface UserTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
  typ: 'user';
}

export interface RefreshTokenPayload {
  sub: string;
  family: string;
  jti: string;
  typ: 'refresh';
}

export interface PatientTokenPayload {
  sub: string;
  patientId: string;
  typ: 'patient';
}

export const REFRESH_COOKIE_NAME = 'mb_refresh_token';

export function signAccessToken(user: { id: string; email: string; role: UserRole; tokenVersion: number }): string {
  const payload: UserTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
    typ: 'user'
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as any
  });
}

export function signRefreshToken(userId: string, family: string = crypto.randomUUID()): { token: string; family: string; tokenHash: string; expiresAt: Date } {
  const jti = crypto.randomUUID();
  const payload: RefreshTokenPayload = {
    sub: userId,
    family,
    jti,
    typ: 'refresh'
  };

  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any
  });

  const tokenHash = hashToken(token);
  // Default 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return { token, family, tokenHash, expiresAt };
}

export function signPatientToken(sessionId: string, patientId: string, expiresAt: Date): string {
  const payload: PatientTokenPayload = {
    sub: sessionId,
    patientId,
    typ: 'patient'
  };

  const expiresInSeconds = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: expiresInSeconds
  });
}

export function verifyAccessToken(token: string): UserTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256']
  }) as UserTokenPayload;

  if (decoded.typ !== 'user') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ['HS256']
  }) as RefreshTokenPayload;

  if (decoded.typ !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

export function verifyPatientToken(token: string): PatientTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256']
  }) as PatientTokenPayload;

  if (decoded.typ !== 'patient') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth'
  });
}
