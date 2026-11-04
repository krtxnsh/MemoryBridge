import { prisma } from '../config/prisma.js';
import { AccessRole, PatientProfile, PatientAccess } from '@prisma/client';

export class PatientRepository {
  async findById(id: string): Promise<PatientProfile | null> {
    return prisma.patientProfile.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async findAccessibleByUser(userId: string): Promise<Array<PatientAccess & { patient: PatientProfile }>> {
    return prisma.patientAccess.findMany({
      where: {
        userId,
        patient: { deletedAt: null }
      },
      include: {
        patient: true
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async findAccess(userId: string, patientId: string): Promise<PatientAccess | null> {
    return prisma.patientAccess.findUnique({
      where: {
        userId_patientId: { userId, patientId }
      }
    });
  }

  async createPatientWithSelfPerson(params: {
    userId: string;
    fullName: string;
    relationship: string;
    dateOfBirth?: Date | null;
    profileImage?: string | null;
    preferredLanguage?: string;
    biography?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create PatientProfile
      const patient = await tx.patientProfile.create({
        data: {
          fullName: params.fullName,
          dateOfBirth: params.dateOfBirth || null,
          profileImage: params.profileImage || null,
          preferredLanguage: params.preferredLanguage || 'en',
          biography: params.biography || null,
          isDemo: false
        }
      });

      // 2. Create the patient's own Person record (for self-representation in relationships/memories)
      const selfPerson = await tx.person.create({
        data: {
          patientId: patient.id,
          fullName: params.fullName,
          biography: params.biography || null,
          birthYear: params.dateOfBirth ? params.dateOfBirth.getFullYear() : null,
          profileImage: params.profileImage || null,
          confirmedByFamily: true
        }
      });

      // 3. Link selfPerson to PatientProfile.personId
      const updatedPatient = await tx.patientProfile.update({
        where: { id: patient.id },
        data: { personId: selfPerson.id }
      });

      // 4. Create OWNER PatientAccess
      const access = await tx.patientAccess.create({
        data: {
          userId: params.userId,
          patientId: patient.id,
          relationship: params.relationship,
          accessRole: AccessRole.OWNER
        }
      });

      // 5. Create AuditLog
      await tx.auditLog.create({
        data: {
          actorId: params.userId,
          patientId: patient.id,
          action: 'CREATE_PATIENT',
          resourceType: 'PatientProfile',
          resourceId: patient.id,
          metadata: {
            fullName: patient.fullName,
            personId: selfPerson.id,
            accessRole: access.accessRole
          }
        }
      });

      return {
        patient: updatedPatient,
        selfPerson,
        access
      };
    });
  }

  async update(id: string, data: {
    fullName?: string;
    dateOfBirth?: Date | null;
    profileImage?: string | null;
    preferredLanguage?: string;
    biography?: string | null;
  }): Promise<PatientProfile> {
    return prisma.patientProfile.update({
      where: { id },
      data
    });
  }

  async softDelete(id: string, userId: string): Promise<PatientProfile> {
    return prisma.$transaction(async (tx) => {
      const patient = await tx.patientProfile.update({
        where: { id },
        data: { deletedAt: new Date() }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId: id,
          action: 'DELETE_PATIENT',
          resourceType: 'PatientProfile',
          resourceId: id
        }
      });

      return patient;
    });
  }
}

export const patientRepository = new PatientRepository();

