import { Router } from 'express';
import { AccessRole } from '@prisma/client';
import { mediaController } from '../controllers/media.controller.js';
import { authenticate, requirePatientAccess, authenticateUserOrPatient } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';

const router = Router();

async function resolveMediaPatientId(req: any): Promise<string | undefined> {
  const media = await prisma.media.findUnique({
    where: { id: req.params.id as string },
    select: { patientId: true }
  });
  return media?.patientId;
}

// 1. Request Signed Upload URL
router.post(
  '/patients/:patientId/media/upload-url',
  authenticate,
  requirePatientAccess(AccessRole.FAMILY),
  (req, res, next) => {
    mediaController.requestUploadUrl(req, res, next);
  }
);

// 2. Confirm Upload
router.post(
  '/patients/:patientId/media/confirm',
  authenticate,
  requirePatientAccess(AccessRole.FAMILY),
  (req, res, next) => {
    mediaController.confirmUpload(req, res, next);
  }
);

// 3. Get Media Signed Read URL
router.get(
  '/media/:id/url',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    mediaController.getMediaUrl(req, res, next);
  }
);

// 4. List Media for Memory
router.get(
  '/memories/:memoryId/media',
  authenticateUserOrPatient(AccessRole.VIEWER),
  (req, res, next) => {
    mediaController.listMediaForMemory(req, res, next);
  }
);

// 5. Delete Media
router.delete(
  '/media/:id',
  authenticate,
  requirePatientAccess(AccessRole.CAREGIVER, resolveMediaPatientId),
  (req, res, next) => {
    mediaController.deleteMedia(req, res, next);
  }
);

// 6. Local Storage Streaming Endpoints (Dev & Offline testing)
router.put('/storage/upload', (req, res, next) => {
  mediaController.handleLocalUpload(req, res, next);
});

router.get('/storage/file', (req, res, next) => {
  mediaController.handleLocalDownload(req, res, next);
});

export default router;
