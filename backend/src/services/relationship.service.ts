import { Prisma, AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { relationshipRepository } from '../repositories/relationship.repository.js';
import { AppError } from '../middleware/errorHandler.js';

export class RelationshipService {
  async listRelationships(
    patientId: string,
    params: {
      personId?: string;
      page?: number;
      pageSize?: number;
    },
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const where: Prisma.RelationshipWhereInput = {
      patientId
    };

    if (params.personId) {
      where.OR = [
        { personOneId: params.personId },
        { personTwoId: params.personId }
      ];
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, total] = await Promise.all([
      relationshipRepository.findMany({
        where,
        orderBy: [{ createdAt: 'asc' }],
        skip,
        take
      }),
      relationshipRepository.count(where)
    ]);

    return {
      items,
      page,
      pageSize,
      total
    };
  }

  async getRelationshipById(
    id: string,
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const rel = await relationshipRepository.findById(id);
    if (!rel) {
      throw new AppError('RELATIONSHIP_NOT_FOUND', 'Relationship not found.', 404);
    }

    return rel;
  }

  async createRelationship(
    patientId: string,
    userId: string,
    input: {
      personOneId: string;
      personTwoId: string;
      relationshipType: string;
      description?: string | null;
    }
  ) {
    if (input.personOneId === input.personTwoId) {
      throw new AppError('INVALID_RELATIONSHIP', 'A person cannot have a relationship with themselves.', 400);
    }

    // Verify both persons belong to this patient and are active
    const people = await prisma.person.findMany({
      where: {
        id: { in: [input.personOneId, input.personTwoId] },
        patientId,
        deletedAt: null
      }
    });

    if (people.length !== 2) {
      throw new AppError('INVALID_CROSS_REFERENCE', 'Both persons must belong to the patient and be non-deleted.', 400);
    }

    // Check for existing duplicate in either direction
    const duplicate = await relationshipRepository.findDuplicate(
      patientId,
      input.personOneId,
      input.personTwoId
    );

    if (duplicate) {
      throw new AppError('DUPLICATE_RELATIONSHIP', 'A relationship already exists between these persons.', 409);
    }

    const created = await prisma.$transaction(async (tx) => {
      const rel = await tx.relationship.create({
        data: {
          patientId,
          personOneId: input.personOneId,
          personTwoId: input.personTwoId,
          relationshipType: input.relationshipType,
          description: input.description || null
        },
        include: {
          personOne: {
            select: { id: true, fullName: true, profileImage: true, birthYear: true }
          },
          personTwo: {
            select: { id: true, fullName: true, profileImage: true, birthYear: true }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'CREATE_RELATIONSHIP',
          resourceType: 'Relationship',
          resourceId: rel.id,
          metadata: {
            personOneId: input.personOneId,
            personTwoId: input.personTwoId,
            relationshipType: input.relationshipType
          }
        }
      });

      return rel;
    });

    return created;
  }

  async updateRelationship(
    id: string,
    userId: string,
    input: {
      relationshipType?: string;
      description?: string | null;
    }
  ) {
    const existing = await relationshipRepository.findById(id);
    if (!existing) {
      throw new AppError('RELATIONSHIP_NOT_FOUND', 'Relationship not found.', 404);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const rel = await tx.relationship.update({
        where: { id },
        data: {
          relationshipType: input.relationshipType,
          description: input.description
        },
        include: {
          personOne: {
            select: { id: true, fullName: true, profileImage: true, birthYear: true }
          },
          personTwo: {
            select: { id: true, fullName: true, profileImage: true, birthYear: true }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'UPDATE_RELATIONSHIP',
          resourceType: 'Relationship',
          resourceId: id,
          metadata: {
            relationshipType: rel.relationshipType
          }
        }
      });

      return rel;
    });

    return updated;
  }

  async deleteRelationship(id: string, userId: string) {
    const existing = await relationshipRepository.findById(id);
    if (!existing) {
      throw new AppError('RELATIONSHIP_NOT_FOUND', 'Relationship not found.', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.relationship.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'DELETE_RELATIONSHIP',
          resourceType: 'Relationship',
          resourceId: id
        }
      });
    });

    return { id };
  }
}

export const relationshipService = new RelationshipService();

