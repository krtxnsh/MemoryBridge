import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { dashboardController } from '../controllers/dashboard.controller.js';

const router = Router();

// --- Patient Dashboard & Aggregated View ---
router.get(
  '/patients/:patientId/dashboard',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => dashboardController.getDashboard(req, res).catch(next)
);

// --- Patient Memory Graph View ---
router.get(
  '/patients/:patientId/graph',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => dashboardController.getGraph(req, res).catch(next)
);

export default router;

