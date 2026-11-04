import { Router, Request } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { searchRateLimiter, writeRateLimiter } from '../middleware/rateLimit.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { memoryController } from '../controllers/memory.controller.js';

const router = Router();

// Resolvers to look up patientId from memoryId or personId
export const resolvePatientFromMemory = async (req: Request): Promise<string | undefined> => {
  const memoryId = req.params.id as string | undefined;
  if (!memoryId) return undefined;
  const memory = await prisma.memory.findFirst({
    where: { id: memoryId, deletedAt: null },
    select: { patientId: true }
  });
  return memory?.patientId;
};

export const resolvePatientFromPerson = async (req: Request): Promise<string | undefined> => {
  const personId = req.params.id as string | undefined;
  if (!personId) return undefined;
  const person = await prisma.person.findFirst({
    where: { id: personId, deletedAt: null },
    select: { patientId: true }
  });
  return person?.patientId;
};

// 1. Patient-nested memory routes: /patients/:patientId/memories
router.get(
  '/patients/:patientId/memories',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => memoryController.listOrSearchMemories(req, res).catch(next)
);

router.get(
  '/patients/:patientId/memories/search',
  authenticate,
  validateUuidParams('patientId'),
  searchRateLimiter,
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => memoryController.listOrSearchMemories(req, res).catch(next)
);

router.post(
  '/patients/:patientId/memories',
  authenticate,
  validateUuidParams('patientId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY),
  (req, res, next) => memoryController.createMemory(req, res).catch(next)
);

// 2. Direct memory routes: /memories/:id
router.get(
  '/memories/:id',
  authenticate,
  validateUuidParams('id'),
  requirePatientAccess(AccessRole.VIEWER, resolvePatientFromMemory, {
    allowPatient: true,
    notFoundCode: 'MEMORY_NOT_FOUND',
    notFoundMessage: 'Memory not found.'
  }),
  (req, res, next) => memoryController.getMemory(req, res).catch(next)
);

router.patch(
  '/memories/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromMemory, {
    notFoundCode: 'MEMORY_NOT_FOUND',
    notFoundMessage: 'Memory not found.'
  }),
  (req, res, next) => memoryController.updateMemory(req, res).catch(next)
);

router.delete(
  '/memories/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromMemory, {
    notFoundCode: 'MEMORY_NOT_FOUND',
    notFoundMessage: 'Memory not found.'
  }),
  (req, res, next) => memoryController.deleteMemory(req, res).catch(next)
);

// 3. Memory ↔ People associations
router.put(
  '/memories/:id/people',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromMemory, {
    notFoundCode: 'MEMORY_NOT_FOUND',
    notFoundMessage: 'Memory not found.'
  }),
  (req, res, next) => memoryController.setMemoryPeople(req, res).catch(next)
);

router.post(
  '/memories/:id/people/:personId',
  authenticate,
  validateUuidParams('id', 'personId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromMemory, {
    notFoundCode: 'MEMORY_NOT_FOUND',
    notFoundMessage: 'Memory not found.'
  }),
  (req, res, next) => memoryController.addPerson(req, res).catch(next)
);

router.delete(
  '/memories/:id/people/:personId',
  authenticate,
  validateUuidParams('id', 'personId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromMemory, {
    notFoundCode: 'MEMORY_NOT_FOUND',
    notFoundMessage: 'Memory not found.'
  }),
  (req, res, next) => memoryController.removePerson(req, res).catch(next)
);

// 4. Memories for person: /people/:id/memories
router.get(
  '/people/:id/memories',
  authenticate,
  validateUuidParams('id'),
  requirePatientAccess(AccessRole.VIEWER, resolvePatientFromPerson, {
    allowPatient: true,
    notFoundCode: 'PERSON_NOT_FOUND',
    notFoundMessage: 'Person not found.'
  }),
  (req, res, next) => memoryController.getMemoriesForPerson(req, res).catch(next)
);

export default router;
