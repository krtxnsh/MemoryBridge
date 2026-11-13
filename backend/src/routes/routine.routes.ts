import { Router, Request } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { routineController } from '../controllers/routine.controller.js';

const router = Router();

export const resolvePatientFromRoutineId = async (req: Request): Promise<string | undefined> => {
  const routineId = req.params.id as string | undefined;
  if (!routineId) return undefined;
  const item = await prisma.routineItem.findUnique({
    where: { id: routineId },
    select: { patientId: true }
  });
  return item?.patientId;
};

// --- Patient-nested Routine Routes ---
router.get(
  '/patients/:patientId/routine',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => routineController.listRoutine(req, res).catch(next)
);

router.post(
  '/patients/:patientId/routine',
  authenticate,
  validateUuidParams('patientId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => routineController.createRoutine(req, res).catch(next)
);

// --- Direct Routine Routes ---
router.get(
  '/routine/:id',
  authenticate,
  validateUuidParams('id'),
  requirePatientAccess(AccessRole.VIEWER, resolvePatientFromRoutineId, {
    allowPatient: true,
    notFoundCode: 'ROUTINE_NOT_FOUND',
    notFoundMessage: 'Routine item not found.'
  }),
  (req, res, next) => routineController.getRoutine(req, res).catch(next)
);

router.patch(
  '/routine/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromRoutineId, {
    notFoundCode: 'ROUTINE_NOT_FOUND',
    notFoundMessage: 'Routine item not found.'
  }),
  (req, res, next) => routineController.updateRoutine(req, res).catch(next)
);

router.patch(
  '/routine/:id/complete',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromRoutineId, {
    allowPatient: true,
    notFoundCode: 'ROUTINE_NOT_FOUND',
    notFoundMessage: 'Routine item not found.'
  }),
  (req, res, next) => routineController.completeRoutine(req, res).catch(next)
);

router.delete(
  '/routine/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromRoutineId, {
    notFoundCode: 'ROUTINE_NOT_FOUND',
    notFoundMessage: 'Routine item not found.'
  }),
  (req, res, next) => routineController.deleteRoutine(req, res).catch(next)
);

export default router;

