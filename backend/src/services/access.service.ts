import { AccessRole } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const editableRoles = [AccessRole.CAREGIVER, AccessRole.FAMILY, AccessRole.VIEWER] as const;

export class AccessService {
  async listMembers(patientId: string, currentUserId: string) {
    const accessRecords = await prisma.patientAccess.findMany({
      where: { patientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        }
      },
      orderBy: [{ accessRole: 'asc' }, { createdAt: 'asc' }]
    });

    return accessRecords.map((access) => ({
      id: access.id,
      user: access.user,
      relationship: access.relationship,
      accessRole: access.accessRole,
      isCurrentUser: access.userId === currentUserId,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt
    }));
  }

  async updateMember(
    patientId: string,
    accessId: string,
    actorId: string,
    input: { accessRole: typeof editableRoles[number]; relationship?: string }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.patientAccess.findUnique({ where: { id: accessId } });
      if (!existing || existing.patientId !== patientId) {
        throw new AppError('ACCESS_NOT_FOUND', 'Family access record not found.', 404);
      }
      if (existing.accessRole === AccessRole.OWNER) {
        throw new AppError('OWNER_ACCESS_PROTECTED', 'The workspace owner cannot be demoted.', 400);
      }

      const updated = await tx.patientAccess.update({
        where: { id: accessId },
        data: {
          accessRole: input.accessRole,
          relationship: input.relationship
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, createdAt: true } }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          patientId,
          action: 'UPDATE_PATIENT_ACCESS',
          resourceType: 'PatientAccess',
          resourceId: accessId,
          metadata: {
            targetUserId: existing.userId,
            previousRole: existing.accessRole,
            accessRole: updated.accessRole,
            previousRelationship: existing.relationship,
            relationship: updated.relationship
          }
        }
      });

      return {
        id: updated.id,
        user: updated.user,
        relationship: updated.relationship,
        accessRole: updated.accessRole,
        isCurrentUser: updated.userId === actorId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      };
    });
  }

  async removeMember(patientId: string, accessId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.patientAccess.findUnique({
        where: { id: accessId },
        include: { user: { select: { name: true, email: true } } }
      });
      if (!existing || existing.patientId !== patientId) {
        throw new AppError('ACCESS_NOT_FOUND', 'Family access record not found.', 404);
      }
      if (existing.accessRole === AccessRole.OWNER) {
        throw new AppError('OWNER_ACCESS_PROTECTED', 'The workspace owner cannot be removed.', 400);
      }

      await tx.patientAccess.delete({ where: { id: accessId } });
      await tx.auditLog.create({
        data: {
          actorId,
          patientId,
          action: 'REVOKE_PATIENT_ACCESS',
          resourceType: 'PatientAccess',
          resourceId: accessId,
          metadata: {
            targetUserId: existing.userId,
            targetName: existing.user.name,
            targetEmail: existing.user.email,
            previousRole: existing.accessRole,
            relationship: existing.relationship
          }
        }
      });

      return { id: accessId, revoked: true };
    });
  }
}

export const accessService = new AccessService();
