import { Request, Response } from 'express';
import { memoryService } from '../services/memory.service.js';
import {
  createMemorySchema,
  updateMemorySchema,
  setMemoryPeopleSchema,
  searchMemoryQuerySchema
} from '../validators/memory.validator.js';
import { paginationQuerySchema } from '../validators/common.validator.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export class MemoryController {
  async listOrSearchMemories(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const query = searchMemoryQuerySchema.parse(req.query);

    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await memoryService.listOrSearchMemories(
      patientId,
      query,
      { isPatientSession, accessRole, userId }
    );

    sendSuccess(res, result);
  }

  async getMemory(req: Request, res: Response): Promise<void> {
    const memoryId = req.params.id as string;
    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await memoryService.getMemoryById(
      memoryId,
      { isPatientSession, accessRole, userId }
    );

    sendSuccess(res, result);
  }

  async createMemory(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const input = createMemorySchema.parse(req.body);

    const userId = req.user!.id;
    const accessRole = req.patientAccess!.accessRole;

    const result = await memoryService.createMemory(
      patientId,
      userId,
      accessRole,
      input
    );

    sendCreated(res, result);
  }

  async updateMemory(req: Request, res: Response): Promise<void> {
    const memoryId = req.params.id as string;
    const input = updateMemorySchema.parse(req.body);

    const userId = req.user!.id;
    const accessRole = req.patientAccess!.accessRole;

    const result = await memoryService.updateMemory(
      memoryId,
      userId,
      accessRole,
      input
    );

    sendSuccess(res, result);
  }

  async deleteMemory(req: Request, res: Response): Promise<void> {
    const memoryId = req.params.id as string;
    const userId = req.user!.id;
    const accessRole = req.patientAccess!.accessRole;

    const result = await memoryService.deleteMemory(
      memoryId,
      userId,
      accessRole
    );

    sendSuccess(res, result);
  }

  async setMemoryPeople(req: Request, res: Response): Promise<void> {
    const memoryId = req.params.id as string;
    const input = setMemoryPeopleSchema.parse(req.body);

    const userId = req.user!.id;
    const accessRole = req.patientAccess!.accessRole;

    const result = await memoryService.setMemoryPeople(
      memoryId,
      input.personIds,
      userId,
      accessRole
    );

    sendSuccess(res, result);
  }

  async addPerson(req: Request, res: Response): Promise<void> {
    const memoryId = req.params.id as string;
    const personId = req.params.personId as string;

    const userId = req.user!.id;
    const accessRole = req.patientAccess!.accessRole;

    const result = await memoryService.addPersonToMemory(
      memoryId,
      personId,
      userId,
      accessRole
    );

    sendSuccess(res, result);
  }

  async removePerson(req: Request, res: Response): Promise<void> {
    const memoryId = req.params.id as string;
    const personId = req.params.personId as string;

    const userId = req.user!.id;
    const accessRole = req.patientAccess!.accessRole;

    const result = await memoryService.removePersonFromMemory(
      memoryId,
      personId,
      userId,
      accessRole
    );

    sendSuccess(res, result);
  }

  async getMemoriesForPerson(req: Request, res: Response): Promise<void> {
    const personId = req.params.id as string;
    const query = paginationQuerySchema.parse(req.query);

    const isPatientSession = Boolean(req.patientSession);
    const accessRole = req.patientAccess?.accessRole;
    const userId = req.user?.id;

    const result = await memoryService.getMemoriesForPerson(
      personId,
      query,
      { isPatientSession, accessRole, userId }
    );

    sendSuccess(res, result);
  }
}

export const memoryController = new MemoryController();
