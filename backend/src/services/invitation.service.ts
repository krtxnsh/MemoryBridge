import crypto from 'node:crypto';
import { AccessRole, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function normalizeCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(normalizeCode(code)).digest('hex');
}

function generateCode(): string {
  const bytes = crypto.randomBytes(10);
  const raw = Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join('');
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

export class InvitationService {
  async create(
    patientId: string,
    userId: string,
    input: { accessRole: 'FAMILY' | 'VIEWER'; relationship: string; expiresInHours: number }
  ) {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);

    const invitation = await prisma.$transaction(async (tx) => {
      const created = await tx.patientInvitation.create({
        data: {
          patientId,
          createdBy: userId,
          codeHash: hashCode(code),
          accessRole: input.accessRole as AccessRole,
          relationship: input.relationship,
          expiresAt
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'CREATE_FAMILY_INVITATION',
          resourceType: 'PatientInvitation',
          resourceId: created.id,
          metadata: {
            accessRole: created.accessRole,
            relationship: created.relationship,
            expiresAt: created.expiresAt.toISOString()
          }
        }
      });

      return created;
    });

    return {
      id: invitation.id,
      code,
      patientId: invitation.patientId,
      accessRole: invitation.accessRole,
      relationship: invitation.relationship,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt
    };
  }

  async list(patientId: string) {
    const invitations = await prisma.patientInvitation.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        accessRole: true,
        relationship: true,
        expiresAt: true,
        redeemedAt: true,
        redeemedBy: true,
        revokedAt: true,
        createdAt: true
      }
    });

    const now = new Date();
    return invitations.map((invitation) => ({
      ...invitation,
      status: invitation.redeemedAt
        ? 'REDEEMED'
        : invitation.revokedAt
          ? 'REVOKED'
          : invitation.expiresAt <= now
            ? 'EXPIRED'
            : 'ACTIVE'
    }));
  }

  async revoke(patientId: string, invitationId: string, userId: string) {
    const invitation = await prisma.patientInvitation.findFirst({
      where: { id: invitationId, patientId }
    });

    if (!invitation) {
      throw new AppError('INVITATION_NOT_FOUND', 'Invitation not found.', 404);
    }

    if (invitation.redeemedAt) {
      throw new AppError('INVITATION_ALREADY_REDEEMED', 'A redeemed invitation cannot be revoked.', 409);
    }

    const revokedAt = invitation.revokedAt || new Date();
    await prisma.$transaction([
      prisma.patientInvitation.update({
        where: { id: invitation.id },
        data: { revokedAt }
      }),
      prisma.auditLog.create({
        data: {
          actorId: userId,
          patientId,
          action: 'REVOKE_FAMILY_INVITATION',
          resourceType: 'PatientInvitation',
          resourceId: invitation.id
        }
      })
    ]);

    return { id: invitation.id, revokedAt };
  }

  async redeem(userId: string, code: string) {
    const codeHash = hashCode(code);

    try {
      return await prisma.$transaction(async (tx) => {
        const invitation = await tx.patientInvitation.findUnique({
          where: { codeHash },
          include: {
            patient: { select: { id: true, fullName: true, profileImage: true, deletedAt: true } }
          }
        });

        const invalid =
          !invitation ||
          invitation.patient.deletedAt !== null ||
          invitation.revokedAt !== null ||
          invitation.redeemedAt !== null ||
          invitation.expiresAt <= new Date();

        if (invalid || !invitation) {
          throw new AppError('INVALID_INVITATION', 'Invitation code is invalid or has expired.', 400);
        }

        const existingAccess = await tx.patientAccess.findUnique({
          where: { userId_patientId: { userId, patientId: invitation.patientId } }
        });
        if (existingAccess) {
          throw new AppError('ALREADY_A_MEMBER', 'You already have access to this family workspace.', 409);
        }

        const access = await tx.patientAccess.create({
          data: {
            userId,
            patientId: invitation.patientId,
            relationship: invitation.relationship,
            accessRole: invitation.accessRole
          }
        });

        const redeemedAt = new Date();
        await tx.patientInvitation.update({
          where: { id: invitation.id },
          data: { redeemedAt, redeemedBy: userId }
        });
        await tx.auditLog.create({
          data: {
            actorId: userId,
            patientId: invitation.patientId,
            action: 'REDEEM_FAMILY_INVITATION',
            resourceType: 'PatientInvitation',
            resourceId: invitation.id,
            metadata: { accessRole: access.accessRole, relationship: access.relationship }
          }
        });

        return {
          patient: {
            id: invitation.patient.id,
            fullName: invitation.patient.fullName,
            profileImage: invitation.patient.profileImage
          },
          accessRole: access.accessRole,
          relationship: access.relationship,
          redeemedAt
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('INVITATION_ALREADY_USED', 'Invitation code has already been used.', 409);
      }
      throw error;
    }
  }
}

export const invitationService = new InvitationService();
