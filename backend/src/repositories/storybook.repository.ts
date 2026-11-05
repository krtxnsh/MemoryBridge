import { Prisma, Storybook, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class StorybookRepository {
  async findById(id: string) {
    return prisma.storybook.findFirst({
      where: { id, deletedAt: null },
      include: {
        memories: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            memory: {
              include: {
                media: {
                  where: { deletedAt: null },
                  select: {
                    id: true,
                    mediaType: true,
                    fileName: true,
                    mimeType: true,
                    caption: true
                  }
                },
                people: {
                  include: {
                    person: {
                      select: { id: true, fullName: true, profileImage: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async findMany(params: {
    where: Prisma.StorybookWhereInput;
    orderBy: Prisma.StorybookOrderByWithRelationInput[];
    skip: number;
    take: number;
  }) {
    return prisma.storybook.findMany({
      where: params.where,
      include: {
        memories: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            memory: {
              select: {
                id: true,
                title: true,
                verificationStatus: true,
                eventDate: true,
                approximateYear: true
              }
            }
          }
        }
      },
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take
    });
  }

  async count(where: Prisma.StorybookWhereInput): Promise<number> {
    return prisma.storybook.count({ where });
  }

  async create(data: Prisma.StorybookCreateInput, memoryIds: string[] = []): Promise<Storybook> {
    return prisma.$transaction(async (tx) => {
      const storybook = await tx.storybook.create({ data });

      if (memoryIds.length > 0) {
        await tx.storybookMemories.createMany({
          data: memoryIds.map((memoryId, idx) => ({
            storybookId: storybook.id,
            memoryId,
            sequenceOrder: idx + 1
          }))
        });
      }

      return storybook;
    });
  }

  async update(id: string, data: Prisma.StorybookUpdateInput): Promise<Storybook> {
    return prisma.storybook.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string): Promise<Storybook> {
    return prisma.storybook.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async setMemories(storybookId: string, memoryIds: string[]) {
    return prisma.$transaction(async (tx) => {
      // Clear existing memories for this storybook
      await tx.storybookMemories.deleteMany({
        where: { storybookId }
      });

      // Insert new ordered memories
      if (memoryIds.length > 0) {
        await tx.storybookMemories.createMany({
          data: memoryIds.map((memoryId, idx) => ({
            storybookId,
            memoryId,
            sequenceOrder: idx + 1
          }))
        });
      }

      return tx.storybook.findUnique({
        where: { id: storybookId },
        include: {
          memories: {
            orderBy: { sequenceOrder: 'asc' },
            include: { memory: true }
          }
        }
      });
    });
  }

  async addMemory(storybookId: string, memoryId: string, targetOrder?: number) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.storybookMemories.findMany({
        where: { storybookId },
        orderBy: { sequenceOrder: 'asc' }
      });

      // If already present, don't duplicate
      const alreadyHas = existing.some((item) => item.memoryId === memoryId);
      if (alreadyHas) {
        return;
      }

      const memoryIds = existing.map((item) => item.memoryId);
      if (targetOrder !== undefined && targetOrder > 0 && targetOrder <= memoryIds.length + 1) {
        memoryIds.splice(targetOrder - 1, 0, memoryId);
      } else {
        memoryIds.push(memoryId);
      }

      // Replace sequence
      await tx.storybookMemories.deleteMany({ where: { storybookId } });
      await tx.storybookMemories.createMany({
        data: memoryIds.map((mId, idx) => ({
          storybookId,
          memoryId: mId,
          sequenceOrder: idx + 1
        }))
      });
    });
  }

  async removeMemory(storybookId: string, memoryId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.storybookMemories.deleteMany({
        where: { storybookId, memoryId }
      });

      // Renumber remaining contiguous
      const remaining = await tx.storybookMemories.findMany({
        where: { storybookId },
        orderBy: { sequenceOrder: 'asc' }
      });

      // Shift to temporary negative sequence orders first to avoid any transient collision
      for (let i = 0; i < remaining.length; i++) {
        await tx.storybookMemories.update({
          where: { id: remaining[i].id },
          data: { sequenceOrder: -(i + 1) }
        });
      }

      // Assign contiguous positive sequence orders 1, 2, ...
      for (let i = 0; i < remaining.length; i++) {
        await tx.storybookMemories.update({
          where: { id: remaining[i].id },
          data: { sequenceOrder: i + 1 }
        });
      }
    });
  }
}

export const storybookRepository = new StorybookRepository();

