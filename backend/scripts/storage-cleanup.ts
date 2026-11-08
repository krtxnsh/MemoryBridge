import { MediaUploadStatus } from '@prisma/client';
import { prisma } from '../src/config/prisma';
import { storage } from '../src/storage';
import { logger } from '../src/config/logger';

export async function cleanupExpiredUploads(): Promise<{
  expiredIntentsCleaned: number;
  errors: number;
}> {
  const now = new Date();
  logger.info({ at: now.toISOString() }, 'Starting storage cleanup of expired upload intents...');

  const expiredIntents = await prisma.mediaUpload.findMany({
    where: {
      status: MediaUploadStatus.PENDING,
      expiresAt: { lt: now }
    }
  });

  logger.info({ count: expiredIntents.length }, 'Found pending expired upload intents');

  let expiredIntentsCleaned = 0;
  let errors = 0;

  for (const intent of expiredIntents) {
    try {
      // 1. Delete physical storage object if it exists
      await storage.deleteObject(intent.storagePath).catch(() => {});

      // 2. Mark intent as EXPIRED
      await prisma.mediaUpload.update({
        where: { id: intent.id },
        data: { status: MediaUploadStatus.EXPIRED }
      });

      expiredIntentsCleaned++;
    } catch (err: any) {
      errors++;
      logger.error(
        { intentId: intent.id, storagePath: intent.storagePath, err: err.message },
        'Failed to clean up expired upload intent'
      );
    }
  }

  logger.info(
    { expiredIntentsCleaned, errors },
    'Completed storage cleanup of expired upload intents'
  );

  return { expiredIntentsCleaned, errors };
}

// Run immediately if executed directly via CLI
if (process.argv[1] && process.argv[1].includes('storage-cleanup')) {
  cleanupExpiredUploads()
    .then((stats) => {
      console.log(`Cleanup completed: ${stats.expiredIntentsCleaned} expired intents updated, ${stats.errors} errors.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal cleanup error:', err);
      process.exit(1);
    });
}
