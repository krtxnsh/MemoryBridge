import crypto from 'crypto';
import path from 'path';
import { MediaType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { storageProvider } from './storage/index.js';
import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_MIME_TYPES: Record<string, { type: MediaType; maxSize: number; ext: string }> = {
  // Images (10 MB)
  'image/jpeg': { type: MediaType.IMAGE, maxSize: 10 * 1024 * 1024, ext: 'jpg' },
  'image/png': { type: MediaType.IMAGE, maxSize: 10 * 1024 * 1024, ext: 'png' },
  'image/webp': { type: MediaType.IMAGE, maxSize: 10 * 1024 * 1024, ext: 'webp' },
  // Audio (25 MB)
  'audio/mpeg': { type: MediaType.AUDIO, maxSize: 25 * 1024 * 1024, ext: 'mp3' },
  'audio/mp4': { type: MediaType.AUDIO, maxSize: 25 * 1024 * 1024, ext: 'm4a' },
  'audio/wav': { type: MediaType.AUDIO, maxSize: 25 * 1024 * 1024, ext: 'wav' },
  // Video (200 MB)
  'video/mp4': { type: MediaType.VIDEO, maxSize: 200 * 1024 * 1024, ext: 'mp4' },
  'video/webm': { type: MediaType.VIDEO, maxSize: 200 * 1024 * 1024, ext: 'webm' }
};

export class MediaService {
  validateMimeAndSize(mimeType: string, sizeBytes: number) {
    const config = ALLOWED_MIME_TYPES[mimeType.toLowerCase()];
    if (!config) {
      throw new AppError(
        'UNSUPPORTED_MEDIA_TYPE',
        `Unsupported media type: ${mimeType}. Allowed formats: JPG, PNG, WEBP, MP3, M4A, WAV, MP4, WEBM.`,
        415
      );
    }

    if (sizeBytes > config.maxSize) {
      const maxMb = config.maxSize / (1024 * 1024);
      throw new AppError(
        'FILE_TOO_LARGE',
        `File size (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${maxMb} MB.`,
        413
      );
    }

    return config;
  }

  async requestUploadUrl(patientId: string, mimeType: string, sizeBytes: number, fileName: string) {
    const config = this.validateMimeAndSize(mimeType, sizeBytes);
    const uniqueId = crypto.randomUUID();
    const storagePath = `patients/${patientId}/${uniqueId}.${config.ext}`;

    const uploadUrl = await storageProvider.generateUploadUrl(storagePath, mimeType, 900);

    return {
      uploadUrl,
      storagePath,
      fileName,
      mimeType,
      mediaType: config.type,
      sizeBytes,
      expiresInSec: 900
    };
  }

  async confirmUpload(
    patientId: string,
    userId: string,
    storagePath: string,
    fileName: string,
    mimeType: string,
    sizeBytes: number,
    memoryId?: string,
    caption?: string
  ) {
    const config = this.validateMimeAndSize(mimeType, sizeBytes);

    // Verify object exists in storage
    const objectInfo = await storageProvider.verifyObjectExists(storagePath);
    if (!objectInfo.exists) {
      throw new AppError('FILE_NOT_FOUND_IN_STORAGE', 'The uploaded file was not found in storage. Upload may have failed.', 400);
    }

    return prisma.$transaction(async (tx) => {
      const media = await tx.media.create({
        data: {
          patientId,
          memoryId: memoryId || null,
          mediaType: config.type,
          storagePath,
          fileName,
          mimeType,
          sizeBytes: objectInfo.sizeBytes || sizeBytes,
          caption: caption || null,
          uploadedBy: userId
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'CREATE_MEDIA',
          resourceType: 'Media',
          resourceId: media.id,
          metadata: { fileName, mediaType: media.mediaType }
        }
      });

      const readUrl = await storageProvider.generateReadUrl(storagePath, 900);

      return {
        ...media,
        readUrl
      };
    });
  }

  async getMediaUrl(mediaId: string) {
    const media = await prisma.media.findFirst({
      where: { id: mediaId, deletedAt: null }
    });

    if (!media) {
      throw new AppError('MEDIA_NOT_FOUND', 'Media not found', 404);
    }

    const readUrl = await storageProvider.generateReadUrl(media.storagePath, 900);

    return {
      id: media.id,
      mediaType: media.mediaType,
      fileName: media.fileName,
      mimeType: media.mimeType,
      readUrl
    };
  }

  async listMediaForMemory(memoryId: string) {
    const mediaList = await prisma.media.findMany({
      where: { memoryId, deletedAt: null },
      orderBy: { createdAt: 'asc' }
    });

    const withUrls = await Promise.all(
      mediaList.map(async (m) => ({
        ...m,
        readUrl: await storageProvider.generateReadUrl(m.storagePath, 900)
      }))
    );

    return withUrls;
  }

  async deleteMedia(mediaId: string, userId: string, patientId: string) {
    const media = await prisma.media.update({
      where: { id: mediaId },
      data: { deletedAt: new Date() }
    });

    // Also delete physical object
    await storageProvider.deleteObject(media.storagePath);

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        patientId,
        action: 'DELETE_MEDIA',
        resourceType: 'Media',
        resourceId: mediaId
      }
    });

    return media;
  }
}

export const mediaService = new MediaService();
