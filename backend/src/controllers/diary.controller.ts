import { Request, Response } from 'express';
import { diaryService } from '../services/diary.service.js';
import {
  createDiarySchema,
  updateDiarySchema,
  listDiaryQuerySchema
} from '../validators/diary.validator.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export class DiaryController {
  async listDiary(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const query = listDiaryQuerySchema.parse(req.query);

    const result = await diaryService.listDiary(patientId, query);
    sendSuccess(res, result);
  }

  async getDiary(req: Request, res: Response): Promise<void> {
    const diaryId = req.params.id as string;
    const result = await diaryService.getDiaryById(diaryId);
    sendSuccess(res, result);
  }

  async createOrUpsertDiary(req: Request, res: Response): Promise<void> {
    const patientId = req.params.patientId as string;
    const input = createDiarySchema.parse(req.body);
    const userId = req.user!.id;

    const result = await diaryService.createOrUpsertDiary(patientId, userId, input);
    sendCreated(res, result);
  }

  async updateDiary(req: Request, res: Response): Promise<void> {
    const diaryId = req.params.id as string;
    const input = updateDiarySchema.parse(req.body);
    const userId = req.user!.id;

    const result = await diaryService.updateDiary(diaryId, userId, input);
    sendSuccess(res, result);
  }

  async deleteDiary(req: Request, res: Response): Promise<void> {
    const diaryId = req.params.id as string;
    const userId = req.user!.id;

    const result = await diaryService.deleteDiary(diaryId, userId);
    sendSuccess(res, result);
  }
}

export const diaryController = new DiaryController();

