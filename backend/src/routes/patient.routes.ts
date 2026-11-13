import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { patientController } from '../controllers/patient.controller.js';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { validateUuidParams } from '../validators/common.validator.js';

const router = Router();

// GET /api/v1/patients - List patients accessible to current user
router.get('/patients', authenticate, (req, res, next) => {
  patientController.listPatients(req, res, next);
});

// POST /api/v1/patients - Create a new patient profile (creator becomes OWNER)
router.post('/patients', authenticate, (req, res, next) => {
  patientController.createPatient(req, res, next);
});

// GET /api/v1/patients/:patientId - View patient details (requires VIEWER access or Patient Token)
router.get(
  '/patients/:patientId',
  validateUuidParams('patientId'),
  authenticate,
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => {
    patientController.getPatient(req, res, next);
  }
);

// PATCH /api/v1/patients/:patientId - Update profile (OWNER or CAREGIVER)
router.patch(
  '/patients/:patientId',
  validateUuidParams('patientId'),
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => {
    patientController.updatePatient(req, res, next);
  }
);

// DELETE /api/v1/patients/:patientId - Soft delete profile (OWNER only)
router.delete(
  '/patients/:patientId',
  validateUuidParams('patientId'),
  authenticate,
  requirePatientAccess(AccessRole.OWNER),
  (req, res, next) => {
    patientController.deletePatient(req, res, next);
  }
);

// Patient Session Management (token issuance & revocation)

// POST /api/v1/patients/:patientId/patient-sessions - Issue time-limited patient tablet token
router.post(
  '/patients/:patientId/patient-sessions',
  validateUuidParams('patientId'),
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => {
    patientController.createPatientSession(req, res, next);
  }
);

// GET /api/v1/patients/:patientId/patient-sessions - List active sessions
router.get(
  '/patients/:patientId/patient-sessions',
  validateUuidParams('patientId'),
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => {
    patientController.listPatientSessions(req, res, next);
  }
);

// DELETE /api/v1/patient-sessions/:id - Revoke patient session
router.delete(
  '/patient-sessions/:id',
  validateUuidParams('id'),
  authenticate,
  (req, res, next) => {
    patientController.revokePatientSession(req, res, next);
  }
);

export default router;
