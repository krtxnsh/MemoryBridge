import { Request, Response, NextFunction } from 'express';
import { AccessRole, VerificationStatus } from '@prisma/client';
import { memoryService } from '../services/memory.service.js';
import {
  createMemorySchema,
  updateMemorySchema,
  verifyMemorySchema,
  searchMemoryQuerySchema
} from '../validators/core.validator.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class MemoryController {
  async listMemories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient?.id || req.patientSession?.patientId || (req.params.patientId as string);
      const isPatientToken = !!req.patientSession;
      const accessRole = req.patientAccess?.accessRole;
      const userId = req.user?.id;

      const memories = await memoryService.listMemories(patientId, isPatientToken, accessRole, userId);
      sendSuccess(res, memories);
    } catch (err) {
      next(err);
    }
  }

  async searchMemories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient?.id || req.patientSession?.patientId || (req.params.patientId as string);
      const isPatientToken = !!req.patientSession;
      const accessRole = req.patientAccess?.accessRole;
      const userId = req.user?.id;

      const queryParams = searchMemoryQuerySchema.parse(req.query);
      const memories = await memoryService.searchMemories(patientId, queryParams, isPatientToken, accessRole, userId);
      sendSuccess(res, memories);
    } catch (err) {
      next(err);
    }
  }

  async getMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const isPatientToken = !!req.patientSession;
      const accessRole = req.patientAccess?.accessRole;
      const userId = req.user?.id;

      const memory = await memoryService.getMemoryById(id, isPatientToken, accessRole, userId);
      sendSuccess(res, memory);
    } catch (err) {
      next(err);
    }
  }

  async createMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const userId = req.user!.id;
      const accessRole = req.patientAccess!.accessRole;
      const isCaregiver = accessRole === AccessRole.OWNER || accessRole === AccessRole.CAREGIVER;

      const validated = createMemorySchema.parse(req.body);
      const memory = await memoryService.createMemory(patientId, userId, validated, isCaregiver);

      sendSuccess(res, memory, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const patientId = req.patient!.id;
      const userId = req.user!.id;

      const validated = updateMemorySchema.parse(req.body);
      const updated = await memoryService.updateMemory(id, userId, patientId, validated);

      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  async deleteMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const patientId = req.patient!.id;
      const userId = req.user!.id;

      const deleted = await memoryService.deleteMemory(id, userId, patientId);
      sendSuccess(res, { id: deleted.id, message: 'Memory deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  async verifyMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const patientId = req.patient!.id;
      const verifierId = req.user!.id;
      const validated = verifyMemorySchema.parse(req.body);

      const result = await memoryService.verifyMemory(
        id,
        verifierId,
        patientId,
        validated.status,
        validated.comments
      );

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async rejectMemory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const patientId = req.patient!.id;
      const verifierId = req.user!.id;
      const comments = req.body?.comments;

      const result = await memoryService.verifyMemory(
        id,
        verifierId,
        patientId,
        VerificationStatus.REJECTED,
        comments
      );

      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listVerifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const verifications = await memoryService.listVerifications(patientId);
      sendSuccess(res, verifications);
    } catch (err) {
      next(err);
    }
  }
}

export const memoryController = new MemoryController();
