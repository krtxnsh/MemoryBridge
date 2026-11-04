import { VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export interface CreatePersonInput {
  fullName: string;
  biography?: string;
  birthYear?: number;
  profileImage?: string;
  relationship?: string;
}

export interface CreateRelationshipInput {
  personOneId: string;
  personTwoId: string;
  relationshipType: string;
  description?: string;
}

export class PersonService {
  async listPeople(patientId: string) {
    const people = await prisma.person.findMany({
      where: {
        patientId,
        deletedAt: null
      },
      include: {
        relationshipsAsTwo: {
          include: {
            personOne: {
              select: { id: true, fullName: true }
            }
          }
        },
        relationshipsAsOne: {
          include: {
            personTwo: {
              select: { id: true, fullName: true }
            }
          }
        },
        memories: {
          where: {
            memory: {
              deletedAt: null,
              verificationStatus: VerificationStatus.VERIFIED
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return people.map((person) => {
      // Find direct relationship relative to patient self-person or primary relationship
      const relToOne = person.relationshipsAsTwo[0]?.relationshipType;
      const relToTwo = person.relationshipsAsOne[0]?.relationshipType;
      const relationship = relToOne || relToTwo || 'Family Member';

      return {
        id: person.id,
        fullName: person.fullName,
        biography: person.biography,
        birthYear: person.birthYear,
        profileImage: person.profileImage,
        confirmedByFamily: person.confirmedByFamily,
        relationship,
        sharedMemoryCount: person.memories.length,
        createdAt: person.createdAt
      };
    });
  }

  async getPersonById(id: string) {
    const person = await prisma.person.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        relationshipsAsOne: {
          include: { personTwo: true }
        },
        relationshipsAsTwo: {
          include: { personOne: true }
        },
        memories: {
          where: {
            memory: {
              deletedAt: null,
              verificationStatus: VerificationStatus.VERIFIED
            }
          },
          include: {
            memory: {
              select: {
                id: true,
                title: true,
                approximateYear: true,
                era: true
              }
            }
          }
        }
      }
    });

    if (!person) {
      throw new AppError('PERSON_NOT_FOUND', 'Person not found', 404);
    }

    return person;
  }

  async createPerson(patientId: string, userId: string, input: CreatePersonInput) {
    return prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          patientId,
          fullName: input.fullName,
          biography: input.biography || null,
          birthYear: input.birthYear || null,
          profileImage: input.profileImage || null,
          confirmedByFamily: true
        }
      });

      // If a relationship was provided, link with patient's self-person profile if available
      if (input.relationship) {
        const patient = await tx.patientProfile.findUnique({
          where: { id: patientId }
        });

        if (patient?.personId) {
          await tx.relationship.create({
            data: {
              patientId,
              personOneId: patient.personId,
              personTwoId: person.id,
              relationshipType: input.relationship
            }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'CREATE_PERSON',
          resourceType: 'Person',
          resourceId: person.id,
          metadata: { fullName: person.fullName }
        }
      });

      return person;
    });
  }

  async updatePerson(id: string, userId: string, patientId: string, input: Partial<CreatePersonInput>) {
    const person = await prisma.person.update({
      where: { id },
      data: {
        fullName: input.fullName,
        biography: input.biography,
        birthYear: input.birthYear,
        profileImage: input.profileImage
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        patientId,
        action: 'UPDATE_PERSON',
        resourceType: 'Person',
        resourceId: id
      }
    });

    return person;
  }

  async deletePerson(id: string, userId: string, patientId: string) {
    const person = await prisma.person.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        patientId,
        action: 'DELETE_PERSON',
        resourceType: 'Person',
        resourceId: id
      }
    });

    return person;
  }

  async listRelationships(patientId: string) {
    return prisma.relationship.findMany({
      where: { patientId },
      include: {
        personOne: { select: { id: true, fullName: true, profileImage: true } },
        personTwo: { select: { id: true, fullName: true, profileImage: true } }
      }
    });
  }

  async createRelationship(patientId: string, userId: string, input: CreateRelationshipInput) {
    const relationship = await prisma.relationship.upsert({
      where: {
        patientId_personOneId_personTwoId_relationshipType: {
          patientId,
          personOneId: input.personOneId,
          personTwoId: input.personTwoId,
          relationshipType: input.relationshipType
        }
      },
      create: {
        patientId,
        personOneId: input.personOneId,
        personTwoId: input.personTwoId,
        relationshipType: input.relationshipType,
        description: input.description || null
      },
      update: {
        description: input.description || null
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        patientId,
        action: 'UPSERT_RELATIONSHIP',
        resourceType: 'Relationship',
        resourceId: relationship.id
      }
    });

    return relationship;
  }

  async getConnectionsGraph(patientId: string) {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId }
    });

    const people = await prisma.person.findMany({
      where: { patientId, deletedAt: null },
      include: {
        relationshipsAsTwo: true,
        relationshipsAsOne: true
      }
    });

    const memories = await prisma.memory.findMany({
      where: {
        patientId,
        deletedAt: null,
        verificationStatus: VerificationStatus.VERIFIED
      },
      include: {
        people: true
      }
    });

    const nodes: any[] = [];
    const links: any[] = [];

    // Root patient node
    nodes.push({
      id: `patient-${patientId}`,
      label: patient?.fullName || 'Patient',
      type: 'patient',
      color: '#F36B32'
    });

    // People nodes
    for (const p of people) {
      nodes.push({
        id: `person-${p.id}`,
        label: p.fullName,
        type: 'person',
        image: p.profileImage,
        color: '#4B5563'
      });

      // Link to patient
      links.push({
        source: `patient-${patientId}`,
        target: `person-${p.id}`,
        label: p.relationshipsAsTwo[0]?.relationshipType || 'Family'
      });
    }

    // Memories / Events
    for (const m of memories) {
      nodes.push({
        id: `mem-${m.id}`,
        label: m.title,
        year: m.approximateYear,
        type: 'memory',
        color: '#F59E0B'
      });

      // Link tagged people to memory
      for (const mp of m.people) {
        links.push({
          source: `person-${mp.personId}`,
          target: `mem-${m.id}`,
          label: 'Shared Memory'
        });
      }

      // Link memory to patient
      links.push({
        source: `patient-${patientId}`,
        target: `mem-${m.id}`,
        label: m.era
      });
    }

    return { nodes, links };
  }
}

export const personService = new PersonService();
