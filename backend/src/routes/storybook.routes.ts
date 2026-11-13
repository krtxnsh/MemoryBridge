import { Router, Request } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { storybookController } from '../controllers/storybook.controller.js';

const router = Router();

export const resolvePatientFromStorybookId = async (req: Request): Promise<string | undefined> => {
  const storybookId = req.params.id as string | undefined;
  if (!storybookId) return undefined;
  const sb = await prisma.storybook.findFirst({
    where: { id: storybookId, deletedAt: null },
    select: { patientId: true }
  });
  return sb?.patientId;
};

// --- Patient-nested Storybook Routes ---
router.get(
  '/patients/:patientId/storybooks',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => storybookController.listStorybooks(req, res).catch(next)
);

router.post(
  '/patients/:patientId/storybooks',
  authenticate,
  validateUuidParams('patientId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => storybookController.createStorybook(req, res).catch(next)
);

// --- Direct Storybook Routes ---
router.get(
  '/storybooks/:id',
  authenticate,
  validateUuidParams('id'),
  requirePatientAccess(AccessRole.VIEWER, resolvePatientFromStorybookId, {
    allowPatient: true,
    notFoundCode: 'STORYBOOK_NOT_FOUND',
    notFoundMessage: 'Storybook not found.'
  }),
  (req, res, next) => storybookController.getStorybook(req, res).catch(next)
);

router.patch(
  '/storybooks/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromStorybookId, {
    notFoundCode: 'STORYBOOK_NOT_FOUND',
    notFoundMessage: 'Storybook not found.'
  }),
  (req, res, next) => storybookController.updateStorybook(req, res).catch(next)
);

router.delete(
  '/storybooks/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromStorybookId, {
    notFoundCode: 'STORYBOOK_NOT_FOUND',
    notFoundMessage: 'Storybook not found.'
  }),
  (req, res, next) => storybookController.deleteStorybook(req, res).catch(next)
);

// --- Storybook Memory Reordering & Management ---
router.post(
  '/storybooks/:id/memories',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromStorybookId, {
    notFoundCode: 'STORYBOOK_NOT_FOUND',
    notFoundMessage: 'Storybook not found.'
  }),
  (req, res, next) => storybookController.addOrSetMemories(req, res).catch(next)
);

router.delete(
  '/storybooks/:id/memories/:memoryId',
  authenticate,
  validateUuidParams('id', 'memoryId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromStorybookId, {
    notFoundCode: 'STORYBOOK_NOT_FOUND',
    notFoundMessage: 'Storybook not found.'
  }),
  (req, res, next) => storybookController.removeMemory(req, res).catch(next)
);

export default router;

