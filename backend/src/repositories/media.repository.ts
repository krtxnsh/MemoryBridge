import { Prisma, Media, MediaUpload, MediaUploadStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export class MediaRepository {
  async findUploadIntentById(id: string): Promise<MediaUpload | null> {
    return prisma.mediaUpload.findUnique({
      where: { id },
      include: {
        patient: true,
        user: true,
        memory: true,
        media: true
      }
    });
  }

  async countPendingIntentsForUser(userId: string): Promise<number> {
    return prisma.mediaUpload.count({
      where: {
        userId,
        status: MediaUploadStatus.PENDING,
        expiresAt: { gt: new Date() }
      }
    });
  }

  async getPatientStorageUsageBytes(patientId: string): Promise<number> {
    const agg = await prisma.media.aggregate({
      where: {
        patientId,
        deletedAt: null
      },
      _sum: {
        sizeBytes: true
      }
    });
    return agg._sum?.sizeBytes || 0;
  }

  async countMediaForMemory(memoryId: string): Promise<number> {
    return prisma.media.count({
      where: {
        memoryId,
        deletedAt: null
      }
    });
  }

  async createUploadIntent(data: Prisma.MediaUploadCreateInput): Promise<MediaUpload> {
    return prisma.mediaUpload.create({
      data
    });
  }

  async updateUploadIntent(
    id: string,
    data: Prisma.MediaUploadUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<MediaUpload> {
    const client = tx || prisma;
    return client.mediaUpload.update({
      where: { id },
      data
    });
  }

  async findMediaById(id: string): Promise<Media | null> {
    return prisma.media.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });
  }

  async findMediaByStoragePath(storagePath: string): Promise<Media | null> {
    return prisma.media.findFirst({
      where: {
        storagePath,
        deletedAt: null
      }
    });
  }

  async listMedia(
    where: Prisma.MediaWhereInput,
    skip: number,
    take: number
  ): Promise<Media[]> {
    return prisma.media.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });
  }

  async countMedia(where: Prisma.MediaWhereInput): Promise<number> {
    return prisma.media.count({
      where
    });
  }

  async createMedia(
    data: Prisma.MediaCreateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Media> {
    const client = tx || prisma;
    return client.media.create({
      data
    });
  }

  async updateMedia(
    id: string,
    data: Prisma.MediaUpdateInput,
    tx?: Prisma.TransactionClient
  ): Promise<Media> {
    const client = tx || prisma;
    return client.media.update({
      where: { id },
      data
    });
  }

  async softDeleteMedia(id: string, tx?: Prisma.TransactionClient): Promise<Media> {
    const client = tx || prisma;
    return client.media.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });
  }
}

export const mediaRepository = new MediaRepository();

