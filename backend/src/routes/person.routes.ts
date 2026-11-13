import { Router, Request } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { personController } from '../controllers/person.controller.js';

const router = Router();

export const resolvePatientFromPersonId = async (req: Request): Promise<string | undefined> => {
  const personId = req.params.id as string | undefined;
  if (!personId) return undefined;
  const person = await prisma.person.findFirst({
    where: { id: personId, deletedAt: null },
    select: { patientId: true }
  });
  return person?.patientId;
};

export const resolvePatientFromRelationshipId = async (req: Request): Promise<string | undefined> => {
  const relationshipId = req.params.id as string | undefined;
  if (!relationshipId) return undefined;
  const rel = await prisma.relationship.findFirst({
    where: {
      id: relationshipId,
      personOne: { deletedAt: null },
      personTwo: { deletedAt: null }
    },
    select: { patientId: true }
  });
  return rel?.patientId;
};

// --- People Routes ---
router.get(
  '/patients/:patientId/people',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => personController.listPeople(req, res).catch(next)
);

router.post(
  '/patients/:patientId/people',
  authenticate,
  validateUuidParams('patientId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY),
  (req, res, next) => personController.createPerson(req, res).catch(next)
);

router.get(
  '/people/:id',
  authenticate,
  validateUuidParams('id'),
  requirePatientAccess(AccessRole.VIEWER, resolvePatientFromPersonId, {
    allowPatient: true,
    notFoundCode: 'PERSON_NOT_FOUND',
    notFoundMessage: 'Person not found.'
  }),
  (req, res, next) => personController.getPerson(req, res).catch(next)
);

router.patch(
  '/people/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromPersonId, {
    notFoundCode: 'PERSON_NOT_FOUND',
    notFoundMessage: 'Person not found.'
  }),
  (req, res, next) => personController.updatePerson(req, res).catch(next)
);

router.delete(
  '/people/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromPersonId, {
    notFoundCode: 'PERSON_NOT_FOUND',
    notFoundMessage: 'Person not found.'
  }),
  (req, res, next) => personController.deletePerson(req, res).catch(next)
);

// --- Relationship Routes ---
router.get(
  '/patients/:patientId/relationships',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => personController.listRelationships(req, res).catch(next)
);

router.post(
  '/patients/:patientId/relationships',
  authenticate,
  validateUuidParams('patientId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY),
  (req, res, next) => personController.createRelationship(req, res).catch(next)
);

router.get(
  '/relationships/:id',
  authenticate,
  validateUuidParams('id'),
  requirePatientAccess(AccessRole.VIEWER, resolvePatientFromRelationshipId, {
    allowPatient: true,
    notFoundCode: 'RELATIONSHIP_NOT_FOUND',
    notFoundMessage: 'Relationship not found.'
  }),
  (req, res, next) => personController.getRelationship(req, res).catch(next)
);

router.patch(
  '/relationships/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromRelationshipId, {
    notFoundCode: 'RELATIONSHIP_NOT_FOUND',
    notFoundMessage: 'Relationship not found.'
  }),
  (req, res, next) => personController.updateRelationship(req, res).catch(next)
);

router.delete(
  '/relationships/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromRelationshipId, {
    notFoundCode: 'RELATIONSHIP_NOT_FOUND',
    notFoundMessage: 'Relationship not found.'
  }),
  (req, res, next) => personController.deleteRelationship(req, res).catch(next)
);

export default router;
