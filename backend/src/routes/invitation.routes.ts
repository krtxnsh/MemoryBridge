import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { invitationController } from '../controllers/invitation.controller.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post(
  '/patients/:patientId/invitations',
  validateUuidParams('patientId'),
  authenticate,
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => invitationController.create(req, res, next)
);

router.get(
  '/patients/:patientId/invitations',
  validateUuidParams('patientId'),
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => invitationController.list(req, res, next)
);

router.delete(
  '/patients/:patientId/invitations/:invitationId',
  validateUuidParams('patientId', 'invitationId'),
  authenticate,
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => invitationController.revoke(req, res, next)
);

router.post(
  '/invitations/redeem',
  authenticate,
  writeRateLimiter,
  (req, res, next) => invitationController.redeem(req, res, next)
);

export default router;
