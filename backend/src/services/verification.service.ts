import { Prisma, VerificationStatus, AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { verificationRepository } from '../repositories/verification.repository.js';
import { AppError } from '../middleware/errorHandler.js';

export class VerificationService {
  async listVerifications(
    patientId: string,
    params: {
      memoryId?: string;
      status?: VerificationStatus;
      page?: number;
      pageSize?: number;
    }
  ) {
    const where: Prisma.VerificationWhereInput = {
      memory: {
        patientId,
        deletedAt: null
      }
    };

    if (params.memoryId) {
      where.memoryId = params.memoryId;
    }

    if (params.status) {
      where.status = params.status;
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, total] = await Promise.all([
      verificationRepository.findMany({ where, skip, take }),
      verificationRepository.count(where)
    ]);

    return {
      items: items.map((v) => ({
        id: v.id,
        memoryId: v.memoryId,
        status: v.status,
        comments: v.comments,
        createdAt: v.createdAt,
        verifier: v.verifier,
        memory: v.memory
      })),
      page,
      pageSize,
      total
    };
  }

  async getQueue(
    patientId: string,
    params: {
      page?: number;
      pageSize?: number;
    }
  ) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, total] = await Promise.all([
      verificationRepository.findQueue(patientId, skip, take),
      verificationRepository.countQueue(patientId)
    ]);

    return {
      items: items.map((m) => ({
        id: m.id,
        patientId: m.patientId,
        title: m.title,
        description: m.description,
        story: m.story,
        audioDescription: m.audioDescription,
        eventDate: m.eventDate,
        approximateYear: m.approximateYear,
        location: m.location,
        eventType: m.eventType,
        era: m.era,
        tags: m.tags,
        source: m.source,
        verificationStatus: m.verificationStatus,
        album: m.album,
        people: m.people.map((p) => p.person),
        media: m.media.map((med) => ({
          id: med.id,
          mediaType: med.mediaType,
          fileName: med.fileName,
          mimeType: med.mimeType,
          caption: med.caption,
          url: null
        })),
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      })),
      page,
      pageSize,
      total
    };
  }

  async verifyMemory(
    memoryId: string,
    userId: string,
    comments?: string | null
  ) {
    const memory = await prisma.memory.findFirst({
      where: { id: memoryId, deletedAt: null }
    });

    if (!memory) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    const { updatedMemory, verificationRecord } = await verificationRepository.verifyMemory(
      memoryId,
      userId,
      memory.patientId,
      comments
    );

    return {
      id: updatedMemory.id,
      title: updatedMemory.title,
      verificationStatus: updatedMemory.verificationStatus,
      approvedById: updatedMemory.approvedById,
      verificationRecord: {
        id: verificationRecord.id,
        status: verificationRecord.status,
        comments: verificationRecord.comments,
        createdAt: verificationRecord.createdAt
      }
    };
  }

  async rejectMemory(
    memoryId: string,
    userId: string,
    comments?: string | null
  ) {
    const memory = await prisma.memory.findFirst({
      where: { id: memoryId, deletedAt: null }
    });

    if (!memory) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    const { updatedMemory, verificationRecord } = await verificationRepository.rejectMemory(
      memoryId,
      userId,
      memory.patientId,
      comments
    );

    return {
      id: updatedMemory.id,
      title: updatedMemory.title,
      verificationStatus: updatedMemory.verificationStatus,
      approvedById: updatedMemory.approvedById,
      verificationRecord: {
        id: verificationRecord.id,
        status: verificationRecord.status,
        comments: verificationRecord.comments,
        createdAt: verificationRecord.createdAt
      }
    };
  }
}

export const verificationService = new VerificationService();

