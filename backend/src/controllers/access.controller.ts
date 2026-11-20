import { NextFunction, Request, Response } from 'express';
import { accessService } from '../services/access.service.js';
import { updateAccessSchema } from '../validators/patient.validator.js';
import { sendSuccess } from '../utils/response.js';

export class AccessController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await accessService.listMembers(req.params.patientId as string, req.user!.id);
      sendSuccess(res, members);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = updateAccessSchema.parse(req.body);
      const member = await accessService.updateMember(
        req.params.patientId as string,
        req.params.accessId as string,
        req.user!.id,
        input
      );
      sendSuccess(res, member);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await accessService.removeMember(
        req.params.patientId as string,
        req.params.accessId as string,
        req.user!.id
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const accessController = new AccessController();
