import crypto from 'crypto';
import { Prisma, VerificationStatus, MemorySource, AccessRole, EmbeddingStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { memoryRepository } from '../repositories/memory.repository.js';
import { AppError } from '../middleware/errorHandler.js';

export class MemoryService {
  private computeContentHash(title: string, story: string): string {
    return crypto.createHash('sha256').update(`${title}:${story}`).digest('hex');
  }

  private escapeLike(str: string): string {
    return str.replace(/[%_\\]/g, '\\$&');
  }

  private buildVisibilityFilter(
    isPatientSession: boolean,
    accessRole?: AccessRole,
    userId?: string,
    requestedStatus?: VerificationStatus
  ): Prisma.MemoryWhereInput {
    // 1. Patient tablet token or VIEWER: STRICTLY VERIFIED ONLY
    if (isPatientSession || accessRole === AccessRole.VIEWER) {
      return { verificationStatus: VerificationStatus.VERIFIED };
    }

    // 2. FAMILY: Verified memories OR their own submissions
    if (accessRole === AccessRole.FAMILY) {
      if (requestedStatus === VerificationStatus.VERIFIED) {
        return { verificationStatus: VerificationStatus.VERIFIED };
      }
      if (requestedStatus) {
        // Can only filter their own submissions for non-verified statuses
        return {
          verificationStatus: requestedStatus,
          createdBy: userId
        };
      }
      return {
        OR: [
          { verificationStatus: VerificationStatus.VERIFIED },
          { createdBy: userId }
        ]
      };
    }

    // 3. OWNER or CAREGIVER: Can see all statuses
    if (accessRole === AccessRole.OWNER || accessRole === AccessRole.CAREGIVER) {
      if (requestedStatus) {
        return { verificationStatus: requestedStatus };
      }
      return {};
    }

    return { verificationStatus: VerificationStatus.VERIFIED };
  }

  // Derive relationship label for a person relative to the patient self-person
  private async getRelationshipMap(patientId: string): Promise<Map<string, string>> {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: { personId: true }
    });

    const map = new Map<string, string>();
    if (!patient?.personId) return map;

    // Convention: personTwo is personOne's {relationshipType}.
    // If personOne is Rajiv (self), personTwo is Anita -> relationshipType is "Spouse" (Anita is Rajiv's Spouse).
    const rels = await prisma.relationship.findMany({
      where: {
        patientId,
        OR: [
          { personOneId: patient.personId },
          { personTwoId: patient.personId }
        ]
      }
    });

    for (const r of rels) {
      if (r.personOneId === patient.personId) {
        map.set(r.personTwoId, r.relationshipType);
      } else {
        map.set(r.personOneId, r.relationshipType);
      }
    }

    return map;
  }

  private formatMemoryItem(m: any, relMap: Map<string, string>) {
    return {
      id: m.id,
      patientId: m.patientId,
      albumId: m.albumId,
      album: m.album ? { id: m.album.id, title: m.album.title, colorTheme: m.album.colorTheme } : null,
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
      songId: m.songId,
      mapCoordinates: m.mapX !== null && m.mapY !== null ? { x: m.mapX, y: m.mapY, label: m.mapLabel } : null,
      people: (m.people || []).map((p: any) => ({
        id: p.person.id,
        fullName: p.person.fullName,
        profileImage: p.person.profileImage,
        relationship: relMap.get(p.person.id) || 'Family Member'
      })),
      media: (m.media || []).map((med: any) => ({
        id: med.id,
        mediaType: med.mediaType,
        fileName: med.fileName,
        mimeType: med.mimeType,
        caption: med.caption,
        url: null // Private media: signed URLs in Phase 6
      })),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    };
  }

  async listOrSearchMemories(
    patientId: string,
    params: {
      q?: string;
      year?: number;
      yearFrom?: number;
      yearTo?: number;
      era?: string;
      location?: string;
      eventType?: string;
      personId?: string;
      albumId?: string;
      status?: VerificationStatus;
      tag?: string;
      sort?: string;
      order?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    },
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const visibility = this.buildVisibilityFilter(
      context.isPatientSession,
      context.accessRole,
      context.userId,
      params.status
    );

    const where: Prisma.MemoryWhereInput = {
      patientId,
      deletedAt: null,
      ...visibility
    };

    if (params.year) {
      where.approximateYear = params.year;
    }

    if (params.yearFrom || params.yearTo) {
      where.approximateYear = {
        ...(params.yearFrom ? { gte: params.yearFrom } : {}),
        ...(params.yearTo ? { lte: params.yearTo } : {})
      };
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
        some: { personId: params.personId }
      };
    }

    if (params.tag) {
      where.tags = { has: params.tag };
    }

    if (params.q) {
      const escaped = this.escapeLike(params.q);
      where.OR = [
        { title: { contains: escaped, mode: 'insensitive' } },
        { description: { contains: escaped, mode: 'insensitive' } },
        { story: { contains: escaped, mode: 'insensitive' } },
        { location: { contains: escaped, mode: 'insensitive' } },
        { tags: { has: params.q } }
      ];
    }

    // Sort whitelist
    const sortField = params.sort || 'eventDate';
    const sortOrder = params.order || 'asc';
    const orderBy: Prisma.MemoryOrderByWithRelationInput[] = [
      { [sortField]: sortOrder },
      { createdAt: 'desc' }
    ];

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, total] = await Promise.all([
      memoryRepository.findMany({ where, orderBy, skip, take }),
      memoryRepository.count(where)
    ]);

    const relMap = await this.getRelationshipMap(patientId);

    return {
      items: items.map((m) => this.formatMemoryItem(m, relMap)),
      page,
      pageSize,
      total
    };
  }

  async getMemoryById(
    memoryId: string,
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const memory = await memoryRepository.findById(memoryId);
    if (!memory) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    // Check visibility permissions
    if (context.isPatientSession || context.accessRole === AccessRole.VIEWER) {
      if (memory.verificationStatus !== VerificationStatus.VERIFIED) {
        throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
      }
    } else if (context.accessRole === AccessRole.FAMILY) {
      if (memory.verificationStatus !== VerificationStatus.VERIFIED && memory.createdBy !== context.userId) {
        throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
      }
    }

    const relMap = await this.getRelationshipMap(memory.patientId);
    return this.formatMemoryItem(memory, relMap);
  }

  async createMemory(
    patientId: string,
    userId: string,
    accessRole: AccessRole,
    input: {
      title: string;
      description?: string | null;
      story: string;
      audioDescription?: string | null;
      eventDate?: string | null;
      approximateYear?: number | null;
      location?: string | null;
      eventType?: string | null;
      era: string;
      tags: string[];
      albumId?: string | null;
      songId?: string | null;
      mapX?: number | null;
      mapY?: number | null;
      mapLabel?: string | null;
      personIds: string[];
    }
  ) {
    // 1. Cross-reference validations: dedupe and check all personIds belong to patient
    const uniquePersonIds = Array.from(new Set(input.personIds));
    if (uniquePersonIds.length > 0) {
      const validPeopleCount = await prisma.person.count({
        where: {
          id: { in: uniquePersonIds },
          patientId,
          deletedAt: null
        }
      });
      if (validPeopleCount !== uniquePersonIds.length) {
        throw new AppError('INVALID_CROSS_REFERENCE', 'One or more persons do not belong to this patient.', 400);
      }
    }

    // 2. Validate album belongs to patient
    if (input.albumId) {
      const album = await prisma.album.findFirst({
        where: { id: input.albumId, patientId }
      });
      if (!album) {
        throw new AppError('INVALID_CROSS_REFERENCE', 'Album does not belong to this patient.', 400);
      }
    }

    // 3. Source assignment: FAMILY -> FAMILY_SUBMITTED, CAREGIVER/OWNER -> CAREGIVER
    const source: MemorySource =
      accessRole === AccessRole.OWNER || accessRole === AccessRole.CAREGIVER
        ? MemorySource.CAREGIVER
        : MemorySource.FAMILY_SUBMITTED;

    // 4. Memory creation: ALWAYS starts as PENDING!
    const verificationStatus = VerificationStatus.PENDING;
    const contentHash = this.computeContentHash(input.title, input.story);

    const eventDate = input.eventDate ? new Date(input.eventDate) : null;

    const memory = await memoryRepository.create(
      {
        patient: { connect: { id: patientId } },
        creator: { connect: { id: userId } },
        title: input.title,
        description: input.description || null,
        story: input.story,
        audioDescription: input.audioDescription || null,
        eventDate,
        approximateYear: input.approximateYear || null,
        location: input.location || null,
        eventType: input.eventType || null,
        era: input.era,
        tags: input.tags,
        source,
        verificationStatus,
        songId: input.songId || null,
        mapX: input.mapX ?? null,
        mapY: input.mapY ?? null,
        mapLabel: input.mapLabel || null,
        contentHash,
        embeddingStatus: EmbeddingStatus.PENDING,
        album: input.albumId ? { connect: { id: input.albumId } } : undefined
      },
      uniquePersonIds
    );

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        patientId,
        action: 'CREATE_MEMORY',
        resourceType: 'Memory',
        resourceId: memory.id,
        metadata: { title: memory.title, source, verificationStatus }
      }
    });

    const relMap = await this.getRelationshipMap(patientId);
    return this.formatMemoryItem(memory, relMap);
  }

  async updateMemory(
    memoryId: string,
    userId: string,
    accessRole: AccessRole,
    input: {
      title?: string;
      description?: string | null;
      story?: string;
      audioDescription?: string | null;
      eventDate?: string | null;
      approximateYear?: number | null;
      location?: string | null;
      eventType?: string | null;
      era?: string;
      tags?: string[];
      albumId?: string | null;
      songId?: string | null;
      mapX?: number | null;
      mapY?: number | null;
      mapLabel?: string | null;
      personIds?: string[];
      reverify?: boolean;
    }
  ) {
    const memory = await memoryRepository.findById(memoryId);
    if (!memory) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    // Role check:
    // OWNER/CAREGIVER can edit any; FAMILY can edit only their own PENDING submissions
    if (accessRole === AccessRole.FAMILY) {
      if (memory.createdBy !== userId || memory.verificationStatus !== VerificationStatus.PENDING) {
        throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
      }
    } else if (accessRole !== AccessRole.OWNER && accessRole !== AccessRole.CAREGIVER) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    // Cross-reference checks
    if (input.albumId) {
      const album = await prisma.album.findFirst({
        where: { id: input.albumId, patientId: memory.patientId }
      });
      if (!album) {
        throw new AppError('INVALID_CROSS_REFERENCE', 'Album does not belong to this patient.', 400);
      }
    }

    let uniquePersonIds: string[] | undefined;
    if (input.personIds) {
      uniquePersonIds = Array.from(new Set(input.personIds));
      if (uniquePersonIds.length > 0) {
        const validCount = await prisma.person.count({
          where: {
            id: { in: uniquePersonIds },
            patientId: memory.patientId,
            deletedAt: null
          }
        });
        if (validCount !== uniquePersonIds.length) {
          throw new AppError('INVALID_CROSS_REFERENCE', 'One or more persons do not belong to this patient.', 400);
        }
      }
    }

    // Check if content changed
    const contentFieldsChanged =
      (input.title !== undefined && input.title !== memory.title) ||
      (input.description !== undefined && input.description !== memory.description) ||
      (input.story !== undefined && input.story !== memory.story) ||
      (input.location !== undefined && input.location !== memory.location) ||
      (input.eventType !== undefined && input.eventType !== memory.eventType) ||
      (input.era !== undefined && input.era !== memory.era) ||
      (input.approximateYear !== undefined && input.approximateYear !== memory.approximateYear) ||
      (input.eventDate !== undefined) ||
      (uniquePersonIds !== undefined);

    let nextStatus = memory.verificationStatus;
    let nextApprovedBy = memory.approvedById;
    let writeVerificationRecord = false;
    let verificationStatusComment = '';

    // SAFETY RULE: If a VERIFIED memory is edited, it returns to PENDING unless reverify: true is passed by OWNER/CAREGIVER
    if (memory.verificationStatus === VerificationStatus.VERIFIED && contentFieldsChanged) {
      if (input.reverify === true && (accessRole === AccessRole.OWNER || accessRole === AccessRole.CAREGIVER)) {
        nextStatus = VerificationStatus.VERIFIED;
        nextApprovedBy = userId;
        writeVerificationRecord = true;
        verificationStatusComment = 'Re-verified upon content edit';
      } else {
        nextStatus = VerificationStatus.PENDING;
        nextApprovedBy = null;
        writeVerificationRecord = true;
        verificationStatusComment = 'Auto-reverted to PENDING due to content modification';
      }
    }

    const nextTitle = input.title !== undefined ? input.title : memory.title;
    const nextStory = input.story !== undefined ? input.story : memory.story;
    const contentHash = contentFieldsChanged ? this.computeContentHash(nextTitle, nextStory) : memory.contentHash;

    const result = await prisma.$transaction(async (tx) => {
      // If people changed, replace relations
      if (uniquePersonIds !== undefined) {
        await tx.memoryPeople.deleteMany({ where: { memoryId } });
        if (uniquePersonIds.length > 0) {
          await tx.memoryPeople.createMany({
            data: uniquePersonIds.map((pId) => ({ memoryId, personId: pId }))
          });
        }
      }

      // Update memory
      const updated = await tx.memory.update({
        where: { id: memoryId },
        data: {
          title: input.title,
          description: input.description,
          story: input.story,
          audioDescription: input.audioDescription,
          eventDate: input.eventDate ? new Date(input.eventDate) : input.eventDate === null ? null : undefined,
          approximateYear: input.approximateYear,
          location: input.location,
          eventType: input.eventType,
          era: input.era,
          tags: input.tags,
          albumId: input.albumId === '' ? null : input.albumId,
          songId: input.songId === '' ? null : input.songId,
          mapX: input.mapX,
          mapY: input.mapY,
          mapLabel: input.mapLabel,
          verificationStatus: nextStatus,
          approvedById: nextApprovedBy,
          contentHash,
          embeddingStatus: contentFieldsChanged ? EmbeddingStatus.PENDING : undefined
        },
        include: {
          people: { include: { person: true } },
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

      // Write Verification audit row if auto-reverted or reverified
      if (writeVerificationRecord) {
        await tx.verification.create({
          data: {
            memoryId,
            verifiedById: userId,
            status: nextStatus,
            comments: verificationStatusComment
          }
        });
      }

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: memory.patientId,
          action: 'UPDATE_MEMORY',
          resourceType: 'Memory',
          resourceId: memoryId,
          metadata: {
            contentFieldsChanged,
            verificationStatus: nextStatus,
            reverified: input.reverify === true
          }
        }
      });

      return updated;
    });

    const relMap = await this.getRelationshipMap(memory.patientId);
    return this.formatMemoryItem(result, relMap);
  }

  async deleteMemory(memoryId: string, userId: string, accessRole: AccessRole) {
    const memory = await memoryRepository.findById(memoryId);
    if (!memory) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    if (accessRole === AccessRole.FAMILY) {
      if (memory.createdBy !== userId || memory.verificationStatus !== VerificationStatus.PENDING) {
        throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
      }
    } else if (accessRole !== AccessRole.OWNER && accessRole !== AccessRole.CAREGIVER) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.memory.update({
        where: { id: memoryId },
        data: { deletedAt: new Date() }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: memory.patientId,
          action: 'DELETE_MEMORY',
          resourceType: 'Memory',
          resourceId: memoryId
        }
      });
    });

    return { id: memoryId, deletedAt: new Date() };
  }

  async setMemoryPeople(memoryId: string, personIds: string[], userId: string, accessRole: AccessRole) {
    const memory = await memoryRepository.findById(memoryId);
    if (!memory) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    if (accessRole === AccessRole.FAMILY) {
      if (memory.createdBy !== userId || memory.verificationStatus !== VerificationStatus.PENDING) {
        throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
      }
    } else if (accessRole !== AccessRole.OWNER && accessRole !== AccessRole.CAREGIVER) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    const uniqueIds = Array.from(new Set(personIds));
    if (uniqueIds.length > 0) {
      const validCount = await prisma.person.count({
        where: {
          id: { in: uniqueIds },
          patientId: memory.patientId,
          deletedAt: null
        }
      });
      if (validCount !== uniqueIds.length) {
        throw new AppError('INVALID_CROSS_REFERENCE', 'One or more persons do not belong to this patient.', 400);
      }
    }

    await memoryRepository.replacePeople(memoryId, uniqueIds);
    return this.getMemoryById(memoryId, { isPatientSession: false, accessRole, userId });
  }

  async addPersonToMemory(memoryId: string, personId: string, userId: string, accessRole: AccessRole) {
    const memory = await memoryRepository.findById(memoryId);
    if (!memory) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    if (accessRole === AccessRole.FAMILY) {
      if (memory.createdBy !== userId || memory.verificationStatus !== VerificationStatus.PENDING) {
        throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
      }
    } else if (accessRole !== AccessRole.OWNER && accessRole !== AccessRole.CAREGIVER) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    const person = await prisma.person.findFirst({
      where: { id: personId, patientId: memory.patientId, deletedAt: null }
    });
    if (!person) {
      throw new AppError('INVALID_CROSS_REFERENCE', 'Person does not belong to this patient.', 400);
    }

    await memoryRepository.addPerson(memoryId, personId);
    return this.getMemoryById(memoryId, { isPatientSession: false, accessRole, userId });
  }

  async removePersonFromMemory(memoryId: string, personId: string, userId: string, accessRole: AccessRole) {
    const memory = await memoryRepository.findById(memoryId);
    if (!memory) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    if (accessRole === AccessRole.FAMILY) {
      if (memory.createdBy !== userId || memory.verificationStatus !== VerificationStatus.PENDING) {
        throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
      }
    } else if (accessRole !== AccessRole.OWNER && accessRole !== AccessRole.CAREGIVER) {
      throw new AppError('MEMORY_NOT_FOUND', 'Memory not found.', 404);
    }

    await memoryRepository.removePerson(memoryId, personId);
    return this.getMemoryById(memoryId, { isPatientSession: false, accessRole, userId });
  }

  async getMemoriesForPerson(
    personId: string,
    params: { page?: number; pageSize?: number },
    context: { isPatientSession: boolean; accessRole?: AccessRole; userId?: string }
  ) {
    const person = await prisma.person.findFirst({
      where: { id: personId, deletedAt: null }
    });
    if (!person) {
      throw new AppError('PERSON_NOT_FOUND', 'Person not found.', 404);
    }

    return this.listOrSearchMemories(person.patientId, { ...params, personId }, context);
  }
}

export const memoryService = new MemoryService();

