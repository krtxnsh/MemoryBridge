import { Prisma, AccessRole, StorybookStatus, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { storybookRepository } from '../repositories/storybook.repository.js';
import { AppError } from '../middleware/errorHandler.js';
import { resolveMediaUrl } from '../utils/media-url.js';

export class StorybookService {
  private async formatStorybookResponse(
    sb: any,
    context: { isPatientSession: boolean; accessRole?: AccessRole; userId?: string }
  ) {
    const onlyVerifiedMemories =
      context.isPatientSession ||
      context.accessRole === AccessRole.VIEWER ||
      context.accessRole === AccessRole.FAMILY;

    const memoryList = (sb.memories || []).filter((item: any) => {
      if (!item.memory) return false;
      if (onlyVerifiedMemories) {
        return item.memory.verificationStatus === VerificationStatus.VERIFIED;
      }
      return true;
    });

    const filteredMemories = await Promise.all(
      memoryList.map(async (item: any) => ({
        sequenceOrder: item.sequenceOrder,
        memory: {
          id: item.memory.id,
          title: item.memory.title,
          description: item.memory.description,
          story: item.memory.story,
          eventDate: item.memory.eventDate,
          approximateYear: item.memory.approximateYear,
          location: item.memory.location,
          era: item.memory.era,
          verificationStatus: item.memory.verificationStatus,
          people: await Promise.all(
            (item.memory.people || []).map(async (p: any) => ({
              id: p.person.id,
              fullName: p.person.fullName,
              profileImage: await resolveMediaUrl(p.person.profileImage)
            }))
          ),
          media: await Promise.all(
            (item.memory.media || []).map(async (med: any) => ({
              id: med.id,
              mediaType: med.mediaType,
              fileName: med.fileName,
              mimeType: med.mimeType,
              caption: med.caption,
              url: await resolveMediaUrl(med.storagePath)
            }))
          )
        }
      }))
    );

    return {
      id: sb.id,
      patientId: sb.patientId,
      title: sb.title,
      description: sb.description,
      coverImage: await resolveMediaUrl(sb.coverImage),
      generatedStory: sb.generatedStory,
      status: sb.status,
      memoryCount: filteredMemories.length,
      memories: filteredMemories,
      createdAt: sb.createdAt,
      updatedAt: sb.updatedAt
    };
  }

  async listStorybooks(
    patientId: string,
    params: {
      status?: StorybookStatus;
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
    const where: Prisma.StorybookWhereInput = {
      patientId,
      deletedAt: null
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.q) {
      where.title = { contains: params.q, mode: 'insensitive' };
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, total] = await Promise.all([
      storybookRepository.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take
      }),
      storybookRepository.count(where)
    ]);

    return {
      items: await Promise.all(items.map((sb) => this.formatStorybookResponse(sb, context))),
      page,
      pageSize,
      total
    };
  }

  async getStorybookById(
    storybookId: string,
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const sb = await storybookRepository.findById(storybookId);
    if (!sb) {
      throw new AppError('STORYBOOK_NOT_FOUND', 'Storybook not found.', 404);
    }

    return await this.formatStorybookResponse(sb, context);
  }

  async createStorybook(
    patientId: string,
    userId: string,
    input: {
      title: string;
      description?: string | null;
      coverImage?: string | null;
      generatedStory?: string | null;
      status?: StorybookStatus;
      memoryIds?: string[];
    }
  ) {
    // Cross-reference check if memoryIds provided
    if (input.memoryIds && input.memoryIds.length > 0) {
      const uniqueIds = Array.from(new Set(input.memoryIds));
      const validCount = await prisma.memory.count({
        where: {
          id: { in: uniqueIds },
          patientId,
          deletedAt: null
        }
      });
      if (validCount !== uniqueIds.length) {
        throw new AppError('INVALID_CROSS_REFERENCE', 'One or more memories do not belong to this patient.', 400);
      }
    }

    const placeholderStory = input.generatedStory || '[Draft Storybook: Narrative text placeholder]';

    const storybook = await prisma.$transaction(async (tx) => {
      const created = await tx.storybook.create({
        data: {
          patientId,
          createdBy: userId,
          title: input.title,
          description: input.description || null,
          coverImage: input.coverImage || null,
          generatedStory: placeholderStory,
          status: input.status || StorybookStatus.DRAFT
        }
      });

      if (input.memoryIds && input.memoryIds.length > 0) {
        await tx.storybookMemories.createMany({
          data: input.memoryIds.map((mId, idx) => ({
            storybookId: created.id,
            memoryId: mId,
            sequenceOrder: idx + 1
          }))
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'CREATE_STORYBOOK',
          resourceType: 'Storybook',
          resourceId: created.id,
          metadata: { title: created.title, memoryCount: input.memoryIds?.length || 0 }
        }
      });

      return created;
    });

    const full = await storybookRepository.findById(storybook.id);
    return await this.formatStorybookResponse(full, {
      isPatientSession: false,
      accessRole: AccessRole.OWNER,
      userId
    });
  }

  async updateStorybook(
    storybookId: string,
    userId: string,
    input: {
      title?: string;
      description?: string | null;
      coverImage?: string | null;
      generatedStory?: string | null;
      status?: StorybookStatus;
    }
  ) {
    const existing = await storybookRepository.findById(storybookId);
    if (!existing) {
      throw new AppError('STORYBOOK_NOT_FOUND', 'Storybook not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const sb = await tx.storybook.update({
        where: { id: storybookId },
        data: {
          title: input.title,
          description: input.description,
          coverImage: input.coverImage,
          generatedStory: input.generatedStory,
          status: input.status
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'UPDATE_STORYBOOK',
          resourceType: 'Storybook',
          resourceId: storybookId,
          metadata: { title: sb.title, status: sb.status }
        }
      });

      return sb;
    });

    const full = await storybookRepository.findById(updated.id);
    return await this.formatStorybookResponse(full, {
      isPatientSession: false,
      accessRole: AccessRole.OWNER,
      userId
    });
  }

  async deleteStorybook(storybookId: string, userId: string) {
    const existing = await storybookRepository.findById(storybookId);
    if (!existing) {
      throw new AppError('STORYBOOK_NOT_FOUND', 'Storybook not found.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.storybook.update({
        where: { id: storybookId },
        data: { deletedAt: new Date() }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'DELETE_STORYBOOK',
          resourceType: 'Storybook',
          resourceId: storybookId
        }
      });
    });

    return { id: storybookId, deletedAt: new Date() };
  }

  async addOrSetMemories(
    storybookId: string,
    userId: string,
    input: {
      memoryIds?: string[];
      memoryId?: string;
      sequenceOrder?: number;
    }
  ) {
    const existing = await storybookRepository.findById(storybookId);
    if (!existing) {
      throw new AppError('STORYBOOK_NOT_FOUND', 'Storybook not found.', 404);
    }

    if (input.memoryIds) {
      // Validate all memories belong to patient and active
      const uniqueIds = Array.from(new Set(input.memoryIds));
      if (uniqueIds.length > 0) {
        const validCount = await prisma.memory.count({
          where: {
            id: { in: uniqueIds },
            patientId: existing.patientId,
            deletedAt: null
          }
        });
        if (validCount !== uniqueIds.length) {
          throw new AppError('INVALID_CROSS_REFERENCE', 'One or more memories do not belong to this patient.', 400);
        }
      }

      await storybookRepository.setMemories(storybookId, uniqueIds);
    } else if (input.memoryId) {
      // Validate memory
      const mem = await prisma.memory.findFirst({
        where: { id: input.memoryId, patientId: existing.patientId, deletedAt: null }
      });
      if (!mem) {
        throw new AppError('INVALID_CROSS_REFERENCE', 'Memory does not belong to this patient.', 400);
      }

      await storybookRepository.addMemory(storybookId, input.memoryId, input.sequenceOrder);
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        patientId: existing.patientId,
        action: 'UPDATE_STORYBOOK_MEMORIES',
        resourceType: 'Storybook',
        resourceId: storybookId
      }
    });

    const full = await storybookRepository.findById(storybookId);
    return await this.formatStorybookResponse(full, {
      isPatientSession: false,
      accessRole: AccessRole.OWNER,
      userId
    });
  }

  async removeMemory(storybookId: string, memoryId: string, userId: string) {
    const existing = await storybookRepository.findById(storybookId);
    if (!existing) {
      throw new AppError('STORYBOOK_NOT_FOUND', 'Storybook not found.', 404);
    }

    await storybookRepository.removeMemory(storybookId, memoryId);

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        patientId: existing.patientId,
        action: 'REMOVE_STORYBOOK_MEMORY',
        resourceType: 'Storybook',
        resourceId: storybookId,
        metadata: { memoryId }
      }
    });

    return { storybookId, memoryId };
  }
}

export const storybookService = new StorybookService();

