import { Request, Response } from 'express';
import { verificationService } from '../services/verification.service.js';
import {
  reviewMemorySchema,
  listVerificationsQuerySchema
} from '../validators/verification.validator.js';
import { paginationQuerySchema } from '../validators/common.validator.js';
import { sendSuccess } from '../utils/response.js';

export class VerificationController {
  async listVerifications(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const query = listVerificationsQuerySchema.parse(req.query);

    const result = await verificationService.listVerifications(patientId, query);
    sendSuccess(res, result);
  }

  async getQueue(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const query = paginationQuerySchema.parse(req.query);

    const result = await verificationService.getQueue(patientId, query);
    sendSuccess(res, result);
  }

  async verifyMemory(req: Request, res: Response): Promise<void> {
    const memoryId = req.params.memoryId as string;
    const input = reviewMemorySchema.parse(req.body);
    const userId = req.user!.id;

    const result = await verificationService.verifyMemory(memoryId, userId, input.comments);
    sendSuccess(res, result);
  }

  async rejectMemory(req: Request, res: Response): Promise<void> {
    const memoryId = req.params.memoryId as string;
    const input = reviewMemorySchema.parse(req.body);
    const userId = req.user!.id;

    const result = await verificationService.rejectMemory(memoryId, userId, input.comments);
    sendSuccess(res, result);
  }
}

export const verificationController = new VerificationController();

