import { Prisma, VerificationStatus, MemorySource, AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreateMemoryInput {
  title: string;
  description?: string;
  story: string;
  audioDescription?: string;
  eventDate?: string;
  approximateYear?: number;
  location?: string;
  eventType?: string;
  era: string;
  tags?: string[];
  albumId?: string;
  songId?: string;
  mapX?: number;
  mapY?: number;
  mapLabel?: string;
  peopleIds?: string[];
}

export interface UpdateMemoryInput extends Partial<CreateMemoryInput> {}

export interface SearchMemoryParams {
  q?: string;
  year?: number;
  era?: string;
  location?: string;
  eventType?: string;
  personId?: string;
  albumId?: string;
  status?: VerificationStatus;
  limit?: number;
  offset?: number;
}

export class MemoryService {
  /**
   * Helper to construct status filter based on caller context
   */
  private getStatusFilter(
    isPatientToken: boolean,
    accessRole?: AccessRole,
    userId?: string
  ): Prisma.MemoryWhereInput {
    // 1. Patient tablet token: STRICTLY VERIFIED ONLY
    if (isPatientToken) {
      return { verificationStatus: VerificationStatus.VERIFIED };
    }

    // 2. Owner or Caregiver: Can view all statuses
    if (accessRole === AccessRole.OWNER || accessRole === AccessRole.CAREGIVER) {
      return {};
    }

    // 3. Family / Viewer: Verified memories OR memories submitted by themselves
    if (userId) {
      return {
        OR: [
          { verificationStatus: VerificationStatus.VERIFIED },
          { createdBy: userId }
        ]
      };
    }

    // Fallback: Strictly verified
    return { verificationStatus: VerificationStatus.VERIFIED };
  }

  async listMemories(
    patientId: string,
    isPatientToken: boolean,
    accessRole?: AccessRole,
    userId?: string
  ) {
    const statusCondition = this.getStatusFilter(isPatientToken, accessRole, userId);

    return prisma.memory.findMany({
      where: {
        patientId,
        deletedAt: null,
        ...statusCondition
      },
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
          select: {
            id: true,
            title: true,
            colorTheme: true
          }
        },
        media: {
          where: { deletedAt: null }
        }
      },
      orderBy: [
        { approximateYear: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async searchMemories(
    patientId: string,
    params: SearchMemoryParams,
    isPatientToken: boolean,
    accessRole?: AccessRole,
    userId?: string
  ) {
    const statusCondition = this.getStatusFilter(isPatientToken, accessRole, userId);
    const where: Prisma.MemoryWhereInput = {
      patientId,
      deletedAt: null,
      ...statusCondition
    };

    if (params.status && !isPatientToken) {
      where.verificationStatus = params.status;
    }

    if (params.year) {
      where.approximateYear = params.year;
    }

    if (params.era) {
      where.era = { contains: params.era, mode: 'insensitive' };
    }

    if (params.location) {
      where.location = { contains: params.location, mode: 'insensitive' };
    }

    if (params.eventType) {
      where.eventType = { contains: params.eventType, mode: 'insensitive' };
    }

    if (params.albumId) {
      where.albumId = params.albumId;
    }

    if (params.personId) {
      where.people = {
        some: {
          personId: params.personId
        }
      };
    }

    if (params.q) {
      where.OR = [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { story: { contains: params.q, mode: 'insensitive' } },
        { location: { contains: params.q, mode: 'insensitive' } },
        { tags: { has: params.q } }
      ];
    }

    return prisma.memory.findMany({
      where,
      include: {
        people: {
          include: {
            person: true
          }
        },
        album: true,
        media: {
          where: { deletedAt: null }
        }
      },
      take: params.limit || 50,
      skip: params.offset || 0,
      orderBy: [
        { approximateYear: 'asc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async getMemoryById(
    id: string,
    isPatientToken: boolean,
    accessRole?: AccessRole,
    userId?: string
  ) {
    const memory = await prisma.memory.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        people: {
          include: {
            person: true
          }
        },
        album: true,
        media: {
          where: { deletedAt: null }
        },
        verifications: {
          include: {
            verifier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!memory) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found', 404);
    }

    // Patient tablet can ONLY view verified memories
    if (isPatientToken && memory.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found', 404);
    }

    // Family members can only view verified memories or their own submissions
    if (accessRole === AccessRole.FAMILY && memory.verificationStatus !== VerificationStatus.VERIFIED && memory.createdBy !== userId) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found', 404);
    }

    return memory;
  }

  async createMemory(
    patientId: string,
    userId: string,
    input: CreateMemoryInput,
    isCaregiver: boolean
  ) {
    // Caregiver submissions start as VERIFIED; Family submissions start as PENDING
    const initialStatus = isCaregiver ? VerificationStatus.VERIFIED : VerificationStatus.PENDING;
    const source = isCaregiver ? MemorySource.CAREGIVER : MemorySource.FAMILY_SUBMITTED;

    return prisma.$transaction(async (tx) => {
      const memory = await tx.memory.create({
        data: {
          patientId,
          createdBy: userId,
          title: input.title,
          description: input.description || null,
          story: input.story,
          audioDescription: input.audioDescription || null,
          eventDate: input.eventDate ? new Date(input.eventDate) : null,
          approximateYear: input.approximateYear || null,
          location: input.location || null,
          eventType: input.eventType || null,
          era: input.era,
          tags: input.tags || [],
          albumId: input.albumId || null,
          songId: input.songId || null,
          mapX: input.mapX ?? null,
          mapY: input.mapY ?? null,
          mapLabel: input.mapLabel || null,
          source,
          verificationStatus: initialStatus,
          approvedById: isCaregiver ? userId : null,
          people: input.peopleIds && input.peopleIds.length > 0 ? {
            create: input.peopleIds.map((personId) => ({ personId }))
          } : undefined
        },
        include: {
          people: {
            include: { person: true }
          },
          album: true
        }
      });

      // If created as verified, record verification
      if (initialStatus === VerificationStatus.VERIFIED) {
        await tx.verification.create({
          data: {
            memoryId: memory.id,
            verifiedById: userId,
            status: VerificationStatus.VERIFIED,
            comments: 'Auto-approved by caregiver creator'
          }
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'CREATE_MEMORY',
          resourceType: 'Memory',
          resourceId: memory.id,
          metadata: {
            title: memory.title,
            status: memory.verificationStatus
          }
        }
      });

      return memory;
    });
  }

  async updateMemory(
    id: string,
    userId: string,
    patientId: string,
    input: UpdateMemoryInput
  ) {
    return prisma.$transaction(async (tx) => {
      // If peopleIds provided, clear and recreate relations
      if (input.peopleIds) {
        await tx.memoryPeople.deleteMany({
          where: { memoryId: id }
        });
        if (input.peopleIds.length > 0) {
          await tx.memoryPeople.createMany({
            data: input.peopleIds.map((personId) => ({
              memoryId: id,
              personId
            }))
          });
        }
      }

      const updated = await tx.memory.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          story: input.story,
          audioDescription: input.audioDescription,
          eventDate: input.eventDate ? new Date(input.eventDate) : undefined,
          approximateYear: input.approximateYear,
          location: input.location,
          eventType: input.eventType,
          era: input.era,
          tags: input.tags,
          albumId: input.albumId,
          songId: input.songId,
          mapX: input.mapX,
          mapY: input.mapY,
          mapLabel: input.mapLabel
        },
        include: {
          people: {
            include: { person: true }
          },
          album: true,
          media: {
            where: { deletedAt: null }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'UPDATE_MEMORY',
          resourceType: 'Memory',
          resourceId: id,
          metadata: { title: updated.title }
        }
      });

      return updated;
    });
  }

  async deleteMemory(id: string, userId: string, patientId: string) {
    const memory = await prisma.memory.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        patientId,
        action: 'DELETE_MEMORY',
        resourceType: 'Memory',
        resourceId: id
      }
    });

    return memory;
  }

  async verifyMemory(
    id: string,
    verifierId: string,
    patientId: string,
    status: VerificationStatus,
    comments?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const memory = await tx.memory.update({
        where: { id },
        data: {
          verificationStatus: status,
          approvedById: status === VerificationStatus.VERIFIED ? verifierId : null
        }
      });

      const verification = await tx.verification.create({
        data: {
          memoryId: id,
          verifiedById: verifierId,
          status,
          comments: comments || null
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: verifierId,
          patientId,
          action: status === VerificationStatus.VERIFIED ? 'VERIFY_MEMORY' : 'REJECT_MEMORY',
          resourceType: 'Memory',
          resourceId: id,
          metadata: { status, comments }
        }
      });

      return { memory, verification };
    });
  }

  async listVerifications(patientId: string) {
    return prisma.verification.findMany({
      where: {
        memory: {
          patientId,
          deletedAt: null
        }
      },
      include: {
        memory: {
          select: {
            id: true,
            title: true,
            verificationStatus: true,
            createdAt: true
          }
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const memoryService = new MemoryService();
