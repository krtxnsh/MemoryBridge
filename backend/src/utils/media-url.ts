import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { storage } from '../storage';
import { AppError } from '../middleware/errorHandler';

/**
 * Resolves an image/media path to a signed URL or passes through relative app assets / external URLs.
 */
export async function resolveMediaUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) {
    return null;
  }

  // App-asset paths pass through directly
  if (pathOrUrl.startsWith('/assets/') || pathOrUrl.startsWith('assets/')) {
    return pathOrUrl;
  }

  // External URLs (if any exist in dev/demo) pass through
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  // Otherwise, it is a private storage path (e.g. patients/{id}/images/{uuid}.jpg)
  try {
    return await storage.createReadUrl(pathOrUrl, env.MEDIA_READ_URL_TTL_SEC);
  } catch {
    return null;
  }
}

/**
 * Validates that a profile/cover image path is either null, an app asset (/assets/...),
 * or a confirmed Media object belonging to the specified patient.
 */
export async function validateMediaStoragePath(
  patientId: string,
  storagePath: string | null | undefined
): Promise<void> {
  if (!storagePath) return;

  if (storagePath.startsWith('/assets/') || storagePath.startsWith('assets/')) {
    return;
  }

  const media = await prisma.media.findFirst({
    where: {
      storagePath,
      patientId,
      deletedAt: null
    }
  });

  if (!media) {
    throw new AppError(
      'INVALID_MEDIA_PATH',
      'Image path must be a relative asset path (/assets/...) or a confirmed media object belonging to this patient',
      400
    );
  }
}
