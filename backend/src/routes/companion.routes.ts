import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { companionController } from '../controllers/companion.controller.js';

const router = Router();

// GET /patients/:patientId/companion/state - Retrieve companion mascot state & prompt suggestions
router.get(
  '/patients/:patientId/companion/state',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => companionController.getState(req, res).catch(next)
);

// POST /patients/:patientId/companion/message - Process conversational interaction with deterministic memory grounding
router.post(
  '/patients/:patientId/companion/message',
  authenticate,
  validateUuidParams('patientId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => companionController.sendMessage(req, res).catch(next)
);

export default router;

