import { patientRepository } from '../repositories/patient.repository.js';
import { AppError } from '../middleware/errorHandler.js';
import { AccessRole } from '@prisma/client';

export class PatientService {
  async listPatients(userId: string) {
    const accessRecords = await patientRepository.findAccessibleByUser(userId);
    return accessRecords.map((item) => ({
      id: item.patient.id,
      fullName: item.patient.fullName,
      dateOfBirth: item.patient.dateOfBirth,
      profileImage: item.patient.profileImage,
      preferredLanguage: item.patient.preferredLanguage,
      biography: item.patient.biography,
      personId: item.patient.personId,
      isDemo: item.patient.isDemo,
      relationship: item.relationship,
      accessRole: item.accessRole,
      createdAt: item.patient.createdAt
    }));
  }

  async getPatient(patientId: string, userId?: string, isPatientSession: boolean = false) {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new AppError('PATIENT_NOT_FOUND', 'Patient resource not found.', 404);
    }

    let accessRole: string = 'PATIENT';
    if (userId) {
      const access = await patientRepository.findAccess(userId, patientId);
      if (access) {
        accessRole = access.accessRole;
      }
    }

    return {
      id: patient.id,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      profileImage: patient.profileImage,
      preferredLanguage: patient.preferredLanguage,
      biography: patient.biography,
      personId: patient.personId,
      isDemo: patient.isDemo,
      accessRole,
      createdAt: patient.createdAt
    };
  }

  async createPatient(userId: string, input: {
    fullName: string;
    relationship: string;
    dateOfBirth?: string | null;
    profileImage?: string | null;
    preferredLanguage?: string;
    biography?: string | null;
  }) {
    const dob = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    const { patient, access, selfPerson } = await patientRepository.createPatientWithSelfPerson({
      userId,
      fullName: input.fullName,
      relationship: input.relationship,
      dateOfBirth: dob,
      profileImage: input.profileImage || null,
      preferredLanguage: input.preferredLanguage || 'en',
      biography: input.biography || null
    });

    return {
      id: patient.id,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      profileImage: patient.profileImage,
      preferredLanguage: patient.preferredLanguage,
      biography: patient.biography,
      personId: selfPerson.id,
      isDemo: patient.isDemo,
      relationship: access.relationship,
      accessRole: access.accessRole,
      createdAt: patient.createdAt
    };
  }

  async updatePatient(patientId: string, userId: string, input: {
    fullName?: string;
    dateOfBirth?: string | null;
    profileImage?: string | null;
    preferredLanguage?: string;
    biography?: string | null;
  }) {
    const dob = input.dateOfBirth ? new Date(input.dateOfBirth) : input.dateOfBirth === null ? null : undefined;
    const updated = await patientRepository.update(patientId, {
      fullName: input.fullName,
      dateOfBirth: dob,
      profileImage: input.profileImage,
      preferredLanguage: input.preferredLanguage,
      biography: input.biography
    });

    return {
      id: updated.id,
      fullName: updated.fullName,
      dateOfBirth: updated.dateOfBirth,
      profileImage: updated.profileImage,
      preferredLanguage: updated.preferredLanguage,
      biography: updated.biography,
      personId: updated.personId,
      isDemo: updated.isDemo,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  }

  async deletePatient(patientId: string, userId: string) {
    const deleted = await patientRepository.softDelete(patientId, userId);
    return {
      id: deleted.id,
      deletedAt: deleted.deletedAt
    };
  }
}

export const patientService = new PatientService();

