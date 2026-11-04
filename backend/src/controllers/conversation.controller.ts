import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversation.service.js';
import { sendMessageSchema } from '../validators/core.validator.js';
import { sendSuccess } from '../utils/response.js';

export class ConversationController {
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient?.id || req.patientSession?.patientId || (req.params.patientId as string);
      const userId = req.user?.id;
      const patientSessionId = req.patientSession?.id;

      const { message, conversationId } = sendMessageSchema.parse(req.body);

      const response = await conversationService.handleUserMessage(
        patientId,
        message,
        conversationId,
        userId,
        patientSessionId
      );

      sendSuccess(res, response, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const conversationController = new ConversationController();
