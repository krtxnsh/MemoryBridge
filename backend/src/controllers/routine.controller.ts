import { Request, Response, NextFunction } from 'express';
import { routineService } from '../services/routine.service.js';
import {
  createRoutineItemSchema,
  updateRoutineItemSchema
} from '../validators/core.validator.js';
import { sendSuccess } from '../utils/response.js';

export class RoutineController {
  async listRoutine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient?.id || req.patientSession?.patientId || (req.params.patientId as string);
      const items = await routineService.listRoutineItems(patientId);
      sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  }

  async createRoutineItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const userId = req.user!.id;
      const validated = createRoutineItemSchema.parse(req.body);

      const item = await routineService.createRoutineItem(patientId, userId, validated);
      sendSuccess(res, item, 201);
    } catch (err) {
      next(err);
    }
  }

  async toggleComplete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const completed = typeof req.body?.completed === 'boolean' ? req.body.completed : undefined;

      const updated = await routineService.toggleComplete(id, completed);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  async deleteRoutineItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await routineService.deleteRoutineItem(id);
      sendSuccess(res, { id, message: 'Routine item deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const routineController = new RoutineController();
