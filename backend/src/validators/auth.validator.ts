import { z } from 'zod';

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '1234567890',
  '123456789',
  '12345678',
  'qwertyuiop',
  'admin12345',
  'welcome123',
  'letmein123',
  'iloveyou123',
  'memorybridge'
]);

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .refine(
      (val) => Buffer.byteLength(val, 'utf8') <= 72,
      'Password must not exceed 72 bytes'
    )
    .refine(
      (val) => !COMMON_PASSWORDS.has(val.toLowerCase()),
      'Password is too common or easily guessable'
    ),
  name: z.string().trim().min(1, 'Name is required'),
  role: z.enum(['CAREGIVER', 'FAMILY_MEMBER']).optional().default('FAMILY_MEMBER')
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const createPatientSchema = z.object({
  fullName: z.string().trim().min(1, 'Patient full name is required'),
  dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  profileImage: z.string().optional(),
  preferredLanguage: z.string().default('en'),
  biography: z.string().optional(),
  relationship: z.string().default('Primary Caregiver')
});

export const createPatientSessionSchema = z.object({
  durationMinutes: z.coerce.number().min(15).max(43200).default(1440)
});

