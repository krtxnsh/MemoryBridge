import { Prisma, Relationship } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class RelationshipRepository {
  async findById(id: string) {
    return prisma.relationship.findFirst({
      where: {
        id,
        personOne: { deletedAt: null },
        personTwo: { deletedAt: null }
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
  }

  async findMany(params: {
    where: Prisma.RelationshipWhereInput;
    orderBy: Prisma.RelationshipOrderByWithRelationInput[];
    skip: number;
    take: number;
  }) {
    return prisma.relationship.findMany({
      where: {
        ...params.where,
        personOne: { deletedAt: null },
        personTwo: { deletedAt: null }
      },
      include: {
        personOne: {
          select: { id: true, fullName: true, profileImage: true, birthYear: true }
        },
        personTwo: {
          select: { id: true, fullName: true, profileImage: true, birthYear: true }
        }
      },
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take
    });
  }

  async count(where: Prisma.RelationshipWhereInput): Promise<number> {
    return prisma.relationship.count({
      where: {
        ...where,
        personOne: { deletedAt: null },
        personTwo: { deletedAt: null }
      }
    });
  }

  async findDuplicate(patientId: string, personOneId: string, personTwoId: string) {
    return prisma.relationship.findFirst({
      where: {
        patientId,
        OR: [
          { personOneId, personTwoId },
          { personOneId: personTwoId, personTwoId: personOneId }
        ],
        personOne: { deletedAt: null },
        personTwo: { deletedAt: null }
      }
    });
  }

  async create(data: Prisma.RelationshipCreateInput): Promise<Relationship> {
    return prisma.relationship.create({
      data,
      include: {
        personOne: {
          select: { id: true, fullName: true, profileImage: true, birthYear: true }
        },
        personTwo: {
          select: { id: true, fullName: true, profileImage: true, birthYear: true }
        }
      }
    });
  }

  async update(id: string, data: Prisma.RelationshipUpdateInput): Promise<Relationship> {
    return prisma.relationship.update({
      where: { id },
      data,
      include: {
        personOne: {
          select: { id: true, fullName: true, profileImage: true, birthYear: true }
        },
        personTwo: {
          select: { id: true, fullName: true, profileImage: true, birthYear: true }
        }
      }
    });
  }

  async delete(id: string): Promise<Relationship> {
    return prisma.relationship.delete({
      where: { id }
    });
  }
}

export const relationshipRepository = new RelationshipRepository();

