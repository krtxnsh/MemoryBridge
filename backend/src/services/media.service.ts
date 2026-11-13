import path from 'path';
import crypto from 'crypto';
import {
  AccessRole,
  MediaType,
  MediaUploadPurpose,
  MediaUploadStatus,
  Prisma,
  VerificationStatus
} from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { mediaRepository } from '../repositories/media.repository';
import { storage } from '../storage';
import {
  validateMimeAndExtension,
  verifyFileSignature,
  sanitizeFileName
} from '../utils/media-sniffer';
import {
  CreateUploadUrlInput,
  ConfirmUploadInput,
  UpdateMediaInput,
  ListMediaQueryInput
} from '../validators/media.validator';

export class MediaService {
  /**
   * Helper to format media item with signed read URL
   */
  async formatMedia(media: any) {
    let url: string | null = null;
    try {
      url = await storage.createReadUrl(media.storagePath, env.MEDIA_READ_URL_TTL_SEC);
    } catch {
      url = null;
    }

    return {
      id: media.id,
      patientId: media.patientId,
      memoryId: media.memoryId,
      mediaType: media.mediaType,
      fileName: media.fileName,
      mimeType: media.mimeType,
      sizeBytes: media.sizeBytes,
      caption: media.caption,
      uploadedBy: media.uploadedBy,
      createdAt: media.createdAt,
      url
    };
  }

  /**
   * Generates a signed upload URL and creates a server-side MediaUpload intent.
   */
  async createUploadUrl(
    patientId: string,
    userId: string,
    accessRole: AccessRole | undefined,
    isPatientSession: boolean,
    input: CreateUploadUrlInput
  ) {
    // Patient session and VIEWER cannot upload media
    if (isPatientSession || accessRole === AccessRole.VIEWER) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions to upload media', 403);
    }

    // Role checks based on purpose
    if (input.purpose === MediaUploadPurpose.PATIENT_PROFILE) {
      if (accessRole !== AccessRole.OWNER && accessRole !== AccessRole.CAREGIVER) {
        throw new AppError('FORBIDDEN', 'Only OWNER and CAREGIVER can update patient profile image', 403);
      }
    } else if (
      input.purpose === MediaUploadPurpose.ALBUM_COVER ||
      input.purpose === MediaUploadPurpose.STORYBOOK_COVER
    ) {
      if (accessRole !== AccessRole.OWNER && accessRole !== AccessRole.CAREGIVER) {
        throw new AppError('FORBIDDEN', 'Only OWNER and CAREGIVER can update album/storybook cover', 403);
      }
    }

    // Validate MIME type and extension
    let spec;
    try {
      spec = validateMimeAndExtension(input.fileName, input.mimeType);
    } catch (err: any) {
      throw new AppError('INVALID_MEDIA_TYPE', err.message, 400);
    }

    // Validate max size for this type
    if (input.sizeBytes > spec.maxSizeBytes) {
      throw new AppError(
        'FILE_TOO_LARGE',
        `File exceeds maximum allowed size of ${spec.maxSizeBytes} bytes for ${spec.mediaType}`,
        400
      );
    }

    // Check patient storage quota
    const currentUsage = await mediaRepository.getPatientStorageUsageBytes(patientId);
    if (currentUsage + input.sizeBytes > env.PATIENT_STORAGE_QUOTA_BYTES) {
      throw new AppError(
        'STORAGE_QUOTA_EXCEEDED',
        `Patient storage quota of ${env.PATIENT_STORAGE_QUOTA_BYTES} bytes exceeded`,
        400
      );
    }

    // Check pending intent cap per user
    const pendingCount = await mediaRepository.countPendingIntentsForUser(userId);
    if (pendingCount >= env.MAX_PENDING_UPLOADS_PER_USER) {
      throw new AppError(
        'TOO_MANY_PENDING_UPLOADS',
        `You have ${pendingCount} pending uploads. Please complete or wait for them to expire.`,
        400
      );
    }

    // Cross-reference checks
    if (input.memoryId) {
      const memory = await prisma.memory.findFirst({
        where: { id: input.memoryId, patientId, deletedAt: null }
      });
      if (!memory) {
        throw new AppError('NOT_FOUND', 'Memory not found', 404);
      }
      const mediaCount = await mediaRepository.countMediaForMemory(input.memoryId);
      if (mediaCount >= env.MAX_MEDIA_PER_MEMORY) {
        throw new AppError(
          'MAX_MEDIA_REACHED',
          `Memory already has the maximum of ${env.MAX_MEDIA_PER_MEMORY} media items attached`,
          400
        );
      }
    }

    if (input.targetId) {
      if (input.purpose === MediaUploadPurpose.PERSON_PROFILE) {
        const person = await prisma.person.findFirst({
          where: { id: input.targetId, patientId, deletedAt: null }
        });
        if (!person) {
          throw new AppError('NOT_FOUND', 'Person not found', 404);
        }
      } else if (input.purpose === MediaUploadPurpose.ALBUM_COVER) {
        const album = await prisma.album.findFirst({
          where: { id: input.targetId, patientId }
        });
        if (!album) {
          throw new AppError('NOT_FOUND', 'Album not found', 404);
        }
      } else if (input.purpose === MediaUploadPurpose.STORYBOOK_COVER) {
        const storybook = await prisma.storybook.findFirst({
          where: { id: input.targetId, patientId, deletedAt: null }
        });
        if (!storybook) {
          throw new AppError('NOT_FOUND', 'Storybook not found', 404);
        }
      }
    }

    // Generate folder based on MediaType
    let folder = 'images';
    if (spec.mediaType === MediaType.VIDEO) folder = 'videos';
    if (spec.mediaType === MediaType.AUDIO) folder = 'audio';

    const ext = path.extname(input.fileName).toLowerCase() || spec.allowedExtensions[0];
    const uniqueKey = crypto.randomUUID();
    const storagePath = `patients/${patientId}/${folder}/${uniqueKey}${ext}`;

    const expiresAt = new Date(Date.now() + env.UPLOAD_URL_TTL_SEC * 1000);

    // Create intent in DB
    const intent = await mediaRepository.createUploadIntent({
      patient: { connect: { id: patientId } },
      user: { connect: { id: userId } },
      storagePath,
      purpose: input.purpose,
      declaredMimeType: spec.normalizedMime,
      declaredSizeBytes: input.sizeBytes,
      memory: input.memoryId ? { connect: { id: input.memoryId } } : undefined,
      targetId: input.targetId,
      status: MediaUploadStatus.PENDING,
      expiresAt
    });

    // Request target URL from storage provider
    const target = await storage.createUploadTarget({
      storagePath,
      contentType: spec.normalizedMime,
      maxSizeBytes: input.sizeBytes,
      ttlSeconds: env.UPLOAD_URL_TTL_SEC
    });

    return {
      uploadId: intent.id,
      uploadUrl: target.uploadUrl,
      method: target.method,
      requiredHeaders: target.requiredHeaders,
      expiresAt: intent.expiresAt
    };
  }

  /**
   * Confirms an upload, validates physical file size and magic bytes, binds profile/cover images,
   * creates Media row, and enforces safety rule on verified memories.
   */
  async confirmUpload(
    patientId: string,
    userId: string,
    accessRole: AccessRole | undefined,
    isPatientSession: boolean,
    input: ConfirmUploadInput
  ) {
    if (isPatientSession || accessRole === AccessRole.VIEWER) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions to confirm upload', 403);
    }

    const intent = await mediaRepository.findUploadIntentById(input.uploadId);
    if (!intent || intent.patientId !== patientId) {
      throw new AppError('NOT_FOUND', 'Upload intent not found', 404);
    }

    if (intent.userId !== userId) {
      throw new AppError('FORBIDDEN', 'You cannot confirm an upload created by another user', 403);
    }

    // Idempotency: if already confirmed, return existing media
    if (intent.status === MediaUploadStatus.CONFIRMED && intent.mediaId) {
      const existingMedia = await mediaRepository.findMediaById(intent.mediaId);
      if (existingMedia) {
        return this.formatMedia(existingMedia);
      }
    }

    if (intent.status === MediaUploadStatus.FAILED) {
      throw new AppError('UPLOAD_FAILED', 'Upload intent previously failed validation', 400);
    }

    // Check expiration
    if (intent.expiresAt < new Date()) {
      await mediaRepository.updateUploadIntent(intent.id, {
        status: MediaUploadStatus.EXPIRED
      });
      try {
        await storage.deleteObject(intent.storagePath);
      } catch {
        // ignore
      }
      throw new AppError('UPLOAD_EXPIRED', 'Upload URL has expired', 400);
    }

    // Stat physical file in storage
    const stat = await storage.statObject(intent.storagePath);
    if (!stat.exists) {
      throw new AppError('FILE_NOT_FOUND', 'File has not been uploaded to the storage target', 400);
    }

    const spec = validateMimeAndExtension(intent.storagePath, intent.declaredMimeType);

    // Validate physical size (cannot exceed declared size or max type size)
    if (stat.size <= 0 || stat.size > spec.maxSizeBytes || stat.size > intent.declaredSizeBytes) {
      await storage.deleteObject(intent.storagePath).catch(() => {});
      await mediaRepository.updateUploadIntent(intent.id, {
        status: MediaUploadStatus.FAILED
      });
      throw new AppError(
        'INVALID_FILE_SIZE',
        `Uploaded file size (${stat.size} bytes) exceeds limit or declared size (${intent.declaredSizeBytes} bytes)`,
        400
      );
    }

    // Verify magic bytes
    try {
      const header = await storage.readRange(intent.storagePath, 0, Math.min(stat.size - 1, 31));
      const validSig = verifyFileSignature(header, intent.declaredMimeType);
      if (!validSig) {
        await storage.deleteObject(intent.storagePath).catch(() => {});
        await mediaRepository.updateUploadIntent(intent.id, {
          status: MediaUploadStatus.FAILED
        });
        throw new AppError('INVALID_FILE_SIGNATURE', 'File content does not match declared MIME type signature', 400);
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      await storage.deleteObject(intent.storagePath).catch(() => {});
      await mediaRepository.updateUploadIntent(intent.id, {
        status: MediaUploadStatus.FAILED
      });
      throw new AppError('VERIFICATION_FAILED', `Failed to verify media content: ${err.message}`, 400);
    }

    // Memory resolution
    const targetMemoryId = input.memoryId || intent.memoryId;
    let memoryToRevert: any = null;

    if (targetMemoryId) {
      const mem = await prisma.memory.findFirst({
        where: { id: targetMemoryId, patientId, deletedAt: null }
      });
      if (!mem) {
        throw new AppError('NOT_FOUND', 'Target memory not found', 404);
      }
      memoryToRevert = mem;
    }

    // Execute database operations in transaction (with storage cleanup on DB failure)
    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        // 1. Create Media row
        const safeFileName = sanitizeFileName(path.basename(intent.storagePath));
        const media = await tx.media.create({
          data: {
            patient: { connect: { id: patientId } },
            memory: targetMemoryId ? { connect: { id: targetMemoryId } } : undefined,
            mediaType: spec.mediaType,
            storagePath: intent.storagePath,
            checksum: stat.md5 || null,
            fileName: safeFileName,
            mimeType: intent.declaredMimeType,
            sizeBytes: stat.size,
            caption: input.caption?.trim() || null,
            uploader: { connect: { id: userId } }
          }
        });

        // 2. Mark intent as CONFIRMED
        await tx.mediaUpload.update({
          where: { id: intent.id },
          data: {
            status: MediaUploadStatus.CONFIRMED,
            media: { connect: { id: media.id } }
          }
        });

        // 3. Image binding for profile / cover purposes
        if (intent.purpose === MediaUploadPurpose.PATIENT_PROFILE) {
          await tx.patientProfile.update({
            where: { id: patientId },
            data: { profileImage: intent.storagePath }
          });
        } else if (intent.purpose === MediaUploadPurpose.PERSON_PROFILE && intent.targetId) {
          await tx.person.update({
            where: { id: intent.targetId },
            data: { profileImage: intent.storagePath }
          });
        } else if (intent.purpose === MediaUploadPurpose.ALBUM_COVER && intent.targetId) {
          await tx.album.update({
            where: { id: intent.targetId },
            data: { coverImage: intent.storagePath }
          });
        } else if (intent.purpose === MediaUploadPurpose.STORYBOOK_COVER && intent.targetId) {
          await tx.storybook.update({
            where: { id: intent.targetId },
            data: { coverImage: intent.storagePath }
          });
        }

        // 4. Safety rule: if attached to a VERIFIED memory
        if (memoryToRevert && memoryToRevert.verificationStatus === VerificationStatus.VERIFIED) {
          const canReverify =
            input.reverify === true &&
            (accessRole === AccessRole.OWNER || accessRole === AccessRole.CAREGIVER);

          if (!canReverify) {
            await tx.memory.update({
              where: { id: memoryToRevert.id },
              data: {
                verificationStatus: VerificationStatus.PENDING,
                approvedById: null
              }
            });

            await tx.verification.create({
              data: {
                memoryId: memoryToRevert.id,
                verifiedById: userId,
                status: VerificationStatus.PENDING,
                comments: 'Auto-reverted to PENDING due to media attachment'
              }
            });
          }
        }

        // 5. Audit log
        await tx.auditLog.create({
          data: {
            patientId,
            actorId: userId,
            action: 'MEDIA_CONFIRM',
            resourceType: 'Media',
            resourceId: media.id,
            metadata: {
              purpose: intent.purpose,
              mediaType: spec.mediaType,
              sizeBytes: stat.size
            }
          }
        });

        return media;
      });
    } catch (dbErr) {
      // DB failure after upload cleans up the physical storage object
      await storage.deleteObject(intent.storagePath).catch(() => {});
      await mediaRepository.updateUploadIntent(intent.id, {
        status: MediaUploadStatus.FAILED
      }).catch(() => {});
      throw dbErr;
    }

    return this.formatMedia(result);
  }

  /**
   * List media for patient with role-based visibility and pagination
   */
  async listMedia(
    patientId: string,
    userId: string | undefined,
    accessRole: AccessRole | undefined,
    isPatientSession: boolean,
    query: ListMediaQueryInput
  ) {
    const where: Prisma.MediaWhereInput = {
      patientId,
      deletedAt: null
    };

    if (query.memoryId) {
      where.memoryId = query.memoryId;
    }

    if (query.mediaType) {
      where.mediaType = query.mediaType as MediaType;
    }

    // Visibility rules based on role
    if (isPatientSession || accessRole === AccessRole.VIEWER) {
      // Must only see media attached to VERIFIED memories
      where.memory = {
        verificationStatus: VerificationStatus.VERIFIED,
        deletedAt: null
      };
    } else if (accessRole === AccessRole.FAMILY) {
      // Visible if memory is VERIFIED OR created by this family user OR uploaded by this family user
      where.OR = [
        {
          memory: {
            verificationStatus: VerificationStatus.VERIFIED,
            deletedAt: null
          }
        },
        {
          memory: {
            createdBy: userId,
            deletedAt: null
          }
        },
        {
          uploadedBy: userId
        }
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      mediaRepository.listMedia(where, skip, query.pageSize),
      mediaRepository.countMedia(where)
    ]);

    const formatted = await Promise.all(items.map((item) => this.formatMedia(item)));

    return {
      items: formatted,
      page: query.page,
      pageSize: query.pageSize,
      total
    };
  }

  /**
   * Get fresh signed read URL for a media item
   */
  async getMediaUrl(
    mediaId: string,
    userId: string | undefined,
    accessRole: AccessRole | undefined,
    isPatientSession: boolean
  ) {
    const media = await prisma.media.findFirst({
      where: { id: mediaId, deletedAt: null },
      include: { memory: true }
    });

    if (!media) {
      throw new AppError('NOT_FOUND', 'Media not found', 404);
    }

    // Role-based visibility check (must return 404 on access denial to prevent enumeration)
    if (isPatientSession || accessRole === AccessRole.VIEWER) {
      if (!media.memory || media.memory.verificationStatus !== VerificationStatus.VERIFIED) {
        throw new AppError('NOT_FOUND', 'Media not found', 404);
      }
    } else if (accessRole === AccessRole.FAMILY) {
      const isVerified = media.memory?.verificationStatus === VerificationStatus.VERIFIED;
      const isOwnerOfMemory = media.memory?.createdBy === userId;
      const isUploader = media.uploadedBy === userId;
      if (!isVerified && !isOwnerOfMemory && !isUploader) {
        throw new AppError('NOT_FOUND', 'Media not found', 404);
      }
    }

    const url = await storage.createReadUrl(media.storagePath, env.MEDIA_READ_URL_TTL_SEC);
    const expiresAt = new Date(Date.now() + env.MEDIA_READ_URL_TTL_SEC * 1000);

    return {
      id: media.id,
      url,
      expiresAt
    };
  }

  /**
   * Update media caption and enforce safety rule on memory if attached
   */
  async updateMedia(
    mediaId: string,
    userId: string,
    accessRole: AccessRole | undefined,
    isPatientSession: boolean,
    input: UpdateMediaInput
  ) {
    if (isPatientSession || accessRole === AccessRole.VIEWER) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions to update media', 403);
    }

    const media = await prisma.media.findFirst({
      where: { id: mediaId, deletedAt: null },
      include: { memory: true }
    });

    if (!media) {
      throw new AppError('NOT_FOUND', 'Media not found', 404);
    }

    // FAMILY role: can only edit media they uploaded
    if (accessRole === AccessRole.FAMILY && media.uploadedBy !== userId) {
      throw new AppError('NOT_FOUND', 'Media not found', 404);
    }

    // Cross-reference check if attaching/changing memoryId
    let newTargetMemory: any = null;
    if (input.memoryId !== undefined && input.memoryId !== null) {
      newTargetMemory = await prisma.memory.findFirst({
        where: { id: input.memoryId, patientId: media.patientId, deletedAt: null }
      });
      if (!newTargetMemory) {
        throw new AppError('NOT_FOUND', 'Target memory not found for this patient', 404);
      }
      if (input.memoryId !== media.memoryId) {
        const count = await mediaRepository.countMediaForMemory(input.memoryId);
        if (count >= env.MAX_MEDIA_PER_MEMORY) {
          throw new AppError(
            'MAX_MEDIA_REACHED',
            `Memory already has the maximum of ${env.MAX_MEDIA_PER_MEMORY} media items`,
            400
          );
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.media.update({
        where: { id: mediaId },
        data: {
          caption: input.caption !== undefined ? input.caption.trim() || null : undefined,
          memoryId: input.memoryId !== undefined ? input.memoryId : undefined
        }
      });

      // Safety rule if previously attached to a VERIFIED memory
      if (media.memory && media.memory.verificationStatus === VerificationStatus.VERIFIED) {
        const canReverify =
          input.reverify === true &&
          (accessRole === AccessRole.OWNER || accessRole === AccessRole.CAREGIVER);

        if (!canReverify) {
          await tx.memory.update({
            where: { id: media.memory.id },
            data: {
              verificationStatus: VerificationStatus.PENDING,
              approvedById: null
            }
          });

          await tx.verification.create({
            data: {
              memoryId: media.memory.id,
              verifiedById: userId,
              status: VerificationStatus.PENDING,
              comments: 'Auto-reverted to PENDING due to media modification'
            }
          });
        }
      }

      // Safety rule if newly attached to a different VERIFIED memory
      if (
        newTargetMemory &&
        newTargetMemory.id !== media.memoryId &&
        newTargetMemory.verificationStatus === VerificationStatus.VERIFIED
      ) {
        const canReverify =
          input.reverify === true &&
          (accessRole === AccessRole.OWNER || accessRole === AccessRole.CAREGIVER);

        if (!canReverify) {
          await tx.memory.update({
            where: { id: newTargetMemory.id },
            data: {
              verificationStatus: VerificationStatus.PENDING,
              approvedById: null
            }
          });

          await tx.verification.create({
            data: {
              memoryId: newTargetMemory.id,
              verifiedById: userId,
              status: VerificationStatus.PENDING,
              comments: 'Auto-reverted to PENDING due to media attachment'
            }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          patientId: media.patientId,
          actorId: userId,
          action: 'MEDIA_UPDATE',
          resourceType: 'Media',
          resourceId: media.id,
          metadata: {
            updatedFields: Object.keys(input)
          }
        }
      });

      return updated;
    });

    return this.formatMedia(result);
  }

  /**
   * List media for a specific memory
   */
  async listMemoryMedia(
    memoryId: string,
    userId: string | undefined,
    accessRole: AccessRole | undefined,
    isPatientSession: boolean
  ) {
    const memory = await prisma.memory.findFirst({
      where: { id: memoryId, deletedAt: null }
    });
    if (!memory) {
      throw new AppError('NOT_FOUND', 'Memory not found', 404);
    }

    if (isPatientSession || accessRole === AccessRole.VIEWER) {
      if (memory.verificationStatus !== VerificationStatus.VERIFIED) {
        throw new AppError('NOT_FOUND', 'Memory not found', 404);
      }
    } else if (accessRole === AccessRole.FAMILY) {
      if (memory.verificationStatus !== VerificationStatus.VERIFIED && memory.createdBy !== userId) {
        throw new AppError('NOT_FOUND', 'Memory not found', 404);
      }
    }

    const items = await prisma.media.findMany({
      where: {
        memoryId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = await Promise.all(items.map((item) => this.formatMedia(item)));
    return {
      items: formatted,
      total: formatted.length
    };
  }

  /**
   * Soft delete media row and delete physical storage object
   */
  async deleteMedia(
    mediaId: string,
    userId: string,
    accessRole: AccessRole | undefined,
    isPatientSession: boolean
  ) {
    if (isPatientSession || accessRole === AccessRole.VIEWER) {
      throw new AppError('FORBIDDEN', 'Insufficient permissions to delete media', 403);
    }

    const media = await prisma.media.findFirst({
      where: { id: mediaId, deletedAt: null },
      include: { memory: true }
    });

    if (!media) {
      throw new AppError('NOT_FOUND', 'Media not found', 404);
    }

    // FAMILY role: can only delete media they uploaded
    if (accessRole === AccessRole.FAMILY && media.uploadedBy !== userId) {
      throw new AppError('NOT_FOUND', 'Media not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.media.update({
        where: { id: mediaId },
        data: { deletedAt: new Date() }
      });

      // Safety rule if attached to a VERIFIED memory
      if (media.memory && media.memory.verificationStatus === VerificationStatus.VERIFIED) {
        await tx.memory.update({
          where: { id: media.memory.id },
          data: {
            verificationStatus: VerificationStatus.PENDING,
            approvedById: null
          }
        });

        await tx.verification.create({
          data: {
            memoryId: media.memory.id,
            verifiedById: userId,
            status: VerificationStatus.PENDING,
            comments: 'Auto-reverted to PENDING due to media deletion'
          }
        });
      }

      await tx.auditLog.create({
        data: {
          patientId: media.patientId,
          actorId: userId,
          action: 'MEDIA_DELETE',
          resourceType: 'Media',
          resourceId: media.id
        }
      });
    });

    // Delete physical object in storage
    try {
      await storage.deleteObject(media.storagePath);
    } catch {
      // Storage deletion failure should not block soft delete completion
    }

    return { id: media.id };
  }
}

export const mediaService = new MediaService();

