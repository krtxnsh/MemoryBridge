import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { memoryController } from '../controllers/memory.controller.js';
import { authenticate, requirePatientAccess, authenticateUserOrPatient } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';

const router = Router();

// Helper resolver for memory endpoints that only have :id in params
async function resolveMemoryPatientId(req: any): Promise<string | undefined> {
  const memoryId = req.params.id as string;
  const memory = await prisma.memory.findUnique({
    where: { id: memoryId },
    select: { patientId: true }
  });
  return memory?.patientId;
}

// 1. List & Search (Supports both Caregiver and Patient Tablet mode)
router.get(
  '/patients/:patientId/memories',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    memoryController.listMemories(req, res, next);
  }
);

router.get(
  '/patients/:patientId/memories/search',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    memoryController.searchMemories(req, res, next);
  }
);

// 2. Create Memory (Family submissions start as PENDING; Caregiver starts as VERIFIED)
router.post(
  '/patients/:patientId/memories',
  authenticate,
  requirePatientAccess(AccessRole.FAMILY),
  (req, res, next) => {
    memoryController.createMemory(req, res, next);
  }
);

// 3. Memory Detail
router.get(
  '/memories/:id',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    memoryController.getMemory(req, res, next);
  }
);

// 4. Update Memory
router.patch(
  '/memories/:id',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolveMemoryPatientId),
  (req, res, next) => {
    memoryController.updateMemory(req, res, next);
  }
);

// 5. Delete Memory
router.delete(
  '/memories/:id',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolveMemoryPatientId),
  (req, res, next) => {
    memoryController.deleteMemory(req, res, next);
  }
);

// 6. Verify Memory
router.post(
  '/memories/:id/verify',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolveMemoryPatientId),
  (req, res, next) => {
    memoryController.verifyMemory(req, res, next);
  }
);

// 7. Reject Memory
router.post(
  '/memories/:id/reject',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolveMemoryPatientId),
  (req, res, next) => {
    memoryController.rejectMemory(req, res, next);
  }
);

// 8. Verification Audit Trail
router.get(
  '/patients/:patientId/verifications',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => {
    memoryController.listVerifications(req, res, next);
  }
);

export default router;
