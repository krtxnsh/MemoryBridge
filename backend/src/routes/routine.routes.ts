import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { routineController } from '../controllers/routine.controller.js';
import { authenticate, requirePatientAccess, authenticateUserOrPatient } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';

const router = Router();

async function resolveRoutinePatientId(req: any): Promise<string | undefined> {
  const item = await prisma.routineItem.findUnique({
    where: { id: req.params.id as string },
    select: { patientId: true }
  });
  return item?.patientId;
}

// 1. List Routine (Patient tablet and Caregiver)
router.get(
  '/patients/:patientId/routine',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    routineController.listRoutine(req, res, next);
  }
);

// 2. Add Routine Item
router.post(
  '/patients/:patientId/routine',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => {
    routineController.createRoutineItem(req, res, next);
  }
);

// 3. Toggle Complete (Accessible in Patient tablet mode!)
router.patch(
  '/routine/:id/complete',
  authenticateUserOrPatient(AccessRole.FAMILY),
  (req, res, next) => {
    routineController.toggleComplete(req, res, next);
  }
);

// 4. Delete Routine Item
router.delete(
  '/routine/:id',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolveRoutinePatientId),
  (req, res, next) => {
    routineController.deleteRoutineItem(req, res, next);
  }
);

export default router;
