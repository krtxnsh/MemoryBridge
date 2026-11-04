import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { diaryController } from '../controllers/diary.controller.js';
import { authenticate, requirePatientAccess, authenticateUserOrPatient } from '../middleware/auth.js';

const router = Router();

// 1. Get Diary by date
router.get(
  '/patients/:patientId/diary',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    diaryController.getDiary(req, res, next);
  }
);

// 2. Upsert Diary Entry
router.put(
  '/patients/:patientId/diary',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => {
    diaryController.upsertDiary(req, res, next);
  }
);

export default router;
