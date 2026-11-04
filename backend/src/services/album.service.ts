import { StorybookStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateAlbumInput {
  title: string;
  coverImage?: string;
  colorTheme?: string;
  yearRange?: string;
  description?: string;
}

export interface CreateStorybookInput {
  title: string;
  description?: string;
  coverImage?: string;
  generatedStory?: string;
  memoryIds?: string[];
}

export class AlbumService {
  async listAlbums(patientId: string) {
    return prisma.album.findMany({
      where: { patientId },
      include: {
        memories: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            title: true,
            approximateYear: true,
            verificationStatus: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createAlbum(patientId: string, input: CreateAlbumInput) {
    return prisma.album.create({
      data: {
        patientId,
        title: input.title,
        coverImage: input.coverImage || null,
        colorTheme: input.colorTheme || 'amber',
        yearRange: input.yearRange || null,
        description: input.description || null
      }
    });
  }

  async updateAlbum(id: string, input: Partial<CreateAlbumInput>) {
    return prisma.album.update({
      where: { id },
      data: input
    });
  }

  async deleteAlbum(id: string) {
    return prisma.album.delete({
      where: { id }
    });
  }

  // Storybooks
  async listStorybooks(patientId: string) {
    return prisma.storybook.findMany({
      where: {
        patientId,
        deletedAt: null
      },
      include: {
        memories: {
          include: {
            memory: true
          },
          orderBy: { sequenceOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createStorybook(patientId: string, userId: string, input: CreateStorybookInput) {
    return prisma.$transaction(async (tx) => {
      const storybook = await tx.storybook.create({
        data: {
          patientId,
          createdBy: userId,
          title: input.title,
          description: input.description || null,
          coverImage: input.coverImage || null,
          generatedStory: input.generatedStory || null,
          status: StorybookStatus.PUBLISHED,
          memories: input.memoryIds && input.memoryIds.length > 0 ? {
            create: input.memoryIds.map((memoryId, idx) => ({
              memoryId,
              sequenceOrder: idx + 1
            }))
          } : undefined
        },
        include: {
          memories: {
            include: { memory: true },
            orderBy: { sequenceOrder: 'asc' }
          }
        }
      });

      return storybook;
    });
  }

  async reorderStorybookMemories(storybookId: string, memoryIds: string[]) {
    return prisma.$transaction(async (tx) => {
      // Clear existing sequence
      await tx.storybookMemories.deleteMany({
        where: { storybookId }
      });

      // Insert updated sequence
      await tx.storybookMemories.createMany({
        data: memoryIds.map((memoryId, idx) => ({
          storybookId,
          memoryId,
          sequenceOrder: idx + 1
        }))
      });

      return tx.storybook.findUnique({
        where: { id: storybookId },
        include: {
          memories: {
            include: { memory: true },
            orderBy: { sequenceOrder: 'asc' }
          }
        }
      });
    });
  }
}

export const albumService = new AlbumService();
