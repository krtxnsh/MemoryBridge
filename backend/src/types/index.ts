import { User, PatientProfile, PatientAccess, PatientSession, UserRole, AccessRole } from '@prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tokenVersion: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      patient?: PatientProfile;
      patientAccess?: PatientAccess;
      patientSession?: PatientSession;
    }
  }
}

