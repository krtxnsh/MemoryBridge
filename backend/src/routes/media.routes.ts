import { Router, Request } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { authenticate, requirePatientAccess } from '../middleware/auth';
import {
  uploadUrlRateLimiter,
  confirmRateLimiter,
  mediaUrlRateLimiter,
  writeRateLimiter
} from '../middleware/rateLimit';
import { validateUuidParams } from '../validators/common.validator';
import { mediaController } from '../controllers/media.controller';

const router = Router();

export const resolvePatientFromMedia = async (req: Request): Promise<string | undefined> => {
  const mediaId = req.params.id as string | undefined;
  if (!mediaId) return undefined;
  const media = await prisma.media.findFirst({
    where: { id: mediaId, deletedAt: null },
    select: { patientId: true }
  });
  return media?.patientId;
};

// 1. POST /patients/:patientId/media/upload-url
router.post(
  '/patients/:patientId/media/upload-url',
  authenticate,
  validateUuidParams('patientId'),
  uploadUrlRateLimiter,
  requirePatientAccess(AccessRole.FAMILY),
  (req, res, next) => mediaController.createUploadUrl(req, res).catch(next)
);

// 2. POST /patients/:patientId/media/confirm
router.post(
  '/patients/:patientId/media/confirm',
  authenticate,
  validateUuidParams('patientId'),
  confirmRateLimiter,
  requirePatientAccess(AccessRole.FAMILY),
  (req, res, next) => mediaController.confirmUpload(req, res).catch(next)
);

// 3. GET /patients/:patientId/media
router.get(
  '/patients/:patientId/media',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, {
    allowPatient: true,
    notFoundCode: 'PATIENT_NOT_FOUND',
    notFoundMessage: 'Patient resource not found.'
  }),
  (req, res, next) => mediaController.listMedia(req, res).catch(next)
);

// 4. GET /media/:id/url
router.get(
  '/media/:id/url',
  authenticate,
  validateUuidParams('id'),
  mediaUrlRateLimiter,
  requirePatientAccess(AccessRole.VIEWER, resolvePatientFromMedia, {
    allowPatient: true,
    notFoundCode: 'MEDIA_NOT_FOUND',
    notFoundMessage: 'Media resource not found.'
  }),
  (req, res, next) => mediaController.getMediaUrl(req, res).catch(next)
);

// 5. PATCH /media/:id
router.patch(
  '/media/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromMedia, {
    notFoundCode: 'MEDIA_NOT_FOUND',
    notFoundMessage: 'Media resource not found.'
  }),
  (req, res, next) => mediaController.updateMedia(req, res).catch(next)
);

// 6. DELETE /media/:id
router.delete(
  '/media/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.FAMILY, resolvePatientFromMedia, {
    notFoundCode: 'MEDIA_NOT_FOUND',
    notFoundMessage: 'Media resource not found.'
  }),
  (req, res, next) => mediaController.deleteMedia(req, res).catch(next)
);

export default router;

