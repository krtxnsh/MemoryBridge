import { Request, Response } from 'express';
import { routineService } from '../services/routine.service.js';
import {
  createRoutineSchema,
  updateRoutineSchema,
  completeRoutineSchema,
  listRoutineQuerySchema
} from '../validators/routine.validator.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export class RoutineController {
  async listRoutine(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const query = listRoutineQuerySchema.parse(req.query);

    const result = await routineService.listRoutine(patientId, query);
    sendSuccess(res, result);
  }

  async getRoutine(req: Request, res: Response): Promise<void> {
    const routineId = req.params.id as string;
    const result = await routineService.getRoutineById(routineId);
    sendSuccess(res, result);
  }

  async createRoutine(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const input = createRoutineSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await routineService.createRoutine(patientId, userId, input);
    sendCreated(res, result);
  }

  async updateRoutine(req: Request, res: Response): Promise<void> {
    const routineId = req.params.id as string;
    const input = updateRoutineSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await routineService.updateRoutine(routineId, userId, input);
    sendSuccess(res, result);
  }

  async completeRoutine(req: Request, res: Response): Promise<void> {
    const routineId = req.params.id as string;
    const input = completeRoutineSchema.parse(req.body || {});
    const actorId = req.user?.id || req.patientSession?.createdBy;

    const result = await routineService.completeRoutine(routineId, actorId, input.completed);
    sendSuccess(res, result);
  }

  async deleteRoutine(req: Request, res: Response): Promise<void> {
    const routineId = req.params.id as string;
    const userId = req.user!.id;

    const result = await routineService.deleteRoutine(routineId, userId);
    sendSuccess(res, result);
  }
}

export const routineController = new RoutineController();
