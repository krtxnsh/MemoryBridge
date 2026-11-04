import { Request, Response, NextFunction } from 'express';
import { UserRole, AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { verifyAccessToken, verifyPatientToken } from '../utils/token.js';
import { sendError } from '../utils/response.js';

const ACCESS_ROLE_RANK: Record<AccessRole, number> = {
  OWNER: 4,
  CAREGIVER: 3,
  FAMILY: 2,
  VIEWER: 1
};

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHENTICATED', 'Authentication required. Missing Bearer token.', 401);
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const payload = verifyAccessToken(token);

    // Verify user still exists and tokenVersion matches
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tokenVersion: true
      }
    });

    if (!user) {
      sendError(res, 'USER_NOT_FOUND', 'The user account no longer exists.', 401);
      return;
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      sendError(res, 'TOKEN_REVOKED', 'Session has expired or was revoked. Please log in again.', 401);
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    sendError(res, 'INVALID_TOKEN', 'Invalid, expired, or malformed access token.', 401);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'UNAUTHENTICATED', 'Authentication required.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'FORBIDDEN_ROLE', 'You do not have permission to access this system resource.', 403);
      return;
    }

    next();
  };
}

export type PatientIdResolver = (req: Request) => Promise<string | undefined> | string | undefined;

export function requirePatientAccess(minRole: AccessRole, resolver?: PatientIdResolver) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      sendError(res, 'UNAUTHENTICATED', 'Authentication required.', 401);
      return;
    }

    // Resolve patientId
    let patientId: string | undefined;
    if (resolver) {
      patientId = await resolver(req);
    } else {
      patientId = (req.params.patientId || req.body?.patientId || req.query?.patientId) as string | undefined;
    }

    if (!patientId) {
      sendError(res, 'PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
      return;
    }

    // Look up patient (must not be soft-deleted)
    const patient = await prisma.patientProfile.findFirst({
      where: {
        id: patientId,
        deletedAt: null
      }
    });

    if (!patient) {
      // Return 404 to avoid leaking patient existence
      sendError(res, 'PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
      return;
    }

    // Look up caller's PatientAccess record
    const access = await prisma.patientAccess.findUnique({
      where: {
        userId_patientId: {
          userId: req.user.id,
          patientId: patient.id
        }
      }
    });

    // ADMINs without PatientAccess record cannot see patient data (must return 404)
    if (!access) {
      sendError(res, 'PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
      return;
    }

    // Check role hierarchy
    const callerRank = ACCESS_ROLE_RANK[access.accessRole];
    const requiredRank = ACCESS_ROLE_RANK[minRole];

    if (callerRank < requiredRank) {
      // Return 404 (not 403) to prevent patient resource enumeration
      sendError(res, 'PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
      return;
    }

    req.patient = patient;
    req.patientAccess = access;
    next();
  };
}

export async function authenticatePatientSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'UNAUTHENTICATED', 'Patient session authentication required.', 401);
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const payload = verifyPatientToken(token);

    const session = await prisma.patientSession.findUnique({
      where: { id: payload.sub }
    });

    if (!session) {
      sendError(res, 'SESSION_NOT_FOUND', 'Patient session not found or revoked.', 401);
      return;
    }

    if (session.revokedAt !== null) {
      sendError(res, 'SESSION_REVOKED', 'Patient session has been revoked.', 401);
      return;
    }

    if (new Date() > session.expiresAt) {
      sendError(res, 'SESSION_EXPIRED', 'Patient session has expired.', 401);
      return;
    }

    req.patientSession = session;
    next();
  } catch (err: any) {
    sendError(res, 'INVALID_SESSION_TOKEN', 'Invalid or expired patient session token.', 401);
  }
}

export function authenticateUserOrPatient(minRole: AccessRole = AccessRole.VIEWER) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'UNAUTHENTICATED', 'Authentication required.', 401);
      return;
    }

    const token = authHeader.slice(7).trim();

    // 1. Try Patient Token first
    try {
      const patientPayload = verifyPatientToken(token);
      const session = await prisma.patientSession.findUnique({
        where: { id: patientPayload.sub },
        include: { patient: true }
      });

      if (!session || session.revokedAt !== null || new Date() > session.expiresAt || session.patient.deletedAt !== null) {
        sendError(res, 'SESSION_REVOKED', 'Patient session has expired or been revoked.', 401);
        return;
      }

      req.patientSession = session;
      req.patient = session.patient;
      next();
      return;
    } catch {
      // Not a patient token, fallback to user token
    }

    // 2. Try User Access Token
    try {
      const userPayload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: userPayload.sub }
      });

      if (!user || user.tokenVersion !== userPayload.tokenVersion) {
        sendError(res, 'TOKEN_REVOKED', 'Session expired or revoked.', 401);
        return;
      }

      req.user = user;

      const patientId = (req.params.patientId || req.body?.patientId || req.query?.patientId) as string | undefined;
      if (patientId) {
        const patient = await prisma.patientProfile.findFirst({
          where: { id: patientId, deletedAt: null }
        });
        if (!patient) {
          sendError(res, 'PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
          return;
        }

        const access = await prisma.patientAccess.findUnique({
          where: { userId_patientId: { userId: user.id, patientId: patient.id } }
        });

        if (!access || ACCESS_ROLE_RANK[access.accessRole] < ACCESS_ROLE_RANK[minRole]) {
          sendError(res, 'PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
          return;
        }

        req.patient = patient;
        req.patientAccess = access;
      }

      next();
    } catch {
      sendError(res, 'INVALID_TOKEN', 'Invalid or expired authentication token.', 401);
    }
  };
}

