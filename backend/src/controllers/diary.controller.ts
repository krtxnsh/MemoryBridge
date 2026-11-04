import { Request, Response, NextFunction } from 'express';
import { diaryService } from '../services/diary.service.js';
import { upsertDiarySchema } from '../validators/core.validator.js';
import { sendSuccess } from '../utils/response.js';

export class DiaryController {
  async getDiary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient?.id || req.patientSession?.patientId || (req.params.patientId as string);
      const dateStr = (req.query.date as string) || new Date().toISOString().slice(0, 10);

      const entry = await diaryService.getDiaryEntry(patientId, dateStr);
      sendSuccess(res, entry);
    } catch (err) {
      next(err);
    }
  }

  async upsertDiary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const patientId = req.patient!.id;
      const validated = upsertDiarySchema.parse(req.body);

      const entry = await diaryService.upsertDiaryEntry(patientId, validated);
      sendSuccess(res, entry);
    } catch (err) {
      next(err);
    }
  }
}

export const diaryController = new DiaryController();
