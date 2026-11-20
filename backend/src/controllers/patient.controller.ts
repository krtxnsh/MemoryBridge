import { Request, Response, NextFunction } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { patientService } from '../services/patient.service.js';
import { createPatientSchema, updatePatientSchema, createPatientSessionSchema } from '../validators/patient.validator.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { signPatientToken } from '../utils/token.js';

export class PatientController {
  // GET /api/v1/patients
  async listPatients(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const patients = await patientService.listPatients(userId);
      sendSuccess(res, patients);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/patients
  async createPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = createPatientSchema.parse(req.body);
      const result = await patientService.createPatient(userId, validated);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/patients/:patientId
  async getPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.patientId as string;
      const userId = req.user?.id;
      const isPatientSession = !!req.patientSession;

      const patient = await patientService.getPatient(patientId, userId, isPatientSession);
      sendSuccess(res, patient);
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/v1/patients/:patientId
  async updatePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.patientId as string;
      const userId = req.user!.id;
      const validated = updatePatientSchema.parse(req.body);

      const updated = await patientService.updatePatient(patientId, userId, validated);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/v1/patients/:patientId
  async deletePatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.params.patientId as string;
      const userId = req.user!.id;

      const deleted = await patientService.deletePatient(patientId, userId);
      sendSuccess(res, deleted);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/patients/:patientId/patient-sessions
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
  async listPatientSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patient = req.patient!;

      const sessions = await prisma.patientSession.findMany({
        where: {
          patientId: patient.id,
          revokedAt: null,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' },
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
        data: { revokedAt: new Date() }
      });

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
