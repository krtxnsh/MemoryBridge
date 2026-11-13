import { Router, Request } from 'express';
import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { authenticate, requirePatientAccess } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { validateUuidParams } from '../validators/common.validator.js';
import { albumController } from '../controllers/album.controller.js';

const router = Router();

export const resolvePatientFromAlbumId = async (req: Request): Promise<string | undefined> => {
  const albumId = req.params.id as string | undefined;
  if (!albumId) return undefined;
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    select: { patientId: true }
  });
  return album?.patientId;
};

// --- Patient-nested Album Routes ---
router.get(
  '/patients/:patientId/albums',
  authenticate,
  validateUuidParams('patientId'),
  requirePatientAccess(AccessRole.VIEWER, undefined, { allowPatient: true }),
  (req, res, next) => albumController.listAlbums(req, res).catch(next)
);

router.post(
  '/patients/:patientId/albums',
  authenticate,
  validateUuidParams('patientId'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => albumController.createAlbum(req, res).catch(next)
);

// --- Direct Album Routes ---
router.get(
  '/albums/:id',
  authenticate,
  validateUuidParams('id'),
  requirePatientAccess(AccessRole.VIEWER, resolvePatientFromAlbumId, {
    allowPatient: true,
    notFoundCode: 'ALBUM_NOT_FOUND',
    notFoundMessage: 'Album not found.'
  }),
  (req, res, next) => albumController.getAlbum(req, res).catch(next)
);

router.patch(
  '/albums/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromAlbumId, {
    notFoundCode: 'ALBUM_NOT_FOUND',
    notFoundMessage: 'Album not found.'
  }),
  (req, res, next) => albumController.updateAlbum(req, res).catch(next)
);

router.delete(
  '/albums/:id',
  authenticate,
  validateUuidParams('id'),
  writeRateLimiter,
  requirePatientAccess(AccessRole.CAREGIVER, resolvePatientFromAlbumId, {
    notFoundCode: 'ALBUM_NOT_FOUND',
    notFoundMessage: 'Album not found.'
  }),
  (req, res, next) => albumController.deleteAlbum(req, res).catch(next)
);

export default router;
