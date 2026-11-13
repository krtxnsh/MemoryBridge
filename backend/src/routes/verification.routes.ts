import { Router, Request } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { verificationController } from '../controllers/verification.controller.js';

const router = Router();

export const resolvePatientFromMemoryReview = async (req: Request): Promise<string | undefined> => {
  const memoryId = (req.params.memoryId || req.params.id) as string | undefined;
  if (!memoryId) return undefined;
  const memory = await prisma.memory.findFirst({
    where: { id: memoryId, deletedAt: null },
    select: { patientId: true }
  });
  return memory?.patientId;
};

// --- Patient Verification History & Queue (OWNER / CAREGIVER) ---
router.get(
  '/patients/:patientId/verifications',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => verificationController.listVerifications(req, res).catch(next)
);

router.get(
  '/patients/:patientId/verifications/queue',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => verificationController.getQueue(req, res).catch(next)
);

// --- Memory Approval / Rejection (Family Verification) ---
router.post(
  '/memories/:memoryId/verify',
  authenticate,
  validateUuidParams('memoryId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromMemoryReview, {
    notFoundCode: 'MEMORY_NOT_FOUND',
    notFoundMessage: 'Memory not found.'
  }),
  (req, res, next) => verificationController.verifyMemory(req, res).catch(next)
);

router.post(
  '/memories/:memoryId/reject',
  authenticate,
  validateUuidParams('memoryId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromMemoryReview, {
    notFoundCode: 'MEMORY_NOT_FOUND',
    notFoundMessage: 'Memory not found.'
  }),
  (req, res, next) => verificationController.rejectMemory(req, res).catch(next)
);

export default router;

