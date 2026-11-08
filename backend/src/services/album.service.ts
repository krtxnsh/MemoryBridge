import { Prisma, AccessRole, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { albumRepository } from '../repositories/album.repository.js';
import { AppError } from '../middleware/errorHandler.js';
import { resolveMediaUrl } from '../utils/media-url.js';

export class AlbumService {
  private buildMemoryVisibilityFilter(
    isPatientSession: boolean,
    accessRole?: AccessRole,
    userId?: string
  ): Prisma.MemoryWhereInput {
    if (isPatientSession || accessRole === AccessRole.VIEWER) {
      return { verificationStatus: VerificationStatus.VERIFIED };
    }

    if (accessRole === AccessRole.FAMILY) {
      return {
        OR: [
          { verificationStatus: VerificationStatus.VERIFIED },
          { createdBy: userId }
        ]
      };
    }

    return {};
  }

  async listAlbums(
    patientId: string,
    params: {
      q?: string;
      page?: number;
      pageSize?: number;
    },
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const where: Prisma.AlbumWhereInput = {
      patientId
    };

    if (params.q) {
      where.title = { contains: params.q, mode: 'insensitive' };
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [albums, total] = await Promise.all([
      albumRepository.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take
      }),
      albumRepository.count(where)
    ]);

    const albumIds = albums.map((a) => a.id);
    const memoryFilter = this.buildMemoryVisibilityFilter(
      context.isPatientSession,
      context.accessRole,
      context.userId
    );

    // Group count memories per album
    const countsMap = new Map<string, number>();
    if (albumIds.length > 0) {
      const counts = await prisma.memory.groupBy({
        by: ['albumId'],
        where: {
          albumId: { in: albumIds },
          patientId,
          deletedAt: null,
          ...memoryFilter
        },
        _count: {
          id: true
        }
      });

      for (const c of counts) {
        if (c.albumId) {
          countsMap.set(c.albumId, c._count.id);
        }
      }
    }

    const items = await Promise.all(
      albums.map(async (a) => ({
        id: a.id,
        patientId: a.patientId,
        title: a.title,
        coverImage: await resolveMediaUrl(a.coverImage),
        colorTheme: a.colorTheme,
        yearRange: a.yearRange,
        description: a.description,
        memoryCount: countsMap.get(a.id) || 0,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }))
    );

    return {
      items,
      page,
      pageSize,
      total
    };
  }

  async getAlbumById(
    albumId: string,
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const album = await albumRepository.findById(albumId);
    if (!album) {
      throw new AppError('ALBUM_NOT_FOUND', 'Album not found.', 404);
    }

    const memoryFilter = this.buildMemoryVisibilityFilter(
      context.isPatientSession,
      context.accessRole,
      context.userId
    );

    const memoryCount = await prisma.memory.count({
      where: {
        albumId,
        patientId: album.patientId,
        deletedAt: null,
        ...memoryFilter
      }
    });

    return {
      id: album.id,
      patientId: album.patientId,
      title: album.title,
      coverImage: await resolveMediaUrl(album.coverImage),
      colorTheme: album.colorTheme,
      yearRange: album.yearRange,
      description: album.description,
      memoryCount,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt
    };
  }

  async createAlbum(
    patientId: string,
    userId: string,
    input: {
      title: string;
      coverImage?: string | null;
      colorTheme?: string;
      yearRange?: string | null;
      description?: string | null;
    }
  ) {
    const album = await prisma.$transaction(async (tx) => {
      const created = await tx.album.create({
        data: {
          patientId,
          title: input.title,
          coverImage: input.coverImage || null,
          colorTheme: input.colorTheme || 'amber',
          yearRange: input.yearRange || null,
          description: input.description || null
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'CREATE_ALBUM',
          resourceType: 'Album',
          resourceId: created.id,
          metadata: { title: created.title }
        }
      });

      return created;
    });

    return {
      id: album.id,
      patientId: album.patientId,
      title: album.title,
      coverImage: await resolveMediaUrl(album.coverImage),
      colorTheme: album.colorTheme,
      yearRange: album.yearRange,
      description: album.description,
      memoryCount: 0,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt
    };
  }

  async updateAlbum(
    albumId: string,
    userId: string,
    input: {
      title?: string;
      coverImage?: string | null;
      colorTheme?: string;
      yearRange?: string | null;
      description?: string | null;
    }
  ) {
    const existing = await albumRepository.findById(albumId);
    if (!existing) {
      throw new AppError('ALBUM_NOT_FOUND', 'Album not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const alb = await tx.album.update({
        where: { id: albumId },
        data: {
          title: input.title,
          coverImage: input.coverImage,
          colorTheme: input.colorTheme,
          yearRange: input.yearRange,
          description: input.description
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'UPDATE_ALBUM',
          resourceType: 'Album',
          resourceId: albumId,
          metadata: { title: alb.title }
        }
      });

      return alb;
    });

    const memoryCount = await prisma.memory.count({
      where: {
        albumId,
        patientId: existing.patientId,
        deletedAt: null
      }
    });

    return {
      id: updated.id,
      patientId: updated.patientId,
      title: updated.title,
      coverImage: await resolveMediaUrl(updated.coverImage),
      colorTheme: updated.colorTheme,
      yearRange: updated.yearRange,
      description: updated.description,
      memoryCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  }

  async deleteAlbum(albumId: string, userId: string) {
    const existing = await albumRepository.findById(albumId);
    if (!existing) {
      throw new AppError('ALBUM_NOT_FOUND', 'Album not found.', 404);
    }

    await prisma.$transaction(async (tx) => {
      // Disassociate memories
      await tx.memory.updateMany({
        where: { albumId },
        data: { albumId: null }
      });

      await tx.album.delete({
        where: { id: albumId }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'DELETE_ALBUM',
          resourceType: 'Album',
          resourceId: albumId
        }
      });
    });

    return { id: albumId };
  }
}

export const albumService = new AlbumService();

