import { env } from '../config/env';
import { storage } from '../storage';

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

