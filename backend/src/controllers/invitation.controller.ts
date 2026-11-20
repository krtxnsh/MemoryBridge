import { NextFunction, Request, Response } from 'express';
import { invitationService } from '../services/invitation.service.js';
import { createInvitationSchema, redeemInvitationSchema } from '../validators/invitation.validator.js';
import { sendSuccess } from '../utils/response.js';

export class InvitationController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = createInvitationSchema.parse(req.body);
      const result = await invitationService.create(req.params.patientId as string, req.user!.id, input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await invitationService.list(req.params.patientId as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async revoke(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await invitationService.revoke(
        req.params.patientId as string,
        req.params.invitationId as string,
        req.user!.id
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async redeem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = redeemInvitationSchema.parse(req.body);
      const result = await invitationService.redeem(req.user!.id, code);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const invitationController = new InvitationController();
