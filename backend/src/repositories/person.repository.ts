import { Prisma, Person, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class PersonRepository {
  async findById(id: string) {
    return prisma.person.findFirst({
      where: { id, deletedAt: null },
      include: {
        patient: {
          select: { id: true, personId: true }
        }
      }
    });
  }

  async findMany(params: {
    where: Prisma.PersonWhereInput;
    orderBy: Prisma.PersonOrderByWithRelationInput[];
    skip: number;
    take: number;
  }) {
    return prisma.person.findMany({
      where: params.where,
      orderBy: params.orderBy,
      skip: params.skip,
      take: params.take
    });
  }

  async count(where: Prisma.PersonWhereInput): Promise<number> {
    return prisma.person.count({ where });
  }

  async create(data: Prisma.PersonCreateInput): Promise<Person> {
    return prisma.person.create({ data });
  }

  async update(id: string, data: Prisma.PersonUpdateInput): Promise<Person> {
    return prisma.person.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string): Promise<Person> {
    return prisma.person.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async getSharedMemoryCount(personId: string): Promise<number> {
    return prisma.memoryPeople.count({
      where: {
        personId,
        memory: {
          deletedAt: null,
          verificationStatus: VerificationStatus.VERIFIED
        }
      }
    });
  }

  async getSharedMemoryCounts(personIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (personIds.length === 0) return counts;

    const results = await prisma.memoryPeople.groupBy({
      by: ['personId'],
      where: {
        personId: { in: personIds },
        memory: {
          deletedAt: null,
          verificationStatus: VerificationStatus.VERIFIED
        }
      },
      _count: {
        memoryId: true
      }
    });

    for (const r of results) {
      counts.set(r.personId, r._count.memoryId);
    }

    return counts;
  }
}

export const personRepository = new PersonRepository();

