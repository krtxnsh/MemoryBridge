import { Prisma, VerificationStatus, Memory } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class VerificationRepository {
  async findMany(params: {
    where: Prisma.VerificationWhereInput;
    skip: number;
    take: number;
  }) {
    return prisma.verification.findMany({
      where: params.where,
      include: {
        verifier: {
          select: { id: true, name: true, email: true, role: true }
        },
        memory: {
          select: { id: true, title: true, source: true, patientId: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: params.skip,
      take: params.take
    });
  }

  async count(where: Prisma.VerificationWhereInput): Promise<number> {
    return prisma.verification.count({ where });
  }

  async findQueue(patientId: string, skip: number, take: number) {
    return prisma.memory.findMany({
      where: {
        patientId,
        deletedAt: null,
        verificationStatus: {
          in: [VerificationStatus.PENDING, VerificationStatus.AI_SUGGESTED]
        }
      },
      include: {
        people: {
          include: {
            person: {
              select: { id: true, fullName: true, profileImage: true }
            }
          }
        },
        album: {
          select: { id: true, title: true }
        },
        media: {
          where: { deletedAt: null },
          select: { id: true, mediaType: true, fileName: true, mimeType: true, caption: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take
    });
  }

  async countQueue(patientId: string): Promise<number> {
    return prisma.memory.count({
      where: {
        patientId,
        deletedAt: null,
        verificationStatus: {
          in: [VerificationStatus.PENDING, VerificationStatus.AI_SUGGESTED]
        }
      }
    });
  }

  /**
   * Family review approval of memory information (family verification).
   * Atomically updates memory status to VERIFIED, sets approvedById, and appends Verification record.
   */
  async verifyMemory(
    memoryId: string,
    verifierId: string,
    patientId: string,
    comments?: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      const updatedMemory = await tx.memory.update({
        where: { id: memoryId },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
          approvedById: verifierId
        },
        include: {
          people: { include: { person: true } },
          album: true,
          media: {
            where: { deletedAt: null },
            select: { id: true, mediaType: true, fileName: true, mimeType: true, caption: true }
          }
        }
      });

      const verificationRecord = await tx.verification.create({
        data: {
          memoryId,
          verifiedById: verifierId,
          status: VerificationStatus.VERIFIED,
          comments: comments || null
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: verifierId,
          patientId,
          action: 'VERIFY_MEMORY',
          resourceType: 'Memory',
          resourceId: memoryId,
          metadata: {
            status: VerificationStatus.VERIFIED,
            verificationId: verificationRecord.id,
            comments: comments || null
          }
        }
      });

      return { updatedMemory, verificationRecord };
    });
  }

  /**
   * Family review rejection of memory information.
   * Atomically updates memory status to REJECTED, clears approvedById, and appends Verification record.
   */
  async rejectMemory(
    memoryId: string,
    verifierId: string,
    patientId: string,
    comments?: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      const updatedMemory = await tx.memory.update({
        where: { id: memoryId },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          approvedById: null
        },
        include: {
          people: { include: { person: true } },
          album: true,
          media: {
            where: { deletedAt: null },
            select: { id: true, mediaType: true, fileName: true, mimeType: true, caption: true }
          }
        }
      });

      const verificationRecord = await tx.verification.create({
        data: {
          memoryId,
          verifiedById: verifierId,
          status: VerificationStatus.REJECTED,
          comments: comments || null
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: verifierId,
          patientId,
          action: 'REJECT_MEMORY',
          resourceType: 'Memory',
          resourceId: memoryId,
          metadata: {
            status: VerificationStatus.REJECTED,
            verificationId: verificationRecord.id,
            comments: comments || null
          }
        }
      });

      return { updatedMemory, verificationRecord };
    });
  }
}

export const verificationRepository = new VerificationRepository();

