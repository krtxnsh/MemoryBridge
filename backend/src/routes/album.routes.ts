import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { albumController } from '../controllers/album.controller.js';
import { authenticate, requirePatientAccess, authenticateUserOrPatient } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';

const router = Router();

async function resolveAlbumPatientId(req: any): Promise<string | undefined> {
  const album = await prisma.album.findUnique({
    where: { id: req.params.id as string },
    select: { patientId: true }
  });
  return album?.patientId;
}

async function resolveStorybookPatientId(req: any): Promise<string | undefined> {
  const storybook = await prisma.storybook.findUnique({
    where: { id: req.params.id as string },
    select: { patientId: true }
  });
  return storybook?.patientId;
}

// Albums
router.get(
  '/patients/:patientId/albums',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    albumController.listAlbums(req, res, next);
  }
);

router.post(
  '/patients/:patientId/albums',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => {
    albumController.createAlbum(req, res, next);
  }
);

router.put(
  '/albums/:id',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolveAlbumPatientId),
  (req, res, next) => {
    albumController.updateAlbum(req, res, next);
  }
);

router.delete(
  '/albums/:id',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolveAlbumPatientId),
  (req, res, next) => {
    albumController.deleteAlbum(req, res, next);
  }
);

// Storybooks
router.get(
  '/patients/:patientId/storybooks',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    albumController.listStorybooks(req, res, next);
  }
);

router.post(
  '/patients/:patientId/storybooks',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER),
  (req, res, next) => {
    albumController.createStorybook(req, res, next);
  }
);

router.post(
  '/storybooks/:id/memories',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolveStorybookPatientId),
  (req, res, next) => {
    albumController.reorderStorybookMemories(req, res, next);
  }
);

export default router;
