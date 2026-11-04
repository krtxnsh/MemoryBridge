import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { personController } from '../controllers/person.controller.js';
import { authenticate, requirePatientAccess, authenticateUserOrPatient } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';

const router = Router();

async function resolvePersonPatientId(req: any): Promise<string | undefined> {
  const personId = req.params.id as string;
  const person = await prisma.person.findUnique({
    where: { id: personId },
    select: { patientId: true }
  });
  return person?.patientId;
}

// 1. List Family & Friends
router.get(
  '/patients/:patientId/people',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    personController.listPeople(req, res, next);
  }
);

// 2. Person Detail
router.get(
  '/people/:id',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    personController.getPerson(req, res, next);
  }
);

// 3. Add Person
router.post(
  '/patients/:patientId/people',
  authenticate,
  requirePatientAccess(AccessRole.FAMILY),
  (req, res, next) => {
    personController.createPerson(req, res, next);
  }
);

// 4. Update Person
router.patch(
  '/people/:id',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePersonPatientId),
  (req, res, next) => {
    personController.updatePerson(req, res, next);
  }
);

// 5. Delete Person
router.delete(
  '/people/:id',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePersonPatientId),
  (req, res, next) => {
    personController.deletePerson(req, res, next);
  }
);

// 6. Relationships
router.get(
  '/patients/:patientId/relationships',
  authenticate,
  requirePatientAccess(AccessRole.VIEWER),
  (req, res, next) => {
    personController.listRelationships(req, res, next);
  }
);

router.post(
  '/patients/:patientId/relationships',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => {
    personController.createRelationship(req, res, next);
  }
);

// 7. Graph
router.get(
  '/patients/:patientId/graph',
  authenticate,
  requirePatientAccess(AccessRole.VIEWER),
  (req, res, next) => {
    personController.getGraph(req, res, next);
  }
);

export default router;
