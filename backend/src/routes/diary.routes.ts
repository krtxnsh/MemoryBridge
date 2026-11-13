import { Router, Request } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { diaryController } from '../controllers/diary.controller.js';

const router = Router();

export const resolvePatientFromDiaryId = async (req: Request): Promise<string | undefined> => {
  const diaryId = req.params.id as string | undefined;
  if (!diaryId) return undefined;
  const entry = await prisma.diaryEntry.findUnique({
    where: { id: diaryId },
    select: { patientId: true }
  });
  return entry?.patientId;
};

// --- Patient-nested Diary Routes ---
router.get(
  '/patients/:patientId/diary',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => diaryController.listDiary(req, res).catch(next)
);

router.post(
  '/patients/:patientId/diary',
  authenticate,
  validateUuidParams('patientId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => diaryController.createOrUpsertDiary(req, res).catch(next)
);

// --- Direct Diary Routes ---
router.get(
  '/diary/:id',
  authenticate,
  validateUuidParams('id'),
  requirePatientAccess(AccessRole.VIEWER, resolvePatientFromDiaryId, {
    allowPatient: true,
    notFoundCode: 'DIARY_NOT_FOUND',
    notFoundMessage: 'Diary entry not found.'
  }),
  (req, res, next) => diaryController.getDiary(req, res).catch(next)
);

router.patch(
  '/diary/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromDiaryId, {
    notFoundCode: 'DIARY_NOT_FOUND',
    notFoundMessage: 'Diary entry not found.'
  }),
  (req, res, next) => diaryController.updateDiary(req, res).catch(next)
);

router.delete(
  '/diary/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromDiaryId, {
    notFoundCode: 'DIARY_NOT_FOUND',
    notFoundMessage: 'Diary entry not found.'
  }),
  (req, res, next) => diaryController.deleteDiary(req, res).catch(next)
);

export default router;

