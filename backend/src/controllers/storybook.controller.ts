import { Request, Response } from 'express';
import { storybookService } from '../services/storybook.service.js';
import {
  createStorybookSchema,
  updateStorybookSchema,
  addOrSetStorybookMemoriesSchema,
  listStorybooksQuerySchema
} from '../validators/storybook.validator.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export class StorybookController {
  async listStorybooks(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const query = listStorybooksQuerySchema.parse(req.query);

    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await storybookService.listStorybooks(patientId, query, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }

  async getStorybook(req: Request, res: Response): Promise<void> {
    const storybookId = req.params.id as string;
    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await storybookService.getStorybookById(storybookId, {
      isPatientSession,
      accessRole,
      userId
    });

    sendSuccess(res, result);
  }

  async createStorybook(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const input = createStorybookSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await storybookService.createStorybook(patientId, userId, input);
    sendCreated(res, result);
  }

  async updateStorybook(req: Request, res: Response): Promise<void> {
    const storybookId = req.params.id as string;
    const input = updateStorybookSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await storybookService.updateStorybook(storybookId, userId, input);
    sendSuccess(res, result);
  }

  async deleteStorybook(req: Request, res: Response): Promise<void> {
    const storybookId = req.params.id as string;
    const userId = req.user!.id;

    const result = await storybookService.deleteStorybook(storybookId, userId);
    sendSuccess(res, result);
  }

  async addOrSetMemories(req: Request, res: Response): Promise<void> {
    const storybookId = req.params.id as string;
    const input = addOrSetStorybookMemoriesSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await storybookService.addOrSetMemories(storybookId, userId, input);
    sendSuccess(res, result);
  }

  async removeMemory(req: Request, res: Response): Promise<void> {
    const storybookId = req.params.id as string;
    const memoryId = req.params.memoryId as string;
    const userId = req.user!.id;

    const result = await storybookService.removeMemory(storybookId, memoryId, userId);
    sendSuccess(res, result);
  }
}

export const storybookController = new StorybookController();

