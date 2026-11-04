import { Request, Response, NextFunction } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { createPatientSchema, createPatientSessionSchema } from '../validators/auth.validator.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { signPatientToken } from '../utils/token.js';
import { AppError } from '../middleware/errorHandler.js';

export class PatientController {
  // GET /api/v1/patients
  // Lists only patients the authenticated user has access to
  async listPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const accessRecords = await prisma.patientAccess.findMany({
        where: {
          userId,
          patient: {
            deletedAt: null
          }
        },
        include: {
          patient: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      const patients = accessRecords.map((item) => ({
        id: item.patient.id,
        fullName: item.patient.fullName,
        dateOfBirth: item.patient.dateOfBirth,
        profileImage: item.patient.profileImage,
        preferredLanguage: item.patient.preferredLanguage,
        biography: item.patient.biography,
        isDemo: item.patient.isDemo,
        relationship: item.relationship,
        accessRole: item.accessRole,
        createdAt: item.patient.createdAt
      }));

      sendSuccess(res, patients);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/patients
  // Transactionally creates PatientProfile + PatientAccess (OWNER) + AuditLog
  async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = createPatientSchema.parse(req.body);

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create PatientProfile
        const patient = await tx.patientProfile.create({
          data: {
            fullName: validated.fullName,
            dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
            profileImage: validated.profileImage || null,
            preferredLanguage: validated.preferredLanguage,
            biography: validated.biography || null,
            isDemo: false
          }
        });

        // 2. Grant creator OWNER access
        const access = await tx.patientAccess.create({
          data: {
            userId,
            patientId: patient.id,
            relationship: validated.relationship,
            accessRole: AccessRole.OWNER
          }
        });

        // 3. Write AuditLog
        await tx.auditLog.create({
          data: {
            actorId: userId,
            patientId: patient.id,
            action: 'CREATE_PATIENT',
            resourceType: 'PatientProfile',
            resourceId: patient.id,
            metadata: {
              fullName: patient.fullName,
              accessRole: access.accessRole
            }
          }
        });

        return {
          id: patient.id,
          fullName: patient.fullName,
          dateOfBirth: patient.dateOfBirth,
          profileImage: patient.profileImage,
          preferredLanguage: patient.preferredLanguage,
          biography: patient.biography,
          isDemo: patient.isDemo,
          relationship: access.relationship,
          accessRole: access.accessRole,
          createdAt: patient.createdAt
        };
      });

      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/patients/:patientId
  // Guaranteed by requirePatientAccess('VIEWER')
  async getPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = req.patient!;
      const access = req.patientAccess!;

      sendSuccess(res, {
        id: patient.id,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        profileImage: patient.profileImage,
        preferredLanguage: patient.preferredLanguage,
        biography: patient.biography,
        isDemo: patient.isDemo,
        relationship: access.relationship,
        accessRole: access.accessRole,
        createdAt: patient.createdAt
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/patients/:patientId/patient-sessions
  // Guaranteed by requirePatientAccess('CAREGIVER')
  async createPatientSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = req.patient!;
      const userId = req.user!.id;
      const { durationMinutes } = createPatientSessionSchema.parse(req.body);

      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

      const session = await prisma.patientSession.create({
        data: {
          patientId: patient.id,
          createdBy: userId,
          expiresAt
        }
      });

      // Write AuditLog
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          patientId: patient.id,
          action: 'CREATE_PATIENT_SESSION',
          resourceType: 'PatientSession',
          resourceId: session.id,
          metadata: {
            durationMinutes,
            expiresAt: expiresAt.toISOString()
          }
        }
      });

      // Issue revocable typ: "patient" token
      const sessionToken = signPatientToken(session.id, patient.id, expiresAt);

      sendSuccess(
        res,
        {
          session: {
            id: session.id,
            patientId: session.patientId,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt
          },
          sessionToken
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/patients/:patientId/patient-sessions
  // Guaranteed by requirePatientAccess('CAREGIVER')
  async listPatientSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = req.patient!;

      const sessions = await prisma.patientSession.findMany({
        where: {
          patientId: patient.id,
          revokedAt: null,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          patientId: true,
          createdBy: true,
          expiresAt: true,
          createdAt: true
        }
      });

      sendSuccess(res, sessions);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/v1/patient-sessions/:id
  async revokePatientSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.params.id as string;
      const userId = req.user!.id;

      const session = await prisma.patientSession.findUnique({
        where: { id: sessionId },
        include: { patient: true }
      });

      if (!session || session.patient.deletedAt !== null) {
        sendError(res, 'SESSION_NOT_FOUND', 'Patient session not found.', 404);
        return;
      }

      // Check caller has CAREGIVER access to owning patient
      const access = await prisma.patientAccess.findUnique({
        where: {
          userId_patientId: {
            userId,
            patientId: session.patientId
          }
        }
      });

      if (!access || (access.accessRole !== AccessRole.OWNER && access.accessRole !== AccessRole.CAREGIVER)) {
        sendError(res, 'SESSION_NOT_FOUND', 'Patient session not found.', 404);
        return;
      }

      const updated = await prisma.patientSession.update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date()
        }
      });

      // Write AuditLog
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          patientId: session.patientId,
          action: 'REVOKE_PATIENT_SESSION',
          resourceType: 'PatientSession',
          resourceId: sessionId
        }
      });

      sendSuccess(res, {
        message: 'Patient session revoked successfully',
        id: updated.id,
        revokedAt: updated.revokedAt
      });
    } catch (err) {
      next(err);
    }
  }
}

export const patientController = new PatientController();

