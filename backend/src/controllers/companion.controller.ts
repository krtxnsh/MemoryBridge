import { Request, Response } from 'express';
import { companionService } from '../services/companion.service.js';
import { companionMessageSchema } from '../validators/companion.validator.js';
import { sendSuccess } from '../utils/response.js';

export class CompanionController {
  async getState(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const result = await companionService.getState(patientId);
    sendSuccess(res, result);
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const input = companionMessageSchema.parse(req.body);

    const actor = {
      userId: req.user?.id,
      patientSessionId: req.patientSession?.id
    };

    const result = await companionService.processMessage(
      patientId,
      input.text,
      input.context,
      actor
    );

    sendSuccess(res, result);
  }
}

export const companionController = new CompanionController();

