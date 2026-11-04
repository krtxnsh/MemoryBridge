import { Prisma, AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { personRepository } from '../repositories/person.repository.js';
import { AppError } from '../middleware/errorHandler.js';

export class PersonService {
  /**
   * Relationship direction convention:
   * "personTwo is personOne's {relationshipType}"
   * When personOne is Rajiv (patient's self personId), personTwo is Anita -> Anita is Rajiv's {relationshipType}.
   */
  private async getRelationshipMap(patientId: string): Promise<Map<string, string>> {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      select: { personId: true }
    });

    const map = new Map<string, string>();
    if (!patient?.personId) return map;

    const rels = await prisma.relationship.findMany({
      where: {
        patientId,
        OR: [
          { personOneId: patient.personId },
          { personTwoId: patient.personId }
        ],
        personOne: { deletedAt: null },
        personTwo: { deletedAt: null }
      }
    });

    for (const r of rels) {
      if (r.personOneId === patient.personId) {
        // Anita (personTwo) is Rajiv's (personOne) {relationshipType}
        map.set(r.personTwoId, r.relationshipType);
      } else {
        // Rajiv is personTwo, personOne is Anita
        map.set(r.personOneId, r.relationshipType);
      }
    }

    return map;
  }

  async listPeople(
    patientId: string,
    params: {
      q?: string;
      confirmedOnly?: boolean;
      page?: number;
      pageSize?: number;
    },
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const where: Prisma.PersonWhereInput = {
      patientId,
      deletedAt: null
    };

    // Patient session callers can ONLY see confirmedByFamily = true
    if (context.isPatientSession || params.confirmedOnly) {
      where.confirmedByFamily = true;
    }

    if (params.q) {
      where.fullName = { contains: params.q, mode: 'insensitive' };
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [people, total] = await Promise.all([
      personRepository.findMany({
        where,
        orderBy: [{ confirmedByFamily: 'desc' }, { fullName: 'asc' }],
        skip,
        take
      }),
      personRepository.count(where)
    ]);

    const personIds = people.map((p) => p.id);
    const [countsMap, relMap] = await Promise.all([
      personRepository.getSharedMemoryCounts(personIds),
      this.getRelationshipMap(patientId)
    ]);

    const items = people.map((p) => ({
      id: p.id,
      patientId: p.patientId,
      fullName: p.fullName,
      biography: p.biography,
      birthYear: p.birthYear,
      profileImage: p.profileImage,
      confirmedByFamily: p.confirmedByFamily,
      sharedMemoryCount: countsMap.get(p.id) || 0,
      relationship: relMap.get(p.id) || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    return {
      items,
      page,
      pageSize,
      total
    };
  }

  async getPersonById(
    personId: string,
    context: {
      isPatientSession: boolean;
      accessRole?: AccessRole;
      userId?: string;
    }
  ) {
    const person = await personRepository.findById(personId);
    if (!person) {
      throw new AppError('PERSON_NOT_FOUND', 'Person not found.', 404);
    }

    // Patient session callers can ONLY see confirmedByFamily = true
    if (context.isPatientSession && !person.confirmedByFamily) {
      throw new AppError('PERSON_NOT_FOUND', 'Person not found.', 404);
    }

    const [sharedMemoryCount, relMap] = await Promise.all([
      personRepository.getSharedMemoryCount(personId),
      this.getRelationshipMap(person.patientId)
    ]);

    return {
      id: person.id,
      patientId: person.patientId,
      fullName: person.fullName,
      biography: person.biography,
      birthYear: person.birthYear,
      profileImage: person.profileImage,
      confirmedByFamily: person.confirmedByFamily,
      sharedMemoryCount,
      relationship: relMap.get(person.id) || null,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt
    };
  }

  async createPerson(
    patientId: string,
    userId: string,
    input: {
      fullName: string;
      biography?: string | null;
      birthYear?: number | null;
      profileImage?: string | null;
      confirmedByFamily?: boolean;
      relationship?: string | null;
    }
  ) {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId, deletedAt: null }
    });

    if (!patient) {
      throw new AppError('PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
    }

    const person = await prisma.$transaction(async (tx) => {
      const created = await tx.person.create({
        data: {
          patientId,
          fullName: input.fullName,
          biography: input.biography || null,
          birthYear: input.birthYear || null,
          profileImage: input.profileImage || null,
          confirmedByFamily: input.confirmedByFamily ?? true
        }
      });

      // If relationship is provided and patient has selfPerson, create relationship
      if (input.relationship && patient.personId) {
        await tx.relationship.create({
          data: {
            patientId,
            personOneId: patient.personId,
            personTwoId: created.id,
            relationshipType: input.relationship
          }
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'CREATE_PERSON',
          resourceType: 'Person',
          resourceId: created.id,
          metadata: { fullName: created.fullName, confirmedByFamily: created.confirmedByFamily }
        }
      });

      return created;
    });

    const relMap = await this.getRelationshipMap(patientId);

    return {
      id: person.id,
      patientId: person.patientId,
      fullName: person.fullName,
      biography: person.biography,
      birthYear: person.birthYear,
      profileImage: person.profileImage,
      confirmedByFamily: person.confirmedByFamily,
      sharedMemoryCount: 0,
      relationship: relMap.get(person.id) || null,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt
    };
  }

  async updatePerson(
    personId: string,
    userId: string,
    input: {
      fullName?: string;
      biography?: string | null;
      birthYear?: number | null;
      profileImage?: string | null;
      confirmedByFamily?: boolean;
      relationship?: string | null;
    }
  ) {
    const existing = await personRepository.findById(personId);
    if (!existing) {
      throw new AppError('PERSON_NOT_FOUND', 'Person not found.', 404);
    }

    const patient = existing.patient;

    const person = await prisma.$transaction(async (tx) => {
      const updated = await tx.person.update({
        where: { id: personId },
        data: {
          fullName: input.fullName,
          biography: input.biography,
          birthYear: input.birthYear,
          profileImage: input.profileImage,
          confirmedByFamily: input.confirmedByFamily
        }
      });

      // If relationship specified and patient self-person exists
      if (input.relationship !== undefined && patient.personId && patient.personId !== personId) {
        if (input.relationship === null) {
          // Remove relationship with patient self
          await tx.relationship.deleteMany({
            where: {
              patientId: existing.patientId,
              OR: [
                { personOneId: patient.personId, personTwoId: personId },
                { personOneId: personId, personTwoId: patient.personId }
              ]
            }
          });
        } else {
          // Upsert relationship: personOne = patient.personId, personTwo = personId
          const existingRel = await tx.relationship.findFirst({
            where: {
              patientId: existing.patientId,
              OR: [
                { personOneId: patient.personId, personTwoId: personId },
                { personOneId: personId, personTwoId: patient.personId }
              ]
            }
          });

          if (existingRel) {
            await tx.relationship.update({
              where: { id: existingRel.id },
              data: { relationshipType: input.relationship }
            });
          } else {
            await tx.relationship.create({
              data: {
                patientId: existing.patientId,
                personOneId: patient.personId,
                personTwoId: personId,
                relationshipType: input.relationship
              }
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: existing.patientId,
          action: 'UPDATE_PERSON',
          resourceType: 'Person',
          resourceId: personId,
          metadata: {
            fullName: updated.fullName,
            confirmedByFamily: updated.confirmedByFamily
          }
        }
      });

      return updated;
    });

    const [sharedMemoryCount, relMap] = await Promise.all([
      personRepository.getSharedMemoryCount(personId),
      this.getRelationshipMap(existing.patientId)
    ]);

    return {
      id: person.id,
      patientId: person.patientId,
      fullName: person.fullName,
      biography: person.biography,
      birthYear: person.birthYear,
      profileImage: person.profileImage,
      confirmedByFamily: person.confirmedByFamily,
      sharedMemoryCount,
      relationship: relMap.get(person.id) || null,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt
    };
  }

  async deletePerson(personId: string, userId: string) {
    const person = await personRepository.findById(personId);
    if (!person) {
      throw new AppError('PERSON_NOT_FOUND', 'Person not found.', 404);
    }

    // Do not allow deleting patient's own Person record
    if (person.patient.personId === personId) {
      throw new AppError('CANNOT_DELETE_SELF_PERSON', 'Cannot delete the patient self-person record.', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { id: personId },
        data: { deletedAt: new Date() }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: person.patientId,
          action: 'DELETE_PERSON',
          resourceType: 'Person',
          resourceId: personId
        }
      });
    });

    return { id: personId, deletedAt: new Date() };
  }
}

export const personService = new PersonService();

