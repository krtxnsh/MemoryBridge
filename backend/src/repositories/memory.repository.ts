import { Prisma, Memory } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class MemoryRepository {
  async findById(id: string) {
    return prisma.memory.findFirst({
      where: { id, deletedAt: null },
      include: {
        people: {
          include: {
            person: true
          }
        },
        album: {
          select: { id: true, title: true, colorTheme: true }
        },
        media: {
          where: { deletedAt: null },
          select: {
            id: true,
            mediaType: true,
            fileName: true,
            mimeType: true,
            caption: true
          }
        }
      }
    });
  }

  async findMany(params: {
    where: Prisma.MemoryWhereInput;
    orderBy: Prisma.MemoryOrderByWithRelationInput[];
    skip: number;
    take: number;
  }) {
    return prisma.memory.findMany({
      where: params.where,
      include: {
        people: {
          include: {
            person: {
              select: {
                id: true,
                fullName: true,
                profileImage: true
              }
            }
          }
        },
        album: {
          select: { id: true, title: true, colorTheme: true }
        },
        media: {
          where: { deletedAt: null },
          select: {
            id: true,
            mediaType: true,
            fileName: true,
            mimeType: true,
            caption: true
          }
        }
      },
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take
    });
  }

  async count(where: Prisma.MemoryWhereInput): Promise<number> {
    return prisma.memory.count({ where });
  }

  async create(data: Prisma.MemoryCreateInput, personIds: string[]) {
    return prisma.$transaction(async (tx) => {
      const memory = await tx.memory.create({
        data: {
          ...data,
          people: personIds.length > 0
            ? {
                create: personIds.map((personId) => ({ personId }))
              }
            : undefined
        },
        include: {
          people: {
            include: { person: true }
          },
          album: true
        }
      });

      return memory;
    });
  }

  async update(id: string, data: Prisma.MemoryUpdateInput) {
    return prisma.memory.update({
      where: { id },
      data,
      include: {
        people: {
          include: { person: true }
        },
        album: true,
        media: {
          where: { deletedAt: null },
          select: {
            id: true,
            mediaType: true,
            fileName: true,
            mimeType: true,
            caption: true
          }
        }
      }
    });
  }

  async softDelete(id: string): Promise<Memory> {
    return prisma.memory.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async replacePeople(memoryId: string, personIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.memoryPeople.deleteMany({
        where: { memoryId }
      });

      if (personIds.length > 0) {
        await tx.memoryPeople.createMany({
          data: personIds.map((personId) => ({ memoryId, personId }))
        });
      }

      return tx.memory.findUnique({
        where: { id: memoryId },
        include: {
          people: {
            include: { person: true }
          }
        }
      });
    });
  }

  async addPerson(memoryId: string, personId: string) {
    return prisma.memoryPeople.upsert({
      where: {
        memoryId_personId: { memoryId, personId }
      },
      create: { memoryId, personId },
      update: {}
    });
  }

  async removePerson(memoryId: string, personId: string) {
    return prisma.memoryPeople.deleteMany({
      where: { memoryId, personId }
    });
  }
}

export const memoryRepository = new MemoryRepository();

